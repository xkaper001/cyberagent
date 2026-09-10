from langgraph.graph import StateGraph, END
from backend.graph.state import SecurityState
from backend.graph.nodes import (
    supervisor_node, planner_node, recon_node, scanning_node, research_node,
    vulnerability_node, critic_node, risk_node, report_node
)
from backend.graph.routing import route_after_critic

def build_cyberagents_graph():
    workflow = StateGraph(SecurityState)

    workflow.add_node("supervisor", supervisor_node)
    workflow.add_node("planner", planner_node)
    workflow.add_node("recon", recon_node)
    workflow.add_node("scanning", scanning_node)
    workflow.add_node("research", research_node)
    workflow.add_node("vulnerability", vulnerability_node)
    workflow.add_node("critic", critic_node)
    workflow.add_node("risk", risk_node)
    workflow.add_node("report", report_node)

    # Entry point & Edge pipeline
    workflow.set_entry_point("supervisor")
    workflow.add_edge("supervisor", "planner")
    workflow.add_edge("planner", "recon")
    workflow.add_edge("recon", "scanning")
    workflow.add_edge("scanning", "research")
    workflow.add_edge("research", "vulnerability")
    workflow.add_edge("vulnerability", "critic")

    # Conditional Routing Edge from Critic
    workflow.add_conditional_edges(
        "critic",
        route_after_critic,
        {
            "risk": "risk",
            "planner": "planner"
        }
    )

    workflow.add_edge("risk", "report")
    workflow.add_edge("report", END)

    return workflow.compile()

cyberagents_app_graph = build_cyberagents_graph()
