from typing import Dict, Any
from backend.graph.state import SecurityState
from backend.tools.registry import tool_registry

SCANNING_SYSTEM_PROMPT = """You are the Scanning Agent of CyberAgents.
Your job is to execute authorized active network port audits and service banner scans on approved targets.
Parse output, extract evidence, deduplicate findings, and assign confidence scores.
"""

class ScanningAgent:
    def __init__(self):
        self.name = "Scanning Agent"
        self.agent_type = "scanning"

    def execute(self, state: SecurityState) -> SecurityState:
        target = state.get("target", "10.10.14.5")

        nmap_job = tool_registry.execute_tool(
            tool_name="nmap",
            input_data={"target": target, "options": {"ports": "80,443,8080,22"}},
            profile="service_detection"
        )
        parsed = nmap_job.get("output") or {}
        hosts = parsed.get("hosts", [])
        open_ports = [
            p for h in hosts for p in h.get("ports", [])
            if p.get("state") == "open"
        ]

        state["current_agent"] = "scanning"
        state.setdefault("evidence", [])
        state.setdefault("tool_results", [])
        state["tool_results"].append(nmap_job)

        err = nmap_job.get("error")
        if err:
            msg = err.get("message") if isinstance(err, dict) else str(err)
            state["evidence"].append(f"Nmap scan on {target} failed: {msg}")
            summary = f"Nmap scan on {target} failed: {msg}"
        elif open_ports:
            for p in open_ports:
                svc = p.get("service") or "unknown"
                banner = " ".join(x for x in (p.get("product"), p.get("version")) if x)
                detail = f"{svc} ({banner})" if banner else svc
                state["evidence"].append(
                    f"Open port {p['port']}/{p.get('protocol', 'tcp')} on {target}: {detail}"
                )
            summary = (
                f"Scanned {target} via Nmap. {len(open_ports)} open port(s): "
                + ", ".join(str(p["port"]) for p in open_ports)
            )
        else:
            state["evidence"].append(f"Nmap scan on {target}: no open ports in the scanned range.")
            summary = f"Scanned {target} via Nmap. No open ports found."

        step = {
            "id": "st-scan-1",
            "agentName": "Scanning Agent",
            "agentType": "scanning",
            "status": "completed",
            "duration": nmap_job.get("duration", "0s"),
            "summary": summary
        }
        state.setdefault("execution_history", [])
        state["execution_history"].append(step)
        return state

scanning_agent = ScanningAgent()
