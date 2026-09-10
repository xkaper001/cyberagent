from fastapi import APIRouter, HTTPException, Body
from typing import List, Optional, Dict, Any
import datetime
from pydantic import BaseModel

from backend.schemas.cyber import (
    AssessmentSchema, AssessmentCreateSchema, FindingSchema, ReportSchema,
    AgentProfileSchema, KnowledgeItemSchema, HumanApprovalSchema
)
from backend.services.mock_data import (
    INITIAL_ASSESSMENTS, INITIAL_FINDINGS, INITIAL_REPORTS, INITIAL_AGENTS, INITIAL_KNOWLEDGE
)
from backend.services.store import store
from backend.security.approval import approval_manager
from backend.tools.registry import tool_registry, ToolMetadata
from backend.execution.sandbox import sandbox_runner

assessments_router = APIRouter(prefix="/api/assessments", tags=["assessments"])
findings_router = APIRouter(prefix="/api/findings", tags=["findings"])
reports_router = APIRouter(prefix="/api/reports", tags=["reports"])
agents_router = APIRouter(prefix="/api/agents", tags=["agents"])
knowledge_router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])
approval_router = APIRouter(prefix="/api/approval", tags=["approval"])
health_router = APIRouter(prefix="/api/health", tags=["health"])
tools_router = APIRouter(prefix="/api/tool-executions", tags=["tools"])

class ToolExecuteRequest(BaseModel):
    tool_name: str
    input_data: Dict[str, Any] = {}

# Assessments
@assessments_router.get("", response_model=List[AssessmentSchema])
def get_assessments():
    return store.list_assessments()

@assessments_router.post("", response_model=AssessmentSchema)
def create_assessment(data: AssessmentCreateSchema):
    return store.create_assessment(target=data.target, environment=data.environment or "Lab", scope=data.scope)

class AssessmentAuthorizationSchema(BaseModel):
    authorized: bool = True
    target: Optional[str] = None

@assessments_router.post("/{id}/authorization")
def authorize_assessment(id: str, data: AssessmentAuthorizationSchema = Body(...)):
    print(f"[AUTH] AUTHORIZATION REQUEST assessment_id={id} target={data.target} authorized={data.authorized}")
    asm_record = store.get_assessment(id)
    if not asm_record:
        asm_record = store.create_assessment(target=data.target, assessment_id=id)
    
    if data.authorized:
        from backend.utils.target_normalizer import target_normalizer
        target_name = data.target or asm_record.target or "127.0.0.1"
        norm = target_normalizer.normalize(target_name)
        canonical = norm["hostname"]

        asm_record.target = canonical
        asm_record.targetIp = norm["ip"]
        asm_record.targets = [canonical]
        asm_record.scope = canonical
        asm_record.status = "in_progress"
        asm_record.authorization_status = "confirmed"
        asm_record.authorization_confirmed_at = datetime.datetime.utcnow().isoformat() + "Z"
        asm_record.authorization_method = "user_confirmation"

        print(f"[AUTH] AUTHORIZATION CONFIRMED assessment_id={id} target={canonical} ip={norm['ip']}")
        return {
            "assessment_id": id,
            "authorization_status": "confirmed",
            "status": "running",
            "target": canonical,
            "target_ip": norm["ip"]
        }
    else:
        asm_record.authorization_status = "unconfirmed"
        asm_record.status = "unconfirmed"
        return {
            "assessment_id": id,
            "authorization_status": "unconfirmed",
            "status": "unconfirmed"
        }

# Findings
@findings_router.get("", response_model=List[FindingSchema])
def get_findings(severity: Optional[str] = None):
    if severity:
        return [f for f in INITIAL_FINDINGS if f.severity.lower() == severity.lower()]
    return INITIAL_FINDINGS

@findings_router.get("/{id}", response_model=FindingSchema)
def get_finding_by_id(id: str):
    for f in INITIAL_FINDINGS:
        if f.id == id:
            return f
    raise HTTPException(status_code=404, detail="Finding not found")

# Reports
@reports_router.get("", response_model=List[ReportSchema])
def get_reports():
    return INITIAL_REPORTS

@reports_router.get("/{id}", response_model=ReportSchema)
def get_report_by_id(id: str):
    for r in INITIAL_REPORTS:
        if r.id == id:
            return r
    raise HTTPException(status_code=404, detail="Report not found")

# Agents
@agents_router.get("", response_model=List[AgentProfileSchema])
def get_agents():
    return INITIAL_AGENTS

# Knowledge
@knowledge_router.get("/search", response_model=List[KnowledgeItemSchema])
def search_knowledge(q: str = ""):
    if not q:
        return INITIAL_KNOWLEDGE
    q_lower = q.lower()
    return [k for k in INITIAL_KNOWLEDGE if q_lower in k.title.lower() or (k.cveId and q_lower in k.cveId.lower())]

# Approval
@approval_router.post("/{id}/approve")
def approve_action(id: str):
    res = approval_manager.approve(id)
    return {"status": "approved", "approval": res}

@approval_router.post("/{id}/reject")
def reject_action(id: str):
    res = approval_manager.reject(id)
    return {"status": "rejected", "approval": res}

# Controlled Tool Execution API
@tools_router.get("/allowlist", response_model=List[ToolMetadata])
def list_allowlisted_tools():
    return tool_registry.list_tools()

@tools_router.post("")
def execute_controlled_tool(payload: ToolExecuteRequest):
    try:
        res = tool_registry.execute_tool(payload.tool_name, payload.input_data, operator="Security Operator UI")
        return res
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

capabilities_router = APIRouter(prefix="/api/capabilities", tags=["capabilities"])

@capabilities_router.get("")
def get_capabilities():
    caps = sandbox_runner.check_capabilities()
    tool_caps = caps.get("capabilities", {})
    runtime = caps.get("runtime", {})

    tools_out = {}
    for tool_name, info in tool_caps.items():
        tools_out[tool_name] = {
            "installed": info.get("installed", False),
            "available": info.get("available", False),
            "version": info.get("version_string") or None,
        }

    return {
        "sandbox": caps.get("sandbox_status"),
        "display_status": caps.get("display_status"),
        "unavailable_reason": caps.get("unavailable_reason"),
        "is_linux_sandbox": caps.get("is_linux_sandbox", False),
        "container": caps["sandbox_container"],
        "dev_host_shell": caps.get("dev_host_shell"),
        "mode": caps["mode"],
        "docker_active": caps["docker_active"],
        "runtime": runtime,
        "tools": tools_out,
        "python": tool_caps.get("python", {}).get("installed", False),
        "curl": tool_caps.get("curl", {}).get("installed", False),
        "openssl": tool_caps.get("openssl", {}).get("installed", False),
        "dig": tool_caps.get("dig", {}).get("installed", False),
        "nmap": tool_caps.get("nmap", {}).get("installed", False),
        "capabilities": {k: v.get("installed", False) for k, v in tool_caps.items()},
    }

# Health
@health_router.get("")
def health_check():
    caps = sandbox_runner.check_capabilities()
    return {
        "status": "healthy",
        "service": "CyberAgents AI Security Copilot Backend",
        "version": "2.0.0",
        "sandbox_status": caps.get("display_status"),
        "sandbox_mode": caps["mode"],
        "is_linux_sandbox": caps.get("is_linux_sandbox", False),
        "database": "sqlite ready",
        "execution_mode": caps["mode"],
    }


