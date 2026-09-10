from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import datetime

class AgentMessageEnvelope(BaseModel):
    task_id: str
    parent_task_id: Optional[str] = None
    agent: str # supervisor | planner | recon | scanning | research | vulnerability | critic | risk | report
    action: str # delegate | execute | validate | reply | report
    input: Dict[str, Any] = {}
    output: Dict[str, Any] = {}
    status: str = "pending" # pending | running | completed | failed | blocked | needs_validation
    errors: List[str] = []
    timestamp: str = Field(default_factory=lambda: datetime.datetime.now(datetime.timezone.utc).isoformat())

class PlannedTaskStep(BaseModel):
    id: str
    agent: str
    objective: str
    depends_on: List[str] = []
    priority: int = 1
    expected_output: Dict[str, Any] = {}
    completion_criteria: List[str] = []

class StructuredPlanOutput(BaseModel):
    plan_id: str
    objective: str
    scope: List[str] = []
    steps: List[PlannedTaskStep] = []
    completion_criteria: List[str] = []

class DiscoveredAsset(BaseModel):
    value: str
    type: str # domain | ip | endpoint | service
    source: str
    confidence: float = 1.0

class ReconOutput(BaseModel):
    task_id: str
    target_scope: List[str] = []
    assets: List[DiscoveredAsset] = []
    services: List[Dict[str, Any]] = []
    technologies: List[str] = []
    endpoints: List[str] = []
    observations: List[str] = []
    evidence: List[str] = []
    confidence: float = 1.0
    errors: List[str] = []

class ScanningFindingItem(BaseModel):
    id: str
    title: str
    description: str
    severity: str # critical | high | medium | low | info
    confidence: float = 0.9
    affected_asset: str
    evidence: List[str] = []
    source: str = "Scanning Agent"
    status: str = "active" # potential | confirmed | false_positive | needs_validation

class ScanningOutput(BaseModel):
    task_id: str
    target_scope: List[str] = []
    checks: List[str] = []
    findings: List[ScanningFindingItem] = []
    errors: List[str] = []
