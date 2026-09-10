import os
import sys
import json
import time
import uuid
import asyncio
import datetime
from typing import Dict, Any, Optional

from backend.execution.models import ExecutionJob, ExecutionStatus
from backend.execution.policy import execution_policy
from backend.execution.sandbox import sandbox_runner
from backend.security.scope import scope_validator, TargetValidationError
from backend.security.audit import log_security_event

class WorkerManager:
    def __init__(self):
        self.sandbox = sandbox_runner

    def is_docker_available(self) -> bool:
        return self.sandbox.is_docker_available()

    def is_tool_binary_available(self, binary_name: str) -> bool:
        caps = self.sandbox.check_capabilities()
        return caps.get("capabilities", {}).get(binary_name, False)

    def execute_job(
        self,
        agent: str,
        tool: str,
        profile: str,
        target: str,
        options: Optional[Dict[str, Any]] = None,
        task_id: Optional[str] = None
    ) -> ExecutionJob:
        exec_id = f"exec-{uuid.uuid4().hex[:8]}"
        job = ExecutionJob(
            execution_id=exec_id,
            task_id=task_id or f"task-{int(time.time())}",
            agent=agent,
            tool=tool,
            profile=profile,
            target=target,
            status=ExecutionStatus.QUEUED
        )

        # 1. SCOPE VALIDATION
        valid_scope, err_scope = execution_policy.validate_target_scope(target)
        if not valid_scope:
            job.status = ExecutionStatus.BLOCKED
            job.finished_at = datetime.datetime.utcnow().isoformat() + "Z"
            job.stderr = f"Scope Policy Violation: {err_scope}"
            job.error = {
                "code": "TARGET_OUT_OF_SCOPE",
                "message": f"Target '{target}' is outside authorized security testing scope: {err_scope}",
                "retryable": False
            }
            log_security_event(agent, tool, "BLOCKED (Scope Violation)", target)
            return job

        job.status = ExecutionStatus.STARTING
        job.started_at = datetime.datetime.utcnow().isoformat() + "Z"
        log_security_event(agent, tool, f"Execution Started (Profile: {profile})", target)

        # 2. PREPARE PAYLOAD
        payload = {
            "tool": tool,
            "profile": profile,
            "target": target,
            "options": options or {}
        }
        payload_str = json.dumps(payload)

        job.status = ExecutionStatus.RUNNING
        start_t = time.time()

        # Run via entrypoint / sandbox
        python_bin = sys.executable
        entrypoint_path = str(self.sandbox.entrypoint_path.resolve())

        try:
            import subprocess
            if self.is_docker_available():
                docker_cmd = [
                    "docker", "run", "--rm",
                    "--cpus=1.0",
                    "--memory=512m",
                    "--network=bridge",
                    self.sandbox.image_name,
                    payload_str
                ]
                res = subprocess.run(docker_cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, timeout=300)
            else:
                res = subprocess.run(
                    [python_bin, entrypoint_path, payload_str],
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    text=True,
                    timeout=300
                )
            stdout_raw = res.stdout
            stderr_raw = res.stderr
            exit_code = res.returncode
        except subprocess.TimeoutExpired:
            job.status = ExecutionStatus.TIMEOUT
            job.finished_at = datetime.datetime.utcnow().isoformat() + "Z"
            job.duration_seconds = round(time.time() - start_t, 2)
            job.error = {"code": "TIMEOUT", "message": "Execution exceeded timeout threshold (300s)."}
            return job
        except Exception as e:
            job.status = ExecutionStatus.FAILED
            job.finished_at = datetime.datetime.utcnow().isoformat() + "Z"
            job.duration_seconds = round(time.time() - start_t, 2)
            job.error = {"code": "EXECUTION_FAILED", "message": str(e)}
            return job

        job.finished_at = datetime.datetime.utcnow().isoformat() + "Z"
        job.duration_seconds = round(time.time() - start_t, 2)

        # Parse worker output JSON wrapper
        try:
            out_json = json.loads(stdout_raw.strip())
            job.exit_code = out_json.get("exit_code", exit_code)
            job.stdout = out_json.get("stdout", stdout_raw)
            job.stderr = out_json.get("stderr", stderr_raw)
            job.result = out_json.get("parsed_result")

            if out_json.get("error"):
                job.status = ExecutionStatus.FAILED
                job.error = {"code": "EXECUTION_ERROR", "message": out_json.get("error")}
            else:
                job.status = ExecutionStatus.COMPLETED
        except Exception:
            job.exit_code = exit_code
            job.stdout = stdout_raw
            job.stderr = stderr_raw
            job.status = ExecutionStatus.COMPLETED if exit_code == 0 else ExecutionStatus.FAILED
            job.result = {"raw": stdout_raw}
            if exit_code != 0:
                job.error = {"code": "PROCESS_ERROR", "message": stderr_raw or f"Exited with code {exit_code}"}

        return job

worker_manager = WorkerManager()
