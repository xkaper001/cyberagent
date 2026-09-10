import datetime
from typing import Dict, Optional
from backend.schemas.cyber import HumanApprovalSchema

class HumanApprovalManager:
    def __init__(self):
        self._pending_approvals: Dict[str, HumanApprovalSchema] = {}

    def create_approval_request(
        self, 
        agent_name: str, 
        action: str, 
        target: str, 
        reason: str, 
        expected_outcome: str
    ) -> HumanApprovalSchema:
        approval_id = f"appr-{int(datetime.datetime.now().timestamp() * 1000)}"
        req = HumanApprovalSchema(
            id=approval_id,
            agentName=agent_name,
            action=action,
            target=target,
            reason=reason,
            expectedOutcome=expected_outcome,
            timestamp=datetime.datetime.now().strftime("%H:%M"),
            status="pending"
        )
        self._pending_approvals[approval_id] = req
        return req

    def get_approval(self, approval_id: str) -> Optional[HumanApprovalSchema]:
        return self._pending_approvals.get(approval_id)

    def approve(self, approval_id: str) -> Optional[HumanApprovalSchema]:
        if approval_id in self._pending_approvals:
            req = self._pending_approvals[approval_id]
            req.status = "approved"
            return req
        return None

    def reject(self, approval_id: str) -> Optional[HumanApprovalSchema]:
        if approval_id in self._pending_approvals:
            req = self._pending_approvals[approval_id]
            req.status = "rejected"
            return req
        return None

approval_manager = HumanApprovalManager()
