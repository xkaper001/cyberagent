from pydantic import BaseModel, Field
from typing import List, Optional

class PlannedStep(BaseModel):
    step_id: int
    agent_type: str
    description: str
    tool_required: Optional[str] = None

class SecurityPlanOutput(BaseModel):
    goal: str
    target: str
    scope_authorized: bool
    steps: List[PlannedStep]

class CriticEvaluationOutput(BaseModel):
    status: str = Field(description="VALID or NEEDS_MORE_EVIDENCE")
    confidence_score: int = Field(description="Confidence percentage 0-100")
    reasoning: str
    missing_evidence: Optional[List[str]] = None

class RiskEvaluationOutput(BaseModel):
    composite_risk_score: float = Field(description="Score between 0.0 and 10.0")
    risk_level: str = Field(description="Critical | High | Medium | Low | Info")
    priority_ranking: List[str]
    business_impact: str
