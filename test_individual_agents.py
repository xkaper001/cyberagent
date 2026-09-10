import json
from backend.graph.state import SecurityState
from backend.agents.supervisor import supervisor_agent
from backend.agents.planner import planner_agent
from backend.agents.recon import recon_agent
from backend.agents.scanning import scanning_agent

def print_banner(title: str):
    print("\n" + "="*70)
    print(f"  {title}")
    print("="*70)

def get_sample_state(target: str = "10.10.14.5") -> SecurityState:
    return {
        "conversation_id": "test-cli-101",
        "assessment_id": "asm-cli-101",
        "user_request": f"Investigate target host {target} for security vulnerabilities",
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

def test_supervisor_individually():
    print_banner("1. TESTING SUPERVISOR AGENT INDIVIDUALLY")
    state = get_sample_state("10.10.14.5")
    updated_state = supervisor_agent.execute(state)
    print(f"Status: {updated_state.get('status')}")
    print(f"Authorization: {updated_state.get('authorization')}")
    print(f"Execution Step: {json.dumps(updated_state['execution_history'][-1], indent=2)}")

def test_planner_individually():
    print_banner("2. TESTING PLANNER AGENT INDIVIDUALLY")
    state = get_sample_state("10.10.14.5")
    updated_state = planner_agent.execute(state)
    print("Generated Plan:")
    print(json.dumps(updated_state["current_plan"], indent=2))

def test_recon_individually():
    print_banner("3. TESTING RECONNAISSANCE AGENT INDIVIDUALLY")
    state = get_sample_state("10.10.14.5")
    updated_state = recon_agent.execute(state)
    print("Evidence Collected:")
    for ev in updated_state["evidence"]:
        print(f"  - {ev}")
    print(f"\nLast Step: {json.dumps(updated_state['execution_history'][-1], indent=2)}")

def test_scanning_individually():
    print_banner("4. TESTING SCANNING AGENT INDIVIDUALLY")
    state = get_sample_state("10.10.14.5")
    updated_state = scanning_agent.execute(state)
    print("Evidence Collected:")
    for ev in updated_state["evidence"]:
        print(f"  - {ev}")
    print(f"\nLast Step: {json.dumps(updated_state['execution_history'][-1], indent=2)}")

if __name__ == "__main__":
    test_supervisor_individually()
    test_planner_individually()
    test_recon_individually()
    test_scanning_individually()
    print("\n" + "="*70)
    print("  ALL 4 AGENTS EXECUTED AND TESTED INDIVIDUALLY SUCCESSFULLY!")
    print("="*70 + "\n")
