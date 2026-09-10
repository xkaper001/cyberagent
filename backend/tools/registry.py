from typing import Dict, Any, List, Optional
from pydantic import BaseModel
from backend.security.scope import scope_validator
from backend.security.audit import log_security_event
from backend.execution.worker_manager import worker_manager
from backend.execution.models import ExecutionJob, ExecutionStatus
from backend.rag.retriever import rag_engine

class ToolMetadata(BaseModel):
    name: str
    description: str
    agent: str
    category: str = "reconnaissance"
    enabled: bool = True
    requires_scope: bool = True
    allowed_profiles: List[str]
    timeout_seconds: int = 300
    risk_level: str = "low" # low | medium | high
    requires_approval: bool = False
    allowed_environment: str = "Authorized Lab"

class ToolRegistry:
    def __init__(self):
        self._tools: Dict[str, Dict[str, Any]] = {
            "nmap": {
                "metadata": ToolMetadata(
                    name="nmap",
                    description="Execute authorized network discovery and port scanning using safe profiles.",
                    agent="scanning",
                    category="scanning",
                    enabled=True,
                    requires_scope=True,
                    allowed_profiles=["host_discovery", "service_detection", "approved_assessment"],
                    timeout_seconds=300,
                    risk_level="medium",
                    requires_approval=False
                )
            },
            "dns_lookup": {
                "metadata": ToolMetadata(
                    name="dns_lookup",
                    description="Perform DNS A record lookup and hostname resolution on an authorized target.",
                    agent="recon",
                    category="reconnaissance",
                    enabled=True,
                    requires_scope=True,
                    allowed_profiles=["standard_resolution"],
                    timeout_seconds=30,
                    risk_level="low",
                    requires_approval=False
                )
            },
            "http_probe": {
                "metadata": ToolMetadata(
                    name="http_probe",
                    description="Fetch HTTP response headers and inspect server banners.",
                    agent="recon",
                    category="reconnaissance",
                    enabled=True,
                    requires_scope=True,
                    allowed_profiles=["header_inspection"],
                    timeout_seconds=30,
                    risk_level="low",
                    requires_approval=False
                )
            },
            "http_header_analysis": {
                "metadata": ToolMetadata(
                    name="http_header_analysis",
                    description="Inspect HTTP response headers and check for server banners.",
                    agent="recon",
                    category="reconnaissance",
                    enabled=True,
                    requires_scope=True,
                    allowed_profiles=["header_inspection"],
                    timeout_seconds=30,
                    risk_level="low",
                    requires_approval=False
                )
            },
            "service_discovery": {
                "metadata": ToolMetadata(
                    name="service_discovery",
                    description="Execute authorized TCP service discovery and banner grabbing on target.",
                    agent="scanning",
                    category="scanning",
                    enabled=True,
                    requires_scope=True,
                    allowed_profiles=["service_detection"],
                    timeout_seconds=300,
                    risk_level="medium",
                    requires_approval=False
                )
            },
            "workspace_exec": {
                "metadata": ToolMetadata(
                    name="workspace_exec",
                    description="Execute a shell command inside the assessment's shared workspace.",
                    agent="recon",
                    category="workspace",
                    enabled=True,
                    requires_scope=False,
                    allowed_profiles=["shell_exec"],
                    timeout_seconds=120,
                    risk_level="low",
                    requires_approval=False
                )
            },
            "workspace_list": {
                "metadata": ToolMetadata(
                    name="workspace_list",
                    description="List files and directories in the shared assessment workspace.",
                    agent="recon",
                    category="workspace",
                    enabled=True,
                    requires_scope=False,
                    allowed_profiles=["file_list"],
                    timeout_seconds=30,
                    risk_level="low",
                    requires_approval=False
                )
            },
            "workspace_read": {
                "metadata": ToolMetadata(
                    name="workspace_read",
                    description="Read the contents of a file inside the shared workspace.",
                    agent="recon",
                    category="workspace",
                    enabled=True,
                    requires_scope=False,
                    allowed_profiles=["file_read"],
                    timeout_seconds=30,
                    risk_level="low",
                    requires_approval=False
                )
            },
            "rag_search": {
                "metadata": ToolMetadata(
                    name="rag_search",
                    description="Retrieve threat intelligence and CVE correlation records from vector store.",
                    agent="research",
                    category="intelligence",
                    enabled=True,
                    requires_scope=False,
                    allowed_profiles=["vector_search"],
                    timeout_seconds=30,
                    risk_level="low",
                    requires_approval=False
                )
            }
        }

    def list_tools(self) -> List[ToolMetadata]:
        return [item["metadata"] for item in self._tools.values()]

    def get_tool(self, name: str) -> Optional[Dict[str, Any]]:
        return self._tools.get(name)

    def execute_tool(
        self,
        tool_name: str,
        input_data: Dict[str, Any],
        operator: str = "System Agent",
        profile: Optional[str] = None
    ) -> Dict[str, Any]:
        tool_entry = self.get_tool(tool_name)
        if not tool_entry:
            raise ValueError(f"Tool '{tool_name}' is not registered in the allowlisted Tool Registry.")

        metadata: ToolMetadata = tool_entry["metadata"]
        selected_profile = profile or input_data.get("profile") or metadata.allowed_profiles[0]

        if selected_profile not in metadata.allowed_profiles and metadata.allowed_profiles[0] != "vector_search":
            raise ValueError(f"Profile '{selected_profile}' is not an approved safe template for tool '{tool_name}'.")

        # RAG special handling
        if tool_name == "rag_search":
            docs = rag_engine.search(input_data.get("query", ""))
            return {
                "tool_name": metadata.name,
                "agent": metadata.agent,
                "status": "success",
                "input": input_data,
                "output": [doc.dict() for doc in docs]
            }

        # Workspace tool execution handling
        if tool_name.startswith("workspace_"):
            from backend.workspace.workspace_manager import workspace_manager
            asm_id = input_data.get("assessment_id", "default_assessment")
            ws = workspace_manager.get_or_create_workspace(asm_id)

            if tool_name == "workspace_exec":
                cmd_res = ws.execute_command(input_data.get("command", "pwd"), actor="agent")
                return {
                    "execution_id": cmd_res["execution_id"],
                    "tool_name": metadata.name,
                    "agent": metadata.agent,
                    "profile": selected_profile,
                    "target": "/workspace",
                    "status": cmd_res["status"],
                    "exit_code": cmd_res["exit_code"],
                    "duration": f"{cmd_res['duration_ms'] / 1000.0:.2f}s",
                    "stdout": cmd_res["stdout"],
                    "stderr": cmd_res["stderr"],
                    "output": {"command": cmd_res["command"], "stdout": cmd_res["stdout"], "stderr": cmd_res["stderr"]},
                    "error": None if cmd_res["exit_code"] == 0 else {"message": cmd_res["stderr"]}
                }
            elif tool_name == "workspace_list":
                files = ws.list_files(input_data.get("path", ""))
                return {
                    "execution_id": f"exec_{int(time.time() * 1000)}",
                    "tool_name": metadata.name,
                    "agent": metadata.agent,
                    "profile": selected_profile,
                    "target": "/workspace",
                    "status": "success",
                    "exit_code": 0,
                    "duration": "0.01s",
                    "stdout": json.dumps(files, indent=2),
                    "stderr": "",
                    "output": {"items": files},
                    "error": None
                }
            elif tool_name == "workspace_read":
                content = ws.read_file(input_data.get("path", ""))
                return {
                    "execution_id": f"exec_{int(time.time() * 1000)}",
                    "tool_name": metadata.name,
                    "agent": metadata.agent,
                    "profile": selected_profile,
                    "target": input_data.get("path", "/workspace"),
                    "status": "success",
                    "exit_code": 0,
                    "duration": "0.01s",
                    "stdout": content,
                    "stderr": "",
                    "output": {"path": input_data.get("path"), "content": content},
                    "error": None
                }

        from backend.utils.target_normalizer import target_normalizer
        normalized = target_normalizer.normalize(input_data.get("target") or input_data.get("query") or "127.0.0.1")
        
        # Select target form based on tool requirements
        if tool_name in ["dns_lookup", "nmap", "service_discovery"]:
            effective_target = normalized["hostname"]
        elif tool_name in ["http_probe", "http_header_analysis"]:
            effective_target = normalized["url"]
        else:
            effective_target = normalized["hostname"]

        # Dispatch execution job via WorkerManager
        job: ExecutionJob = worker_manager.execute_job(
            agent=metadata.agent,
            tool=tool_name,
            profile=selected_profile,
            target=effective_target,
            options=input_data.get("options", {})
        )

        output_dict = {
            "execution_id": job.execution_id,
            "tool_name": metadata.name,
            "agent": metadata.agent,
            "profile": job.profile,
            "target": job.target,
            "status": job.status.value,
            "exit_code": job.exit_code,
            "duration": f"{job.duration_seconds or 0.0}s",
            "stdout": job.stdout,
            "stderr": job.stderr,
            "output": job.result or {"raw": job.stdout},
            "error": job.error
        }
        return output_dict

tool_registry = ToolRegistry()
