from typing import Dict, Any, List
from backend.graph.state import SecurityState
from backend.agents.schemas import StructuredPlanOutput, PlannedTaskStep

PLANNER_SYSTEM_PROMPT = """You are the Planner Agent of CyberAgents.
Your job is to convert high-level cybersecurity objectives into structured, deterministic execution plans.
Select appropriate specialized agents for each step and set explicit completion criteria.
Do NOT execute tools directly.
"""

class PlannerAgent:
    def __init__(self):
        self.name = "Planner Agent"
        self.agent_type = "planner"

    def execute(self, state: SecurityState) -> SecurityState:
        target = state.get("target", "10.10.14.5")
        user_goal = state.get("user_request", f"Security audit of {target}")

        plan = StructuredPlanOutput(
            plan_id=f"plan-{state['conversation_id']}",
            objective=user_goal,
            scope=[state.get("scope", "10.10.14.0/24")],
            steps=[
                PlannedTaskStep(
                    id="step-1",
                    agent="recon",
                    objective=f"Perform DNS resolution, HTTP header audit, and SSL analysis on {target}",
                    depends_on=[],
                    priority=1,
                    expected_output={"assets": "list", "technologies": "list"},
                    completion_criteria=["Server banner identified", "DNS record resolved"]
                ),
                PlannedTaskStep(
                    id="step-2",
                    agent="scanning",
                    objective=f"Audit open TCP ports and service banners on host {target}",
                    depends_on=["step-1"],
                    priority=2,
                    expected_output={"open_services": "list"},
                    completion_criteria=["Service banners extracted for active ports"]
                ),
                PlannedTaskStep(
                    id="step-3",
                    agent="research",
                    objective="Correlate identified banners with CVE database",
                    depends_on=["step-2"],
                    priority=3,
                    expected_output={"cve_matches": "list"},
                    completion_criteria=["Matching CVE records retrieved from RAG"]
                )
            ],
            completion_criteria=["All 3 assessment steps completed", "Findings validated"]
        )

        state["current_plan"] = plan.dict()
        state["current_agent"] = "planner"

        step = {
            "id": "st-plan-1",
            "agentName": "Planner",
            "agentType": "planner",
            "status": "completed",
            "duration": "0.8s",
            "summary": f"Generated 3-stage structured security plan for objective '{user_goal[:45]}...'"
        }
        state["execution_history"].append(step)
        return state

planner_agent = PlannerAgent()
