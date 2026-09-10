from typing import TypedDict, List, Dict, Any, Optional

class SecurityState(TypedDict):
    conversation_id: str
    assessment_id: Optional[str]
    user_request: str
    target: str
    authorization: str
    scope: str
    status: Optional[str]
    current_plan: Optional[Dict[str, Any]]
    current_agent: str
    messages: List[Dict[str, Any]]
    tool_results: List[Dict[str, Any]]
    evidence: List[str]
    retrieved_documents: List[Dict[str, Any]]
    findings: List[Dict[str, Any]]
    risk_score: float
    approvals: List[Dict[str, Any]]
    errors: List[str]
    final_response: str
    report: Optional[Dict[str, Any]]
    execution_history: List[Dict[str, Any]]
