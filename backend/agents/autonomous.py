import json
import datetime
from typing import Any, Dict, Iterator, List

from langchain_core.tools import tool
from langchain_core.messages import HumanMessage, SystemMessage, ToolMessage, AIMessage

from backend.llm.factory import get_llm
from backend.tools.registry import tool_registry
from backend.services.cve_lookup import lookup as cve_lookup, NvdUnavailable
from backend.graph.nodes import _finding_score, _risk_level

MAX_STEPS = 16

SYSTEM_PROMPT = """You are an autonomous authorized penetration-testing agent.
The target has ALREADY been authorized by the operator and validated in scope.

You decide, on your own, which tools to run and in what order — there is no fixed
pipeline. Typical flow: resolve DNS, inspect HTTP headers, run a service/version
nmap scan, then map discovered service versions to CVEs. But adapt to what you find.

Rules:
- Only assess the given target.
- NEVER attempt real exploitation. For any exploitable CVE you may call
  exploit_advisor to get remediation/PoC guidance, which is advice only.
- Call record_finding for each genuine, evidence-backed vulnerability.
- When you have gathered enough evidence and recorded findings, call finish with a
  short risk summary. Do not loop forever.
Think briefly before each tool call about why you're choosing it."""


def build_agent(target: str):
    findings: List[Dict[str, Any]] = []

    @tool
    def dns_lookup(host: str) -> str:
        """Resolve DNS A records for the target host."""
        r = tool_registry.execute_tool("dns_lookup", {"target": host}, profile="standard_resolution")
        return json.dumps((r.get("output") or {}).get("resolved_ips") or r.get("error") or [])

    @tool
    def http_headers(host: str) -> str:
        """Fetch HTTP response headers / server banner for the target."""
        r = tool_registry.execute_tool("http_probe", {"target": host}, profile="header_inspection")
        out = r.get("output") or {}
        return json.dumps({"server": out.get("server"), "status": out.get("status_line"), "error": r.get("error")})

    @tool
    def nmap(host: str, flags: str = "-sV -p 80,443,8080,22") -> str:
        """Run nmap against the authorized target. You choose the flags.

        Pass `flags` exactly as you would type them after `nmap`, without the target
        and without an output flag. Examples:
          "-sn"                        host discovery / ping sweep
          "-sV -p 80,443,8080,22"      service + version detection on chosen ports
          "-sV -p-  -T4"               all 65535 ports, faster timing
          "-sT --top-ports 100 --open" connect scan, common ports, open only
          "-sV --version-intensity 9"  aggressive version probing
          "-O"                         OS fingerprinting
        Choose timing (-T0..-T5), technique (-sS/-sT/-sU/-sn), ports (-p) and
        version intensity to suit what you have already learned about the target.

        Blocked by policy: -iL/-iR (targets from elsewhere), -oN/-oX/-oG/-oA
        (output redirection), and --script (NSE) — this system never runs exploit
        code. A blocked call returns an error explaining which flag was refused;
        retry with different flags.

        Returns the executed command plus open ports with product/version/CPE.
        """
        r = tool_registry.execute_tool(
            "nmap", {"target": host, "options": {"args": flags}}, profile="agent_directed"
        )
        if r.get("error"):
            return json.dumps({"error": r["error"]})
        hosts = (r.get("output") or {}).get("hosts", [])
        svc = [
            {"port": p["port"], "service": p.get("service"), "product": p.get("product"),
             "version": p.get("version"), "cpes": p.get("cpes", [])}
            for h in hosts for p in h.get("ports", []) if p.get("state") == "open"
        ]
        return json.dumps({"command": r.get("command"), "open_ports": svc})

    @tool
    def cve_search(product: str, version: str = "", cpe: str = "") -> str:
        """Look up real CVEs from NVD for a discovered service. Prefer passing the exact CPE from nmap."""
        cpes = (cpe,) if cpe else ()
        try:
            cves = cve_lookup(product, version or None, cpes)
        except NvdUnavailable as e:
            # Tell the agent the truth: no answer, not "no CVEs". Otherwise it
            # keeps rephrasing the query against a rate-limited API.
            return json.dumps({"error": f"CVE database unavailable: {e}. Do not retry this service."})
        return json.dumps([
            {"cveId": c["cveId"], "cvss": c.get("cvssScore"), "severity": c["severity"],
             "cwe": c.get("cweId"), "summary": c["summary"][:200]}
            for c in cves[:8]
        ] or {"matches": 0})

    @tool
    def exploit_advisor(cve_id: str, service: str = "") -> str:
        """Get remediation and defensive guidance for a CVE. ADVICE ONLY — never executes anything."""
        return json.dumps({
            "cve": cve_id,
            "guidance": f"Review NVD advisory for {cve_id}. Confirm the affected version of {service}, "
                        f"apply the vendor patch, and restrict exposure. No exploit was run.",
            "reference": f"https://nvd.nist.gov/vuln/detail/{cve_id}",
            "note": "advisory only",
        })

    @tool
    def record_finding(cve_id: str, severity: str, cvss: float, service: str, target_ip: str,
                       evidence: str, remediation: str) -> str:
        """Record a confirmed, evidence-backed vulnerability finding."""
        now = datetime.datetime.utcnow().isoformat() + "Z"
        f = {
            "id": f"fnd-{cve_id}-{len(findings)}", "cveId": cve_id, "title": f"{cve_id} in {service}",
            "severity": (severity or "info").lower(), "cvssScore": cvss, "confidence": 90,
            "asset": f"{target} ({target_ip})", "targetIp": target_ip, "status": "active",
            "category": "Known Vulnerability (CVE)", "evidence": [evidence],
            "impact": f"{service} affected by {cve_id} (CVSS {cvss}).", "remediation": remediation,
            "cweId": None, "firstDetected": now, "lastUpdated": now,
            "references": [f"https://nvd.nist.gov/vuln/detail/{cve_id}"],
        }
        findings.append(f)
        return json.dumps({"recorded": f["id"]})

    @tool
    def finish(summary: str) -> str:
        """Conclude the assessment with a short risk summary once findings are recorded."""
        return "done"

    tools = [dns_lookup, http_headers, nmap, cve_search, exploit_advisor, record_finding, finish]
    return tools, findings


