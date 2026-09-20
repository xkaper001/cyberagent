import pytest
from backend.graph.state import SecurityState
from backend.agents.supervisor import supervisor_agent
from backend.agents.planner import planner_agent
from backend.agents.recon import recon_agent
from backend.agents.scanning import scanning_agent
from backend.graph.workflow import cyberagents_app_graph

def get_base_state(target: str = "10.10.14.5") -> SecurityState:
    return {
        "conversation_id": "test-conv-101",
        "assessment_id": "asm-101",
        "user_request": f"Security audit for {target}",
        "target": target,
        "authorization": "AUTHORIZED_LAB",
        "scope": "10.10.14.0/24",
        "status": "pending",
        "current_plan": None,
        "current_agent": "supervisor",
        "messages": [],
        "tool_results": [],
        "evidence": [],
        "retrieved_documents": [],
        "findings": [],
        "risk_score": 0.0,
        "approvals": [],
        "errors": [],
        "final_response": "",
        "report": None,
        "execution_history": []
    }

def test_supervisor_valid_scope():
    state = get_base_state("10.10.14.5")
    res = supervisor_agent.execute(state)
    assert res.get("status") != "failed"
    assert len(res["execution_history"]) >= 1
    assert res["execution_history"][0]["agentType"] == "supervisor"

def test_supervisor_out_of_scope():
    state = get_base_state("8.8.8.8")
    res = supervisor_agent.execute(state)
    assert res.get("status") == "failed"
    assert "Scope Boundary Violation" in res["final_response"]

def test_planner_execution():
    state = get_base_state()
    res = planner_agent.execute(state)
    assert res["current_plan"] is not None
    assert len(res["current_plan"]["steps"]) == 3
    assert res["current_plan"]["steps"][0]["agent"] == "recon"

@pytest.mark.live_llm
def test_recon_agent_execution():
    state = get_base_state()
    res = recon_agent.execute(state)
    assert len(res["evidence"]) >= 3
    assert any("Apache" in ev for ev in res["evidence"])

@pytest.mark.needs_worker
def test_scanning_agent_execution():
    state = get_base_state()
    res = scanning_agent.execute(state)
    assert any("open ports" in ev for ev in res["evidence"])

@pytest.mark.live_llm
def test_end_to_end_graph_execution():
    state = get_base_state("10.10.14.5")
    final_state = cyberagents_app_graph.invoke(state)
    assert len(final_state["execution_history"]) >= 8
    assert any(h["agentType"] == "supervisor" for h in final_state["execution_history"])
    assert any(h["agentType"] == "planner" for h in final_state["execution_history"])
    assert final_state["risk_score"] == 8.4
    assert "Security Assessment Result" in final_state["final_response"]

