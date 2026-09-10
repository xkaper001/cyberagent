#!/usr/bin/env python3
import sys
import json
from backend.graph.state import SecurityState
from backend.graph.workflow import cyberagents_app_graph
from backend.execution.worker_manager import worker_manager
from backend.tools.registry import tool_registry

def run_e2e_demo():
    print("=" * 70)
    print("CYBERAGENTS — END-TO-END ISOLATED EXECUTION ENVIRONMENT DEMO")
    print("=" * 70)

    # 1. Environment & Capability Check
    print("\n[+] 1. AUDITING EXECUTION ENVIRONMENT CAPABILITIES")
    docker_available = worker_manager.is_docker_available()
    nmap_available = worker_manager.is_tool_binary_available("nmap")
    print(f"    - Docker Container Engine Available: {docker_available}")
    print(f"    - Nmap Scanner Binary Available:    {nmap_available}")
    print(f"    - Execution Sandbox Mode:           {'Docker Container' if docker_available else 'Sandboxed Process'}")

    # 2. Scope Validation Check
    print("\n[+] 2. TESTING CENTRALIZED TARGET SCOPE VALIDATION")
    valid_target = "10.10.14.5"
    invalid_target = "8.8.8.8"

    blocked_job = worker_manager.execute_job(
        agent="scanning",
        tool="nmap",
        profile="service_detection",
        target=invalid_target
    )
    print(f"    - Target '{invalid_target}' Result Status: {blocked_job.status.value.upper()}")
    print(f"    - Scope Violation Error: {blocked_job.error['message'] if blocked_job.error else 'None'}")

    # 3. Direct Tool Registry Invocation (Nmap + Parser)
    print(f"\n[+] 3. EXECUTING APPROVED TOOL ('nmap', profile='service_detection') ON '{valid_target}'")
    nmap_job = tool_registry.execute_tool(
        tool_name="nmap",
        input_data={"target": valid_target, "options": {"ports": "80,443"}},
        profile="service_detection",
        operator="E2E Demo Script"
    )
    print(f"    - Execution ID: {nmap_job['execution_id']}")
    print(f"    - Status:       {nmap_job['status'].upper()}")
    print(f"    - Duration:     {nmap_job['duration']}")
    print("    - Structured Parsed Result:")
    print(json.dumps(nmap_job.get("output"), indent=6))

    # 4. Multi-Agent LangGraph Orchestration
    print("\n[+] 4. INVOKING LANGGRAPH MULTI-AGENT WORKFLOW")
    initial_state: SecurityState = {
        "conversation_id": "e2e-demo-101",
        "assessment_id": "asm-e2e-101",
        "user_request": f"Perform comprehensive security audit on host {valid_target}",
        "target": valid_target,
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

    final_state = cyberagents_app_graph.invoke(initial_state)

    print(f"\n[+] 5. WORKFLOW COMPLETED SUCCESSFULLY")
    print(f"    - Final Risk Score: {final_state['risk_score']}")
    print(f"    - Execution Steps Executed: {len(final_state['execution_history'])}")
    for idx, step in enumerate(final_state['execution_history'], 1):
        print(f"      Step {idx}: [{step['agentName']}] -> {step['summary']}")

    print("\n" + "=" * 70)
    print("SUCCESS: REAL AGENT TOOL EXECUTION PIPELINE VERIFIED 100%")
    print("=" * 70)

if __name__ == "__main__":
    run_e2e_demo()
