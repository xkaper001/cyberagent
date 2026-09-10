import os
import sys
import shutil
import asyncio
import time
import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional, Tuple

from backend.execution.manager import execution_manager
from backend.execution.sandbox import sandbox_runner

class WorkspaceSession:
    def __init__(self, assessment_id: str, base_dir: Path):
        self.assessment_id = assessment_id
        self.workspace_id = f"ws_{assessment_id}"
        self.root_path = base_dir / "workspaces" / assessment_id
        self.root_path.mkdir(parents=True, exist_ok=True)

        # Standard workspace directory hierarchy
        (self.root_path / "files").mkdir(exist_ok=True)
        (self.root_path / "scripts").mkdir(exist_ok=True)
        (self.root_path / "outputs").mkdir(exist_ok=True)
        (self.root_path / "artifacts").mkdir(exist_ok=True)
        (self.root_path / "tmp").mkdir(exist_ok=True)

        self.status = "running"
        self.created_at = datetime.datetime.utcnow().isoformat() + "Z"
        self.last_activity = self.created_at
        self.installed_packages = ["nmap", "dnsutils", "curl", "python3"]
        self.history: List[Dict[str, Any]] = []

    def update_activity(self):
        self.last_activity = datetime.datetime.utcnow().isoformat() + "Z"

    def list_files(self, subpath: str = "") -> List[Dict[str, Any]]:
        self.update_activity()
        target_dir = (self.root_path / subpath.lstrip("/")).resolve()
        if not str(target_dir).startswith(str(self.root_path.resolve())):
            raise ValueError("Access denied: path escapes workspace sandbox.")

        items = []
        if not target_dir.exists():
            return items

        for p in target_dir.iterdir():
            rel = p.relative_to(self.root_path)
            items.append({
                "name": p.name,
                "path": f"/workspace/{rel.as_posix()}",
                "is_dir": p.is_dir(),
                "size_bytes": p.stat().st_size if p.is_file() else 0,
                "modified": datetime.datetime.fromtimestamp(p.stat().st_mtime).isoformat() + "Z"
            })
        return sorted(items, key=lambda x: (not x["is_dir"], x["name"]))

    def read_file(self, rel_path: str) -> str:
        self.update_activity()
        clean_rel = rel_path.replace("/workspace/", "").lstrip("/")
        target_file = (self.root_path / clean_rel).resolve()
        if not str(target_file).startswith(str(self.root_path.resolve())):
            raise ValueError("Access denied: path escapes workspace sandbox.")
        if not target_file.exists() or not target_file.is_file():
            raise FileNotFoundError(f"File '{rel_path}' not found in workspace.")
        return target_file.read_text(encoding="utf-8", errors="replace")

    def write_file(self, rel_path: str, content: str) -> Dict[str, Any]:
        self.update_activity()
        clean_rel = rel_path.replace("/workspace/", "").lstrip("/")
        target_file = (self.root_path / clean_rel).resolve()
        if not str(target_file).startswith(str(self.root_path.resolve())):
            raise ValueError("Access denied: path escapes workspace sandbox.")

        target_file.parent.mkdir(parents=True, exist_ok=True)
        target_file.write_text(content, encoding="utf-8")
        return {
            "path": f"/workspace/{clean_rel}",
            "size_bytes": len(content.encode("utf-8")),
            "status": "created"
        }

    def execute_command(self, command: str, actor: str = "agent", timeout: int = 120) -> Dict[str, Any]:
        """
        Executes command through isolated ExecutionManager sandbox engine.
        Never runs arbitrary shell directly on host OS.
        """
        self.update_activity()
        start_t = time.time()

        stdout_chunks = []
        stderr_chunks = []
        exit_code = 0

        async def run_exec():
            nonlocal exit_code
            async for evt in execution_manager.execute_terminal_command(
                command=command,
                assessment_id=self.assessment_id,
                actor=actor,
                timeout=timeout
            ):
                if evt.get("type") == "stdout":
                    stdout_chunks.append(evt.get("data", ""))
                elif evt.get("type") == "stderr":
                    stderr_chunks.append(evt.get("data", ""))
                elif evt.get("type") == "exit":
                    exit_code = evt.get("exit_code", 0)

        import concurrent.futures
        def run_sync():
            try:
                loop = asyncio.get_running_loop()
            except RuntimeError:
                loop = None

            if loop and loop.is_running():
                with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                    future = executor.submit(asyncio.run, run_exec())
                    future.result()
            else:
                asyncio.run(run_exec())

        run_sync()

        duration_ms = int((time.time() - start_t) * 1000)
        stdout_str = "".join(stdout_chunks)
        stderr_str = "".join(stderr_chunks)

        record = {
            "execution_id": f"exec_{int(time.time() * 1000)}",
            "workspace_id": self.workspace_id,
            "assessment_id": self.assessment_id,
            "actor": actor,
            "command": command,
            "status": "completed" if exit_code == 0 else "failed",
            "exit_code": exit_code,
            "stdout": stdout_str,
            "stderr": stderr_str,
            "duration_ms": duration_ms
        }
        self.history.append(record)
        return record

    def install_package(self, package_name: str) -> Dict[str, Any]:
        self.update_activity()
        allowed_packages = [
            "nmap", "dnsutils", "curl", "python3", "python3-pip",
            "jq", "netcat", "traceroute", "whois", "tcpdump", "wget", "ncat"
        ]
        pkg_clean = package_name.strip().lower()
        if pkg_clean not in allowed_packages:
            return {
                "status": "rejected",
                "package": pkg_clean,
                "error": f"Package '{pkg_clean}' is not in approved security workspace allowlist."
            }

        if pkg_clean not in self.installed_packages:
            self.installed_packages.append(pkg_clean)

        return {
            "status": "installed",
            "package": pkg_clean,
            "installed_packages": self.installed_packages,
            "message": f"Package '{pkg_clean}' registered and active in workspace."
        }


class WorkspaceManager:
    def __init__(self):
        self._workspaces: Dict[str, WorkspaceSession] = {}
        self.base_dir = Path(__file__).resolve().parent.parent.parent / "data"
        self.base_dir.mkdir(parents=True, exist_ok=True)

    def get_or_create_workspace(self, assessment_id: str) -> WorkspaceSession:
        if not assessment_id:
            assessment_id = "default_assessment"

        if assessment_id not in self._workspaces:
            self._workspaces[assessment_id] = WorkspaceSession(assessment_id, self.base_dir)

        return self._workspaces[assessment_id]

    def reset_workspace(self, assessment_id: str) -> WorkspaceSession:
        if assessment_id in self._workspaces:
            ws = self._workspaces[assessment_id]
            shutil.rmtree(ws.root_path, ignore_errors=True)
            del self._workspaces[assessment_id]

        return self.get_or_create_workspace(assessment_id)

    def get_workspace_info(self, assessment_id: str) -> Dict[str, Any]:
        ws = self.get_or_create_workspace(assessment_id)
        term_session = execution_manager.get_or_create_session(assessment_id)
        return {
            "workspace_id": ws.workspace_id,
            "assessment_id": ws.assessment_id,
            "root_path": str(ws.root_path.resolve()),
            "status": ws.status,
            "created_at": ws.created_at,
            "last_activity": ws.last_activity,
            "installed_packages": ws.installed_packages,
            "working_directory": term_session.current_workspace_display_path,
            "history_count": len(ws.history)
        }

workspace_manager = WorkspaceManager()
