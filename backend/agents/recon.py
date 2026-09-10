from typing import Dict, Any
from backend.graph.state import SecurityState
from backend.tools.registry import tool_registry

RECON_SYSTEM_PROMPT = """You are the Reconnaissance Agent of CyberAgents.
Your job is to gather passive and non-invasive technical intelligence on target assets within authorized scope.
Every observation must contain evidence and confidence score. Do NOT fabricate domain names or server banners.
"""

class ReconAgent:
    def __init__(self):
        self.name = "Recon Agent"
        self.agent_type = "recon"

    def execute(self, state: SecurityState) -> SecurityState:
        target = state.get("target", "10.10.14.5")

        dns_job = tool_registry.execute_tool("dns_lookup", {"target": target}, profile="standard_resolution")
        http_job = tool_registry.execute_tool("http_probe", {"target": target}, profile="header_inspection")

        state["current_agent"] = "recon"
        state.setdefault("evidence", [])
        state.setdefault("tool_results", [])
        state["tool_results"].extend([dns_job, http_job])

        dns_out = dns_job.get("output") or {}
        ips = dns_out.get("resolved_ips") or []
        if dns_job.get("error"):
            state["evidence"].append(f"DNS lookup on {target} failed: {dns_job.get('error')}")
        elif ips:
            state["evidence"].append(f"DNS resolution for {target}: {', '.join(ips)}")
        else:
            state["evidence"].append(f"DNS resolution for {target}: no records returned.")

        http_out = http_job.get("output") or {}
        if http_job.get("error"):
            state["evidence"].append(f"HTTP probe on {target} failed: {http_job.get('error')}")
        else:
            banner = http_out.get("server")
            status_line = http_out.get("status_line")
            if banner and banner != "Unknown Web Server":
                state["evidence"].append(f"HTTP Server banner for {target}: {banner}")
            elif status_line:
                state["evidence"].append(f"HTTP response for {target}: {status_line} (no Server header)")
            else:
                state["evidence"].append(f"HTTP probe on {target}: no headers returned.")

        step = {
            "id": "st-recon-1",
            "agentName": "Recon Agent",
            "agentType": "recon",
            "status": "completed",
            "duration": dns_job.get("duration", "0s"),
            "summary": f"Executed DNS & HTTP reconnaissance on {target} via isolated worker."
        }
        state.setdefault("execution_history", [])
        state["execution_history"].append(step)
        return state

recon_agent = ReconAgent()
