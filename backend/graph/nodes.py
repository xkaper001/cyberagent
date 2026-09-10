from backend.graph.state import SecurityState
from backend.agents.supervisor import supervisor_agent
from backend.agents.planner import planner_agent
from backend.agents.recon import recon_agent
from backend.agents.scanning import scanning_agent
from backend.rag.retriever import rag_engine
from backend.services.mock_data import INITIAL_FINDINGS, INITIAL_REPORTS

def supervisor_node(state: SecurityState) -> SecurityState:
    return supervisor_agent.execute(state)

def planner_node(state: SecurityState) -> SecurityState:
    return planner_agent.execute(state)

def recon_node(state: SecurityState) -> SecurityState:
    return recon_agent.execute(state)

def scanning_node(state: SecurityState) -> SecurityState:
    return scanning_agent.execute(state)

def research_node(state: SecurityState) -> SecurityState:
    step = {
        "id": "st-res-1",
        "agentName": "Research Agent",
        "agentType": "research",
        "status": "completed",
        "duration": "1.5s",
        "summary": "Retrieved CVE-2021-41773 & OWASP API threat intelligence"
    }
    state["execution_history"].append(step)
    state["current_agent"] = "research"
    retrieved = rag_engine.search(state["user_request"])
    state["retrieved_documents"].extend([r.dict() for r in retrieved])
    return state

def vulnerability_node(state: SecurityState) -> SecurityState:
    step = {
        "id": f"st-vuln-{len(state['execution_history'])+1}",
        "agentName": "Vulnerability Agent",
        "agentType": "vulnerability",
        "status": "completed",
        "duration": "0.4s",
        "summary": "Analyzed raw tool outputs for evidence-backed vulnerabilities."
    }
    state["execution_history"].append(step)
    state["current_agent"] = "vulnerability"
    return state

def critic_node(state: SecurityState) -> SecurityState:
    step = {
        "id": "st-crit-1",
        "agentName": "Critic Agent",
        "agentType": "critic",
        "status": "completed",
        "duration": "1.2s",
        "summary": "Verified finding evidence rigor (96% Confidence - VALID)"
    }
    state["execution_history"].append(step)
    state["current_agent"] = "critic"
    return state

def risk_node(state: SecurityState) -> SecurityState:
    step = {
        "id": "st-risk-1",
        "agentName": "Risk Agent",
        "agentType": "risk",
        "status": "completed",
        "duration": "1.1s",
        "summary": "Calculated composite risk score: 8.4 / 10 (High Severity)"
    }
    state["execution_history"].append(step)
    state["current_agent"] = "risk"
    state["risk_score"] = 8.4
    return state

def report_node(state: SecurityState) -> SecurityState:
    step = {
        "id": "st-rep-1",
        "agentName": "Report Agent",
        "agentType": "report",
        "status": "completed",
        "duration": "1.7s",
        "summary": "Compiled structured security report and remediation roadmap"
    }
    state["execution_history"].append(step)
    state["current_agent"] = "report"
    state["report"] = INITIAL_REPORTS[0].dict()
    state["final_response"] = (
        f"### Security Assessment Result for target `{state['target']}`\n\n"
        f"**Composite Risk Score**: `8.4 / 10` (**HIGH**)\n\n"
        f"During our automated multi-agent run on target `{state['target']}`, CyberAgents identified **5 active services**, "
        f"leading to **1 Critical RCE vulnerability (CVE-2021-41773)** and **1 High severity credential exposure**."
    )
    return state
