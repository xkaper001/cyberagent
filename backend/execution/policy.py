import shlex
from typing import Dict, Any, List, Optional, Tuple
from backend.security.scope import scope_validator, TargetValidationError
from backend.tools.package_catalog import package_catalog

# Base allowed CLI binaries when running outside container isolation
HOST_FALLBACK_BINARIES = {
    "pwd", "ls", "cd", "echo", "cat", "mkdir", "rm", "rmdir", "touch",
    "cp", "mv", "head", "tail", "grep", "find", "wc", "sort", "uniq",
    "which", "where", "env", "printenv", "python", "python3", "pip", "pip3",
    "curl", "dig", "nslookup", "openssl", "nmap", "ncat", "nc", "ping",
    "whois", "traceroute", "jq", "node", "git", "clear", "uname", "id", "tree", "nano", "vim"
}


class ExecutionPolicy:
    def __init__(self):
        self.default_timeout_terminal = 30
        self.default_timeout_agent = 300

    def validate_command(self, raw_command: str) -> Tuple[bool, Optional[str], List[str]]:
        """
        Validates a raw shell command for execution within the sandbox environment.
        Returns (is_valid, error_reason, parsed_tokens).
        """
        trimmed = raw_command.strip()
        if not trimmed:
            return False, "Empty command string provided.", []

        try:
            tokens = shlex.split(trimmed)
        except Exception:
            tokens = trimmed.split()

        if not tokens:
            return False, "Unable to parse command string.", []

        first_tok = tokens[0].lower()

        # Intercept package installation attempts (apt / apt-get / sudo apt / sudo apt-get)
        if first_tok in ["apt", "apt-get"] or (first_tok == "sudo" and len(tokens) > 1 and tokens[1].lower() in ["apt", "apt-get"]):
            # Extract target package name if present
            pkg_name = None
            for idx, tok in enumerate(tokens):
                if tok.lower() in ["install", "add"] and idx + 1 < len(tokens):
                    candidate = tokens[idx + 1]
                    if not candidate.startswith("-"):
                        pkg_name = candidate
                        break

            if pkg_name:
                spec = package_catalog.get_package(pkg_name)
                if spec:
                    return False, (
                        f"Direct terminal package manager commands are intercepted for security. "
                        f"Use 'Manage Tools' or the backend tool manager API to install approved package '{pkg_name}' into the Linux Sandbox."
                    ), tokens
                else:
                    return False, (
                        f"Package '{pkg_name}' is not in the approved CyberAgents package catalog. "
                        f"Allowed on-demand packages: {', '.join(sorted(list(package_catalog.get_catalog().keys())))}"
                    ), tokens
            else:
                return False, "Package manager commands must specify an approved package name. Use the Sandbox Tool Manager UI.", tokens

        if first_tok == "sudo":
            return False, "Direct 'sudo' privilege escalation in interactive terminal is disabled. Use Sandbox Tool Manager for controlled package management.", tokens

        # Dynamic mode check
        from backend.execution.sandbox import sandbox_runner
        is_linux = sandbox_runner.is_real_linux_sandbox()

        if not is_linux:
            if first_tok not in HOST_FALLBACK_BINARIES and not first_tok.endswith(".py") and not first_tok.startswith("./"):
                return False, f"Command binary '{first_tok}' is not permitted in Development Host Shell. Allowed binaries include: {', '.join(sorted(list(HOST_FALLBACK_BINARIES))[:12])}...", tokens

        return True, None, tokens

    def validate_target_scope(self, target: str) -> Tuple[bool, Optional[str]]:
        """
        Validates target authorization against scope policy.
        """
        if not target or target.lower() in ["localhost", "127.0.0.1", "/workspace"]:
            return True, None
        try:
            scope_validator.validate_target(target)
            return True, None
        except TargetValidationError as e:
            return False, str(e)


execution_policy = ExecutionPolicy()
