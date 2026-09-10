from backend.graph.state import SecurityState
from backend.agents.supervisor import supervisor_agent
from backend.agents.planner import planner_agent
from backend.agents.recon import recon_agent
from backend.agents.scanning import scanning_agent
import datetime
import json
from backend.services.cve_lookup import lookup as cve_lookup
from backend.llm.factory import get_llm
from backend.schemas.cyber import FindingSchema, KnowledgeItemSchema, ReportSchema, FindingsSummarySchema


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

def _finding_score(f):
    if f.get("cvssScore") is not None:
        return float(f["cvssScore"])
    return {"critical": 9.5, "high": 7.5, "medium": 5.0, "low": 2.0, "info": 0.0}.get(f.get("severity"), 0.0)


def _deterministic_confidence(f):
    score = 50
    if f.get("cvssScore") is not None:
        score += 20
    if f.get("cweId"):
        score += 10
    if f.get("references"):
        score += 10
    if len(f.get("evidence", [])) >= 2:
        score += 10
    return min(score, 99)

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
                cvssScore=cve.get("cvssScore"),
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

def _llm_confidence(findings):
    items = [
        {"id": f["id"], "cve": f.get("cveId"), "evidence": f.get("evidence", []),
         "cvss": f.get("cvssScore")}
        for f in findings
    ]
    prompt = (
        "You are a security findings critic. For each finding, judge how confident "
        "we should be (0-100) that the CVE genuinely applies to the observed service, "
        "based on the evidence vs. a version-only match. Reply ONLY with a JSON array of "
        '{"id": str, "confidence": int, "verdict": "valid"|"needs_review"|"rejected", "reason": str}. '
        f"Findings: {json.dumps(items)}"
    )
    resp = get_llm(temperature=0.0).invoke(prompt)
    text = getattr(resp, "content", str(resp)).strip()
    if text.startswith("```"):
        text = text.split("```")[1].lstrip("json").strip()
    return {r["id"]: r for r in json.loads(text)}


def critic_node(state: SecurityState) -> SecurityState:
    state["current_agent"] = "critic"
    findings = state.get("findings", [])
    mode = "deterministic"
    verdicts = {}

    if findings:
        try:
            verdicts = _llm_confidence(findings)
            mode = "llm"
        except Exception as e:
            state.setdefault("errors", []).append(f"Critic LLM fallback: {e}")

    for f in findings:
        v = verdicts.get(f["id"])
        if v and isinstance(v.get("confidence"), int):
            f["confidence"] = max(0, min(v["confidence"], 100))
            verdict = v.get("verdict", "valid")
            f["status"] = "rejected" if verdict == "rejected" else "active"
            if v.get("reason"):
                f["agentActivitySummary"] = f"Critic ({verdict}): {v['reason']}"
        else:
            f["confidence"] = _deterministic_confidence(f)

    kept = [f for f in findings if f.get("status") != "rejected"]
    avg = round(sum(f["confidence"] for f in kept) / len(kept)) if kept else 0
    step = {
        "id": "st-crit-1",
        "agentName": "Critic Agent",
        "agentType": "critic",
        "status": "completed",
        "duration": "1.2s",
        "summary": f"Reviewed {len(findings)} finding(s) via {mode}; {len(kept)} retained, avg confidence {avg}%.",
    }
    state.setdefault("execution_history", []).append(step)
    return state

def _risk_level(score):
    if score >= 9.0:
        return "Critical"
    if score >= 7.0:
        return "High"
    if score >= 4.0:
        return "Medium"
    if score > 0:
        return "Low"
    return "Informational"


def risk_node(state: SecurityState) -> SecurityState:
    state["current_agent"] = "risk"
    active = [f for f in state.get("findings", []) if f.get("status") != "rejected"]
    scores = [_finding_score(f) for f in active]

    if scores:
        base = max(scores)
        extra = sum(1 for f in active if f.get("severity") in ("critical", "high")) - 1
        risk = min(round(base + max(extra, 0) * 0.1, 1), 10.0)
    else:
        risk = 0.0

    state["risk_score"] = risk
    step = {
        "id": "st-risk-1",
        "agentName": "Risk Agent",
        "agentType": "risk",
        "status": "completed",
        "duration": "1.1s",
        "summary": f"Composite risk {risk}/10 ({_risk_level(risk)}) from {len(active)} finding(s).",
    }
    state.setdefault("execution_history", []).append(step)
    return state

def report_node(state: SecurityState) -> SecurityState:
    import datetime as _dt
    state["current_agent"] = "report"
    target = state.get("target", "")
    active = [f for f in state.get("findings", []) if f.get("status") != "rejected"]
    risk = state.get("risk_score", 0.0)
    level = _risk_level(risk)

    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for f in active:
        counts[f.get("severity", "info")] = counts.get(f.get("severity", "info"), 0) + 1

    services = discovered_services(state)
    ports = sorted({s["port"] for s in services})
    attack_surface = (
        f"{len(ports)} open service port(s) with version banners: "
        + ", ".join(f"{s['port']}/{s['service']}" for s in services)
        if services else "No versioned services identified in the scanned range."
    )

    top = sorted(active, key=_finding_score, reverse=True)
    top_cves = [f["cveId"] for f in top[:3] if f.get("cveId")]
    exec_summary = (
        f"Automated multi-agent assessment of {target} discovered {len(services)} versioned "
        f"service(s) and {len(active)} CVE finding(s) (composite risk {risk}/10, {level}). "
        + (f"Highest-impact: {', '.join(top_cves)}." if top_cves else "No CVEs matched.")
    )

    roadmap, seen_rem = [], set()
    for f in top:
        rem = f.get("remediation")
        if rem and rem not in seen_rem:
            seen_rem.add(rem)
            roadmap.append(rem)
    roadmap = roadmap[:5]

    report = ReportSchema(
        id=f"rep-{int(_dt.datetime.utcnow().timestamp())}",
        title=f"Security Assessment — {target}",
        date=_dt.datetime.utcnow().date().isoformat(),
        riskScore=risk,
        riskLevel=level,
        findingsCount=len(active),
        status="Completed",
        target=target,
        executiveSummary=exec_summary,
        attackSurface=attack_surface,
        findingsSummary=FindingsSummarySchema(**counts),
        remediationRoadmap=roadmap,
    )
    state["report"] = report.dict()

    lines = [
        f"### Security Assessment Result for `{target}`",
        "",
        f"**Composite Risk Score**: `{risk} / 10` (**{level}**)",
        "",
        f"Discovered **{len(services)} versioned service(s)** and **{len(active)} CVE finding(s)** "
        f"(critical: {counts['critical']}, high: {counts['high']}, medium: {counts['medium']}, "
        f"low: {counts['low']}).",
    ]
    if top_cves:
        lines.append("")
        lines.append("Highest-impact: " + ", ".join(top_cves) + ".")
    state["final_response"] = "\n".join(lines)

    step = {
        "id": "st-rep-1",
        "agentName": "Report Agent",
        "agentType": "report",
        "status": "completed",
        "duration": "1.7s",
        "summary": f"Compiled report: {len(active)} finding(s), risk {risk}/10 ({level}).",
    }
    state.setdefault("execution_history", []).append(step)
    return state