def _summary_text(target: str, findings: List[Dict], risk: float, level: str, note: str) -> str:
    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for f in findings:
        counts[f.get("severity", "info")] = counts.get(f.get("severity", "info"), 0) + 1
    top = sorted(findings, key=_finding_score, reverse=True)[:3]
    lines = [
        f"### Assessment Result for `{target}`", "",
        f"**Composite Risk Score**: `{risk} / 10` (**{level}**)", "",
        f"The autonomous agent recorded **{len(findings)} finding(s)** "
        f"(critical: {counts['critical']}, high: {counts['high']}, medium: {counts['medium']}, low: {counts['low']}).",
    ]
    if top:
        lines += ["", "Highest-impact: " + ", ".join(f["cveId"] for f in top) + "."]
    if note:
        lines += ["", note]
    return "\n".join(lines)


def run_autonomous(target: str, target_ip: str) -> Iterator[Dict[str, Any]]:
    """Yields SSE-ready event dicts as the agent autonomously decides + acts. Last event is the summary."""
    tools, findings = build_agent(target)
    by_name = {t.name: t for t in tools}
    llm = get_llm(temperature=0.1).bind_tools(tools)

    messages: List[Any] = [
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=f"Autonomously assess the authorized target {target} (resolved IP {target_ip})."),
    ]

    finished = False
    finish_note = ""
    step = 0
    tool_seq = 0

    while step < MAX_STEPS and not finished:
        step += 1
        try:
            ai: AIMessage = llm.invoke(messages)
        except Exception as e:
            yield {"event": "agent_step", "step": {"id": f"st-{step}", "agentName": "Agent",
                   "agentType": "autonomous", "status": "failed", "summary": f"LLM error: {e}"}}
            break
        messages.append(ai)

        thought = (ai.content or "").strip()
        if thought:
            yield {"event": "agent_step", "step": {"id": f"st-think-{step}", "agentName": "Agent",
                   "agentType": "autonomous", "status": "completed", "duration": f"step {step}", "summary": thought}}

        if not ai.tool_calls:
            finish_note = thought
            break

        for tc in ai.tool_calls:
            name, args, tc_id = tc["name"], tc.get("args", {}), tc["id"]
            tool_seq += 1
            tid = f"tool-{tool_seq}"
            arg_str = ", ".join(f"{k}={v}" for k, v in args.items())
            yield {"event": "tool_started", "tool_id": tid, "agent": "autonomous",
                   "tool": name, "target": arg_str[:80],
                   "input": json.dumps(args, indent=2)}

            if name == "finish":
                finished = True
                finish_note = args.get("summary", "")
                messages.append(ToolMessage(content="done", tool_call_id=tc_id))
                yield {"event": "tool_completed", "tool_id": tid, "tool": name, "target": arg_str[:80],
                       "status": "success", "input": json.dumps(args, indent=2),
                       "output": json.dumps({"summary": finish_note}, indent=2)}
                continue

            t0 = datetime.datetime.now()
            try:
                result = by_name[name].invoke(args)
            except Exception as e:
                result = json.dumps({"error": str(e)})
            dur = f"{(datetime.datetime.now() - t0).total_seconds():.2f}s"
            messages.append(ToolMessage(content=str(result), tool_call_id=tc_id))

            blocked = "TARGET_OUT_OF_SCOPE" in str(result) or "Scope Policy Violation" in str(result)
            yield {"event": "tool_completed", "tool_id": tid, "tool": name, "target": arg_str[:80],
                   "status": "blocked" if blocked else "success", "duration": dur,
                   "input": json.dumps(args, indent=2), "output": _pretty(result)}

            if name == "record_finding":
                yield {"event": "finding_created", "agent": "autonomous", "finding": findings[-1]}

    # Risk from recorded findings (agent-controlled)
    scores = [_finding_score(f) for f in findings]
    if scores:
        base = max(scores)
        extra = sum(1 for f in findings if f.get("severity") in ("critical", "high")) - 1
        risk = min(round(base + max(extra, 0) * 0.1, 1), 10.0)
    else:
        risk = 0.0
    level = _risk_level(risk)

    counts = {"critical": 0, "high": 0, "medium": 0, "low": 0, "info": 0}
    for f in findings:
        counts[f.get("severity", "info")] = counts.get(f.get("severity", "info"), 0) + 1

    report = {
        "riskLevel": level,
        "executiveSummary": finish_note or f"Autonomous assessment of {target} recorded {len(findings)} finding(s).",
        "attackSurface": f"{len(findings)} CVE finding(s) across discovered services.",
        "findingsSummary": counts,
        "remediationRoadmap": [f.get("remediation") for f in sorted(findings, key=_finding_score, reverse=True)][:5],
    }
    yield {
        "event": "run_summary",
        "target": target,
        "risk": risk,
        "report": report,
        "findings": findings,
        "final_text": _summary_text(target, findings, risk, level, finish_note),
        "steps": step,
    }


def _pretty(result: Any) -> str:
    """Tool output as indented JSON when possible, truncated for transport."""
    s = str(result)
    try:
        s = json.dumps(json.loads(s), indent=2)
    except Exception:
        pass
    return s[:4000] + "\n… (truncated)" if len(s) > 4000 else s
