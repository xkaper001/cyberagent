import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.graph.workflow import cyberagents_app_graph
from backend.security.scope import scope_validator, TargetValidationError
from backend.rag.retriever import rag_engine

client = TestClient(app)

def test_health_check():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "CyberAgents" in data["service"]

def test_get_assessments():
    response = client.get("/api/assessments")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert data[0]["id"] == "asm-1"

def test_get_findings():
    response = client.get("/api/findings")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "CVE-2021-41773" in data[0]["cveId"]

def test_target_scope_validator():
    assert scope_validator.validate_target("10.10.14.5") is True
    assert scope_validator.validate_target("web-lab.internal") is True

def test_rag_retriever():
    results = rag_engine.search("CVE-2021-41773")
    assert len(results) > 0
    assert results[0].cveId == "CVE-2021-41773"

def test_langgraph_workflow_execution():
    initial_state = {
        "conversation_id": "test-conv",
        "assessment_id": "asm-1",
        "user_request": "Analyze lab target 10.10.14.5",
        "target": "10.10.14.5",
        "authorization": "AUTHORIZED_LAB",
        "scope": "10.10.14.0/24",
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
    
    final_state = cyberagents_app_graph.invoke(initial_state)
    assert len(final_state["execution_history"]) >= 8
    assert final_state["risk_score"] == 8.4
    assert "Security Assessment Result" in final_state["final_response"]
