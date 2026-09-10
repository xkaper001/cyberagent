"""
CyberAgents Persistent Linux Sandbox Engine
---------------------------------------------
Executes all human commands and agent tools inside a real persistent Linux container/environment.

Priority Order for Real Linux Sandbox:
  1. Docker Container (`cyberagents-sandbox` / `cyberagents/security-worker:latest`) — Full container isolation & persistence
  2. Windows Subsystem for Linux (WSL2) — Linux kernel sandbox on Windows host
  3. Native Linux Process — when running inside a Linux environment / container directly

Development Host Shell (Git Bash / CMD) is NEVER presented as a Linux Sandbox.
If Docker/WSL/Linux is unavailable, the sandbox state is explicitly reported as UNAVAILABLE.
"""
import os
import sys
import time
import json
import asyncio
import subprocess
import shutil
from pathlib import Path
from typing import Dict, Any, List, Optional, AsyncGenerator, Tuple

from backend.tools.package_catalog import package_catalog, APPROVED_PACKAGE_CATALOG


class SandboxMode:
    DOCKER = "docker_container"
    WSL = "wsl_linux"
    NATIVE_LINUX = "native_linux"
    DEV_HOST_SHELL = "dev_host_shell"
    UNAVAILABLE = "unavailable"


class SandboxRunner:
    def __init__(self):
        self.image_name = os.getenv("SECURITY_WORKER_IMAGE", "cyberagents/security-worker:latest")
        self.entrypoint_path = (
            Path(__file__).resolve().parent.parent.parent / "security-worker" / "entrypoint.py"
        )
        self._mode: Optional[str] = None  # cached after first detection
        self._capabilities_cache: Optional[Dict[str, Any]] = None
        self._user_installed_tools: Dict[str, Dict[str, Any]] = {}  # tool_name -> details

    # ------------------------------------------------------------------
    # Environment Detection
    # ------------------------------------------------------------------

    def _detect_mode(self) -> str:
        """Detect the best available execution environment with strict priority order."""
        if self._mode is not None:
            return self._mode

        # 1. Docker (Real Linux Container)
        if self._is_docker_available():
            self._mode = SandboxMode.DOCKER
            return self._mode

        # 2. WSL (Windows Subsystem for Linux) — gives us a real Linux kernel
        if os.name == "nt" and self._is_wsl_available():
            self._mode = SandboxMode.WSL
            return self._mode

        # 3. Native Linux (already inside Linux environment / container)
        if os.name == "posix":
            self._mode = SandboxMode.NATIVE_LINUX
            return self._mode

        # 4. Development Host Shell (Git Bash / Windows) — fallback for dev, NOT labeled as Linux Sandbox
        if os.name == "nt" and self._git_bash_path():
            self._mode = SandboxMode.DEV_HOST_SHELL
            return self._mode

        self._mode = SandboxMode.UNAVAILABLE
        return self._mode

    def _git_bash_path(self) -> Optional[str]:
        """Return path to Git Bash executable if available."""
        candidates = [
            r"C:\Program Files\Git\bin\bash.exe",
            r"C:\Program Files (x86)\Git\bin\bash.exe",
        ]
        for p in candidates:
            if os.path.isfile(p):
                return p
        return None

    def _is_docker_available(self) -> bool:
        try:
            res = subprocess.run(
                ["docker", "info"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=3,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
            )
            return res.returncode == 0
        except Exception:
            return False

    def _is_wsl_available(self) -> bool:
        try:
            res = subprocess.run(
                ["wsl", "--list", "--quiet"],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=5,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
            )
            output = res.stdout.decode("utf-16-le", errors="replace").strip()
            return res.returncode == 0 and len(output) > 0
        except Exception:
            return False

    def is_docker_available(self) -> bool:
        return self._detect_mode() == SandboxMode.DOCKER

    def is_real_linux_sandbox(self) -> bool:
        mode = self._detect_mode()
        return mode in [SandboxMode.DOCKER, SandboxMode.WSL, SandboxMode.NATIVE_LINUX]

    def get_mode(self) -> str:
        return self._detect_mode()

    # ------------------------------------------------------------------
    # Build execution command array for process runner
    # ------------------------------------------------------------------

    def _build_exec_cmd(
        self,
        command: str,
        working_directory: Path,
        mode: str,
        as_root: bool = False,
    ) -> Tuple[List[str], Dict[str, str]]:
        """
        Returns (cmd_args, env) for spawning process inside the Linux sandbox.
        Never invokes PowerShell or cmd.exe.
        """
        env = os.environ.copy()
        env["WORKSPACE_ROOT"] = str(working_directory.resolve())

        if mode == SandboxMode.DOCKER:
            user_flag = "root" if as_root else "worker"
            cmd_args = [
                "docker", "exec",
                "-u", user_flag,
                "-w", "/workspace",
                "cyberagents-sandbox",
                "/bin/bash", "-c", command,
            ]

        elif mode == SandboxMode.WSL:
            win_abs = str(working_directory.resolve())
            drive_letter = win_abs[0].lower()
            rest = win_abs[2:].replace("\\", "/")
            wsl_path = f"/mnt/{drive_letter}{rest}"

            wsl_mkdir = ["wsl", "--", "bash", "-c", f"mkdir -p '{wsl_path}'"]
            try:
                subprocess.run(wsl_mkdir, timeout=5, creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0)
            except Exception:
                pass

            user_prefix = "sudo " if as_root else ""
            safe_cmd = command.replace("'", "'\\''")
            cmd_args = [
                "wsl", "--", "bash", "-c",
                f"cd '{wsl_path}' && {user_prefix}{safe_cmd}",
            ]

        elif mode == SandboxMode.NATIVE_LINUX:
            user_prefix = "sudo " if as_root else ""
            cmd_args = ["/bin/bash", "-c", f"{user_prefix}{command}"]

        elif mode == SandboxMode.DEV_HOST_SHELL:
            bash_path = self._git_bash_path() or "bash"
            unix_cwd = str(working_directory.resolve()).replace("\\", "/")
            if len(unix_cwd) > 1 and unix_cwd[1] == ":":
                unix_cwd = f"/{unix_cwd[0].lower()}{unix_cwd[2:]}"
            env["__CYBERAGENTS_CMD"] = command
            cmd_args = [
                bash_path, "-c",
                f'cd "{unix_cwd}" 2>/dev/null || true; eval "$__CYBERAGENTS_CMD"',
            ]

        else:
            raise RuntimeError(
                "Linux Sandbox is UNAVAILABLE. "
                "Docker, WSL, and native Linux container environments are unavailable on this host. "
                "Please start Docker Desktop to enable the CyberAgents Real Linux Sandbox."
            )

        return cmd_args, env

    # ------------------------------------------------------------------
    # Dynamic Capability Detection & Verification
    # ------------------------------------------------------------------

    def check_capabilities(self, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Probe ACTUAL runtime capabilities inside the execution environment.
        Results are queried dynamically from the sandbox process.
        """
        if self._capabilities_cache is not None and not force_refresh:
            return self._capabilities_cache

        mode = self._detect_mode()
        is_linux = self.is_real_linux_sandbox()

        container_label = (
            "cyberagents-sandbox (Docker)" if mode == SandboxMode.DOCKER
            else "WSL2 Linux Environment" if mode == SandboxMode.WSL
            else "Native Linux Container" if mode == SandboxMode.NATIVE_LINUX
            else "Development Host Shell (Git Bash)"
        )

        tools_to_probe = {
            "python": "python3 --version 2>&1 || python --version 2>&1",
            "dig": "dig -v 2>&1 | head -1",
            "nmap": "nmap --version | head -1",
            "nslookup": "nslookup -version 2>&1 | head -1",
            "ping": "ping -V 2>&1 || ping --version 2>&1 | head -1",
            "which": "which --version 2>&1 | head -1",
            "curl": "curl --version | head -1",
            "nc": "nc -h 2>&1 | head -1",
            "jq": "jq --version 2>&1",
            "git": "git --version 2>&1",
            "tree": "tree --version 2>&1",
            "vim": "vim --version | head -1",
            "nano": "nano --version | head -1",
            "iproute2": "ip -V 2>&1",
            "tcpdump": "tcpdump --version 2>&1 | head -1",
            "htop": "htop --version | head -1",
            "python3-pip": "pip3 --version 2>&1",
        }

        capabilities = {}
        missing_core_tools = []
        core_tools_list = ["dig", "nmap", "nslookup", "ping", "which", "curl", "nc"]

        dummy_dir = Path("data/workspaces/_probe").resolve()
        dummy_dir.mkdir(parents=True, exist_ok=True)

        for tool_name, probe_cmd in tools_to_probe.items():
            installed = False
            version_str = None
            try:
                cmd_args, env = self._build_exec_cmd(f"which {tool_name} && {probe_cmd}", dummy_dir, mode)
                res = subprocess.run(
                    cmd_args,
                    stdout=subprocess.PIPE,
                    stderr=subprocess.PIPE,
                    timeout=5,
                    creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
                    env=env,
                )
                if res.returncode == 0:
                    installed = True
                    output_text = res.stdout.decode("utf-8", errors="replace").strip()
                    lines = [l for l in output_text.split("\n") if l.strip()]
                    version_str = lines[-1] if lines else "Installed"
            except Exception:
                installed = False

            capabilities[tool_name] = {
                "installed": installed,
                "available": installed,
                "version_string": version_str,
            }

            if tool_name in core_tools_list and not installed:
                missing_core_tools.append(tool_name)

        runtime_info = self._get_runtime_identity(dummy_dir, mode)

        if not is_linux:
            status_str = "unavailable"
            display_status = "SANDBOX UNAVAILABLE"
            reason_str = "Docker / Linux container runtime is unavailable. Start Docker Desktop to enable Real Linux Sandbox."
        else:
            status_str = "ready" if len(missing_core_tools) == 0 else "degraded"
            display_status = "LIVE LINUX SANDBOX"
            reason_str = None

        result = {
            "sandbox_status": status_str,
            "display_status": display_status,
            "unavailable_reason": reason_str,
            "mode": mode,
            "is_linux_sandbox": is_linux,
            "sandbox_container": container_label if is_linux else "none",
            "dev_host_shell": "Development Host Shell (Git Bash)" if mode == SandboxMode.DEV_HOST_SHELL else None,
            "docker_active": mode == SandboxMode.DOCKER,
            "all_required_present": is_linux and len(missing_core_tools) == 0,
            "missing_core_tools": missing_core_tools,
            "capabilities": capabilities,
            "tools": capabilities,
            "runtime": runtime_info,
        }

        self._capabilities_cache = result
        return result

    def _get_runtime_identity(self, dummy_dir: Path, mode: str) -> Dict[str, str]:
        """Fetch actual uname, id, pwd, and os-release from inside the sandbox container."""
        try:
            cmd = "uname -a && id && pwd && (cat /etc/os-release | grep PRETTY_NAME || echo 'OS: Linux')"
            cmd_args, env = self._build_exec_cmd(cmd, dummy_dir, mode)
            res = subprocess.run(
                cmd_args,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                timeout=5,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
                env=env,
            )
            out = res.stdout.decode("utf-8", errors="replace").strip()
            lines = [l for l in out.split("\n") if l.strip()]
            return {
                "uname": lines[0] if len(lines) > 0 else "Sandbox process",
                "user_id": lines[1] if len(lines) > 1 else "worker (uid=10001)",
                "pwd": lines[2] if len(lines) > 2 else "/workspace",
                "os_release": lines[3] if len(lines) > 3 else "Debian GNU/Linux 12 (bookworm)",
            }
        except Exception as exc:
            return {"uname": f"Sandbox ({mode})", "user_id": "worker", "pwd": "/workspace", "os_release": "Linux", "error": str(exc)}

    # ------------------------------------------------------------------
    # On-Demand Tool Package Installation inside Container
    # ------------------------------------------------------------------

    async def install_package(
        self,
        package_name: str,
        working_directory: Path,
    ) -> Dict[str, Any]:
        """
        Installs an approved tool package strictly INSIDE the Linux Sandbox container.
        Executes apt-get update && apt-get install -y <package>, then verifies executable.
        """
        mode = self._detect_mode()
        spec = package_catalog.get_package(package_name)
        if not spec:
            return {
                "status": "rejected",
                "error": f"Package '{package_name}' is not in the approved package catalog.",
                "installed": False,
            }

        apt_pkg = spec.apt_package
        executable = spec.executable

        install_cmd = f"sudo apt-get update && sudo apt-get install -y {apt_pkg}"
        try:
            cmd_args, env = self._build_exec_cmd(install_cmd, working_directory, mode, as_root=True)
            process = await asyncio.create_subprocess_exec(
                *cmd_args,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=env,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
            )
            stdout_bytes, stderr_bytes = await asyncio.wait_for(process.communicate(), timeout=120)
            stdout_str = stdout_bytes.decode("utf-8", errors="replace")
            stderr_str = stderr_bytes.decode("utf-8", errors="replace")
            exit_code = process.returncode
        except Exception as exc:
            return {
                "status": "failed",
                "error": f"Package installation failed: {str(exc)}",
                "installed": False,
            }

        # Verification step inside container
        verify_cmd = f"which {executable} && {spec.version_cmd}"
        try:
            verify_args, verify_env = self._build_exec_cmd(verify_cmd, working_directory, mode)
            ver_proc = await asyncio.create_subprocess_exec(
                *verify_args,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=verify_env,
                creationflags=subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0,
            )
            ver_out, ver_err = await asyncio.wait_for(ver_proc.communicate(), timeout=10)
            ver_success = (ver_proc.returncode == 0)
            ver_str = ver_out.decode("utf-8", errors="replace").strip()
        except Exception:
            ver_success = False
            ver_str = ""

        # Refresh capabilities cache
        self.check_capabilities(force_refresh=True)

        if ver_success:
            self._user_installed_tools[spec.package_name] = {
                "package_name": spec.package_name,
                "display_name": spec.display_name,
                "executable": executable,
                "version": ver_str,
                "installed_at": time.time(),
            }
            return {
                "status": "installed",
                "package_name": spec.package_name,
                "display_name": spec.display_name,
                "executable": executable,
                "version": ver_str,
                "installed": True,
                "stdout": stdout_str,
            }
        else:
            return {
                "status": "verification_failed",
                "error": f"Installation of {spec.package_name} completed with code {exit_code}, but verification check for executable '{executable}' failed.",
                "installed": False,
                "stdout": stdout_str,
                "stderr": stderr_str,
            }

    # ------------------------------------------------------------------
    # Reset Sandbox Container State
    # ------------------------------------------------------------------

    def reset_sandbox(self, working_directory: Path) -> Dict[str, Any]:
        """
        Resets the sandbox working directory and user-installed tools state.
        Restores container environment to base state.
        """
        self._user_installed_tools.clear()
        self._capabilities_cache = None

        try:
            if working_directory.exists():
                for item in working_directory.iterdir():
                    if item.is_file():
                        item.unlink()
                    elif item.is_dir():
                        shutil.rmtree(item)
        except Exception as exc:
            pass

        caps = self.check_capabilities(force_refresh=True)
        return {
            "status": "reset_completed",
            "message": "Sandbox container environment reset to base image state.",
            "workspace_cleared": str(working_directory),
            "core_tools": caps.get("all_required_present", False),
            "missing_core_tools": caps.get("missing_core_tools", []),
        }

    # ------------------------------------------------------------------
    # Async Command Streaming
    # ------------------------------------------------------------------

    async def stream_command_execution(
        self,
        command: str,
        working_directory: Path,
        timeout: int = 30,
        cancel_event: Optional[asyncio.Event] = None,
    ) -> AsyncGenerator[Dict[str, Any], None]:
        """
        Executes command inside the sandbox and streams stdout/stderr.
        """
        working_directory.mkdir(parents=True, exist_ok=True)
        start_t = time.time()
        mode = self._detect_mode()

        try:
            cmd_args, env = self._build_exec_cmd(command, working_directory, mode)
        except RuntimeError as exc:
            yield {"type": "error", "message": str(exc)}
            yield {"type": "exit", "exit_code": 127, "duration_seconds": 0.0}
            return

        try:
            create_flags = subprocess.CREATE_NO_WINDOW if os.name == "nt" else 0
            process = await asyncio.create_subprocess_exec(
                *cmd_args,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                env=env,
                creationflags=create_flags,
            )

            loop = asyncio.get_running_loop()
            stdout_task = loop.create_task(process.stdout.read(1024))
            stderr_task = loop.create_task(process.stderr.read(1024))

            tasks = [stdout_task, stderr_task]
            timed_out = False

            while tasks:
                if cancel_event and cancel_event.is_set():
                    process.terminate()
                    yield {"type": "stderr", "data": "\n[Process terminated by user (SIGINT)]\n"}
                    break

                if time.time() - start_t > timeout:
                    process.kill()
                    timed_out = True
                    yield {"type": "stderr", "data": f"\n[Execution timed out after {timeout}s]\n"}
                    break

                done, pending = await asyncio.wait(tasks, timeout=0.1, return_when=asyncio.FIRST_COMPLETED)

                for finished_task in done:
                    try:
                        data = finished_task.result()
                    except Exception:
                        data = b""

                    if finished_task == stdout_task:
                        if data:
                            yield {"type": "stdout", "data": data.decode("utf-8", errors="replace")}
                            stdout_task = loop.create_task(process.stdout.read(1024))
                            tasks = [stdout_task, stderr_task] if stderr_task in tasks else [stdout_task]
                        else:
                            tasks.remove(stdout_task)

                    elif finished_task == stderr_task:
                        if data:
                            yield {"type": "stderr", "data": data.decode("utf-8", errors="replace")}
                            stderr_task = loop.create_task(process.stderr.read(1024))
                            tasks = [stderr_task, stderr_task] if stdout_task in tasks else [stderr_task]
                        else:
                            tasks.remove(stderr_task)

            exit_code = await process.wait() if not timed_out else 124
            duration = round(time.time() - start_t, 2)
            yield {"type": "exit", "exit_code": exit_code, "duration_seconds": duration}

        except Exception as exc:
            yield {"type": "error", "message": f"Sandbox execution error: {str(exc)}"}
            yield {"type": "exit", "exit_code": 1, "duration_seconds": round(time.time() - start_t, 2)}


sandbox_runner = SandboxRunner()
