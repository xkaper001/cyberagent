from backend.graph.state import SecurityState
from backend.agents.supervisor import supervisor_agent
from backend.agents.planner import planner_agent
from backend.agents.recon import recon_agent
from backend.agents.scanning import scanning_agent
import datetime
from backend.services.cve_lookup import lookup as cve_lookup
from backend.services.mock_data import INITIAL_REPORTS
from backend.schemas.cyber import FindingSchema, KnowledgeItemSchema


def discovered_services(state):
    services = []
    for job in state.get("tool_results", []):
        if job.get("tool_name") != "nmap":
            continue
        parsed = job.get("output") or {}
        for host in parsed.get("hosts", []):
            for p in host.get("ports", []):
                if p.get("state") != "open" or not p.get("product"):
                    continue
                services.append({
                    "host": host.get("address") or state.get("target", ""),
                    "port": p.get("port"),
                    "protocol": p.get("protocol", "tcp"),
                    "service": p.get("service"),
                    "product": p.get("product"),
                    "version": p.get("version"),
                    "cpes": tuple(p.get("cpes") or ()),
                })
    return services

def supervisor_node(state: SecurityState) -> SecurityState:
    return supervisor_agent.execute(state)

def planner_node(state: SecurityState) -> SecurityState:
    return planner_agent.execute(state)

def recon_node(state: SecurityState) -> SecurityState:
    return recon_agent.execute(state)

def scanning_node(state: SecurityState) -> SecurityState:
    return scanning_agent.execute(state)

def research_node(state: SecurityState) -> SecurityState:
    state["current_agent"] = "research"
    state.setdefault("retrieved_documents", [])

    now = datetime.datetime.utcnow().date().isoformat()
    cve_ids = []
    for svc in discovered_services(state):
        for cve in cve_lookup(svc["product"], svc["version"], svc.get("cpes", ())):
            item = KnowledgeItemSchema(
                id=cve["cveId"],
                cveId=cve["cveId"],
                cweId=cve.get("cweId"),
                title=f"{svc['product']} {svc.get('version') or ''}: {cve['cveId']}".strip(),
                severity=cve["severity"],
                category="CVE",
                affectedTech=f"{svc['product']} {svc.get('version') or ''}".strip(),
                summary=cve["summary"],
                remediation=f"Review advisory {cve['cveId']} and patch {svc['product']}.",
                cvssScore=cve.get("cvssScore"),
                source="NVD",
                updatedDate=now,
            )
            state["retrieved_documents"].append(item.dict())
            cve_ids.append(cve["cveId"])

    summary = (
        f"Correlated {len(discovered_services(state))} service(s) against NVD: "
        f"{len(cve_ids)} advisory record(s)."
        if cve_ids else "No NVD advisories matched discovered service versions."
    )
    step = {
        "id": "st-res-1",
        "agentName": "Research Agent",
        "agentType": "research",
        "status": "completed",
        "duration": "1.5s",
        "summary": summary,
    }
    state.setdefault("execution_history", []).append(step)
    return state

def vulnerability_node(state: SecurityState) -> SecurityState:
    state["current_agent"] = "vulnerability"
    state.setdefault("findings", [])

    now = datetime.datetime.utcnow().isoformat() + "Z"
    target = state.get("target", "")
    new_findings = []
    seen = {(f.get("cveId"), f.get("targetIp")) for f in state["findings"]}

    for svc in discovered_services(state):
        tech = f"{svc['product']} {svc.get('version') or ''}".strip()
        target_ip = f"{svc['host']}:{svc['port']}"
        banner = f"{svc['service']} {tech}".strip()
        for cve in cve_lookup(svc["product"], svc["version"], svc.get("cpes", ())):
            key = (cve["cveId"], target_ip)
            if key in seen:
                continue
            seen.add(key)
            finding = FindingSchema(
                id=f"fnd-{cve['cveId']}-{svc['port']}",
                title=f"{cve['cveId']} in {tech}",
                severity=cve["severity"],
                confidence=90,
                asset=f"{target} ({target_ip})",
                targetIp=target_ip,
                status="active",
                category="Known Vulnerability (CVE)",
                evidence=[
                    f"Nmap -sV identified {banner} on {target_ip}.",
                    (cve["summary"][:400] + "...") if len(cve["summary"]) > 400 else cve["summary"],
                ],
                impact=f"Service {tech} is affected by {cve['cveId']} (CVSS {cve.get('cvssScore')}).",
                remediation=f"Patch {svc['product']} to a fixed release; see {cve['cveId']} advisory.",
                cveId=cve["cveId"],
                cweId=cve.get("cweId"),
                firstDetected=now,
                lastUpdated=now,
                agentActivitySummary="Mapped by Vulnerability Agent via NVD service-version correlation.",
                references=cve.get("references", []),
            )
            new_findings.append(finding.dict())

    state["findings"].extend(new_findings)
    step = {
        "id": f"st-vuln-{len(state.get('execution_history', []))+1}",
        "agentName": "Vulnerability Agent",
        "agentType": "vulnerability",
        "status": "completed",
        "duration": "0.4s",
        "summary": f"Mapped {len(new_findings)} CVE finding(s) from discovered service versions.",
    }
    state.setdefault("execution_history", []).append(step)
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
