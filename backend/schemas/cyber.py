from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any, Union

class OpenServiceSchema(BaseModel):
    port: int
    service: str
    version: Optional[str] = None
    banner: Optional[str] = None

class ProgressPhasesSchema(BaseModel):
    recon: Union[bool, str] = True
    serviceAnalysis: Union[bool, str] = True
    vulnerabilityResearch: Union[bool, str] = "in_progress"
    riskAssessment: Union[bool, str] = False
    report: Union[bool, str] = False

class AssessmentSchema(BaseModel):
    id: str
    title: str
    target: Optional[str] = None
    targetIp: Optional[str] = None
    targets: List[str] = []
    excluded_targets: List[str] = []
    scope: Optional[str] = None  # canonical scope (user-defined targets/CIDRs)
    environment: str = "Lab"
    status: str = "awaiting_target"  # awaiting_target | unconfirmed | in_progress | completed
    authorization_status: str = "unconfirmed"  # unconfirmed | confirmed
    authorization_confirmed_at: Optional[str] = None
    authorization_method: Optional[str] = None  # user_confirmation | explicit_config
    riskScore: float = 0.0
    progressPhases: ProgressPhasesSchema
    openServices: List[OpenServiceSchema] = []
    techStack: List[str] = []
    verifiedFindingsCount: int = 0
    createdAt: str

class FindingSchema(BaseModel):
    id: str
    title: str
    severity: str # critical | high | medium | low | info
    confidence: int = 90
    cvssScore: Optional[float] = None
    asset: str
    targetIp: str
    status: str = "active"
    category: str
    evidence: List[str] = []
    impact: str
    remediation: str
    cveId: Optional[str] = None
    cweId: Optional[str] = None
    firstDetected: str
    lastUpdated: str
    agentActivitySummary: Optional[str] = None
    references: Optional[List[str]] = []

class FindingsSummarySchema(BaseModel):
    critical: int = 0
    high: int = 0
    medium: int = 0
    low: int = 0
    info: int = 0

class ReportSchema(BaseModel):
    id: str
    title: str
    date: str
    riskScore: float = 0.0
    riskLevel: str = "High"
    findingsCount: int = 0
    status: str = "Completed"
    target: str
    author: str = "CyberAgents AI Security Copilot"
    executiveSummary: str
    attackSurface: str
    findingsSummary: FindingsSummarySchema
    remediationRoadmap: List[str] = []

class KnowledgeItemSchema(BaseModel):
    id: str
    cveId: Optional[str] = None
    cweId: Optional[str] = None
    title: str
    severity: str
    category: str
    affectedTech: str
    summary: str
    remediation: str
    cvssScore: Optional[float] = None
    source: str
    updatedDate: str

class AgentProfileSchema(BaseModel):
    id: str
    name: str
    type: str
    purpose: str
    status: str = "Ready"
    tools: List[str] = []
    lastActivity: str
    executionsCount: int = 0
    iconName: str

class AgentStepSchema(BaseModel):
    id: str
    agentName: str
    agentType: str
    status: str # completed | running | queued | failed
    duration: Optional[str] = None
    summary: str

class AgentActivitySchema(BaseModel):
    id: str
    title: str = "Agent Activity"
    isExpanded: Optional[bool] = True
    steps: List[AgentStepSchema] = []

class MessageSchema(BaseModel):
    id: str
    role: str # user | assistant | system
    content: str
    timestamp: str
    agentActivity: Optional[AgentActivitySchema] = None
    findings: Optional[List[FindingSchema]] = None
    references: Optional[List[str]] = None

class HumanApprovalSchema(BaseModel):
    id: str
    agentName: str
    action: str
    target: str
    reason: str
    expectedOutcome: str
    timestamp: str
    status: str = "pending" # pending | approved | rejected

class ChatRequestSchema(BaseModel):
    conversation_id: Optional[str] = "conv-1"
    message: str
    assessment_id: Optional[str] = None

class AssessmentCreateSchema(BaseModel):
    target: str
    environment: str = "Lab"
    scope: Optional[str] = None  # custom scope (CIDR or domain); defaults to target
