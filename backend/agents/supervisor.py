"""
CyberAgents Supervisor Agent
------------------------------
Uses the SINGLE authoritative scope_validator — no inline IP checks.
The assessment scope (stored in state["scope"]) is threaded through
as assessment_scope so the validator can authorize assessment-specific targets.
"""
import datetime
from typing import Dict, Any

from backend.graph.state import SecurityState
from backend.config.settings import settings
from backend.config.logging import logger
from backend.security.scope import scope_validator, ScopeDecision
from backend.utils.target_normalizer import target_normalizer


class SupervisorAgent:
    def __init__(self):
        self.name = "Supervisor"
        self.agent_type = "supervisor"

    def execute(self, state: SecurityState) -> SecurityState:
        raw_target = (state.get("target") or "").strip()
        assessment_scope = (state.get("scope") or "").strip() or None

        if not raw_target:
            raw_target = "127.0.0.1"

        logger.info(f"Supervisor evaluating target='{raw_target}' scope='{assessment_scope}'")
        norm = target_normalizer.normalize(raw_target)

        # ------------------------------------------------------------------
        # Scope validation — delegated entirely to scope_validator
        # ------------------------------------------------------------------
        scope_result = scope_validator.check(raw_target, assessment_scope)
        canonical = scope_result["canonical_target"]

        scope_step = {
            "id": "st-sup-scope",
            "agentName": "Supervisor",
            "agentType": "supervisor",
            "status": "completed",
            "duration": "0.0s",
            "summary": (
                f"Scope Validation\n"
                f"  Original Target : {raw_target}\n"
                f"  Canonical Target: {canonical}\n"
                f"  Assessment Scope: {assessment_scope or 'global'}\n"
                f"  Decision        : {scope_result['decision']}\n"
                f"  Reason          : {scope_result['reason']}"
            ),
        }
        state["execution_history"].append(scope_step)

        if scope_result["decision"] != ScopeDecision.AUTHORIZED:
            logger.warning(
                f"Supervisor BLOCKED target='{raw_target}' canonical='{canonical}' reason='{scope_result['reason']}'"
            )
            state["errors"].append(scope_result["reason"])
            state["status"] = "failed"
            state["authorization"] = "BLOCKED_SCOPE"
            state["final_response"] = (
                f"**Scope Boundary Violation**\n\n"
                f"- Original Target : `{raw_target}`\n"
                f"- Canonical Target: `{canonical}`\n"
                f"- Decision        : **BLOCKED_SCOPE**\n"
                f"- Reason          : {scope_result['reason']}\n\n"
                f"Execution halted. Only targets within authorized scope are permitted."
            )
            return state

        # ------------------------------------------------------------------
        # Authorized — proceed
        # ------------------------------------------------------------------
        state["authorization"] = "AUTHORIZED_LAB"
        state["status"] = "running"
        # Propagate normalized canonical target so all downstream agents use it
        state["target"] = canonical

        proceed_step = {
            "id": "st-sup-1",
            "agentName": "Supervisor",
            "agentType": "supervisor",
            "status": "completed",
            "duration": "0.1s",
            "summary": (
                f"Target authorized. Dispatching plan generation.\n"
                f"  Canonical target: {canonical}"
            ),
        }
        state["execution_history"].append(proceed_step)
        state["current_agent"] = "supervisor"
        return state


supervisor_agent = SupervisorAgent()
