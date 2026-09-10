import os
import time
import json
import uuid
import asyncio
import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, AsyncGenerator, Tuple

from backend.execution.policy import execution_policy
from backend.execution.sandbox import sandbox_runner
from backend.execution.models import ExecutionJob, ExecutionStatus
from backend.security.audit import log_security_event

class TerminalSession:
    def __init__(self, session_id: str, assessment_id: str, base_workspace_dir: Path):
        self.session_id = session_id
        self.assessment_id = assessment_id
        self.base_workspace_dir = base_workspace_dir / "workspaces" / assessment_id
        self.base_workspace_dir.mkdir(parents=True, exist_ok=True)
        
        # Current working directory relative to base workspace
        self.current_rel_dir = Path(".")
        self.cancel_event: Optional[asyncio.Event] = None
        self.created_at = datetime.datetime.utcnow().isoformat() + "Z"

    @property
    def current_absolute_path(self) -> Path:
        return (self.base_workspace_dir / self.current_rel_dir).resolve()

    @property
    def current_workspace_display_path(self) -> str:
        rel = self.current_absolute_path.relative_to(self.base_workspace_dir.resolve())
        posix_rel = rel.as_posix()
        if posix_rel == ".":
            return "/workspace"
        return f"/workspace/{posix_rel}"

    def change_directory(self, target_path_str: str) -> Tuple[bool, str]:
        target_path_str = target_path_str.strip()
        if not target_path_str or target_path_str == "~" or target_path_str == "/workspace":
            self.current_rel_dir = Path(".")
            return True, self.current_workspace_display_path

        if target_path_str.startswith("/workspace"):
            clean = target_path_str.replace("/workspace", "").lstrip("/\\")
            candidate = (self.base_workspace_dir / clean).resolve()
        elif os.path.isabs(target_path_str):
            # Attempt to resolve absolute path relative to base_workspace_dir
            candidate = Path(target_path_str).resolve()
        else:
            candidate = (self.current_absolute_path / target_path_str).resolve()

        # Enforce sandbox boundary check
        base_resolved = self.base_workspace_dir.resolve()
        if not str(candidate).startswith(str(base_resolved)):
            return False, f"bash: cd: {target_path_str}: Access denied (Escapes sandbox boundary)"

        if not candidate.exists() or not candidate.is_dir():
            return False, f"bash: cd: {target_path_str}: No such file or directory"

        self.current_rel_dir = candidate.relative_to(base_resolved)
        return True, self.current_workspace_display_path


class ExecutionManager:
    def __init__(self):
        self._sessions: Dict[str, TerminalSession] = {}
        self.base_data_dir = Path(__file__).resolve().parent.parent.parent / "data"
        self.base_data_dir.mkdir(parents=True, exist_ok=True)

    def get_or_create_session(self, assessment_id: str, session_id: Optional[str] = None) -> TerminalSession:
        sid = session_id or f"term_{assessment_id}"
        if sid not in self._sessions:
            self._sessions[sid] = TerminalSession(sid, assessment_id, self.base_data_dir)
        return self._sessions[sid]

    def interrupt_session(self, assessment_id: str, session_id: Optional[str] = None) -> bool:
        sid = session_id or f"term_{assessment_id}"
        session = self._sessions.get(sid)
        if session and session.cancel_event:
            session.cancel_event.set()
            return True
        return False

    async def execute_terminal_command(
        self,
        command: str,
        assessment_id: str,
        actor: str = "human",
        session_id: Optional[str] = None,
        timeout: int = 30
    ) -> AsyncGenerator[Dict[str, Any], None]:
        session = self.get_or_create_session(assessment_id, session_id)
        session.cancel_event = asyncio.Event()

        trimmed_cmd = command.strip()

        # 1. Handle 'cd' shell built-in directly in session state
        if trimmed_cmd == "cd" or trimmed_cmd.startswith("cd "):
            target_dir = trimmed_cmd[2:].strip()
            ok, res_msg = session.change_directory(target_dir)
            if ok:
                yield {"type": "stdout", "data": f"Working directory changed to: {res_msg}\r\n"}
                yield {"type": "exit", "exit_code": 0, "duration_seconds": 0.0}
            else:
                yield {"type": "stderr", "data": f"{res_msg}\r\n"}
                yield {"type": "exit", "exit_code": 1, "duration_seconds": 0.0}
            return

        # 2. Validate policy
        valid, err_msg, tokens = execution_policy.validate_command(trimmed_cmd)
        if not valid:
            yield {"type": "stderr", "data": f"Execution Policy Error: {err_msg}\r\n"}
            yield {"type": "exit", "exit_code": 126, "duration_seconds": 0.0}
            log_security_event(actor, trimmed_cmd, f"BLOCKED Policy Violation ({err_msg})", session.current_workspace_display_path)
            return

        log_security_event(actor, trimmed_cmd, "EXECUTED", session.current_workspace_display_path)

        # 3. Stream execution from sandbox
        async for evt in sandbox_runner.stream_command_execution(
            command=trimmed_cmd,
            working_directory=session.current_absolute_path,
            timeout=timeout,
            cancel_event=session.cancel_event
        ):
            yield evt

execution_manager = ExecutionManager()
