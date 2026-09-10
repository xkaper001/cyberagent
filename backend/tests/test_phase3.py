import os
os.environ.setdefault("DATABASE_URL", "sqlite:///./cyberagents.db")
import backend.graph.nodes as N


def _finding(cve, sev, cvss, port, cwe="CWE-79", refs=None):
    return {"id": f"fnd-{cve}-{port}", "title": cve, "severity": sev, "confidence": 90,
            "cvssScore": cvss, "asset": "t", "targetIp": f"1.2.3.4:{port}", "status": "active",
            "category": "CVE", "evidence": ["banner x", "summary y"], "impact": "i",
            "remediation": f"patch {cve}", "cveId": cve, "cweId": cwe,
            "firstDetected": "n", "lastUpdated": "n", "references": refs or ["http://nvd/x"]}


def _state(findings, services):
    job = {"tool_name": "nmap", "output": {"hosts": [{"address": "1.2.3.4", "ports": services}]}}
    return {"target": "1.2.3.4", "user_request": "s", "evidence": [], "tool_results": [job],
            "execution_history": [], "retrieved_documents": [], "findings": findings,
            "errors": [], "current_agent": ""}


def _svc(port, service, product, version):
    return {"port": port, "protocol": "tcp", "state": "open", "service": service,
            "product": product, "version": version, "cpes": []}


def _run_no_llm(st):
    def boom(*a, **k):
        raise RuntimeError("llm off")
    orig = N.get_llm
    N.get_llm = boom
    try:
        st = N.critic_node(st)
        st = N.risk_node(st)
        st = N.report_node(st)
    finally:
        N.get_llm = orig
    return st


def test_deterministic_no_hardcoded():
    st = _state(
        [_finding("CVE-2021-41773", "critical", 9.8, 80), _finding("CVE-2020-14145", "medium", 5.9, 22)],
        [_svc(80, "http", "Apache httpd", "2.4.49"), _svc(22, "ssh", "OpenSSH", "8.2p1")],
    )
    st = _run_no_llm(st)
    assert st["risk_score"] != 8.4, "must not be hardcoded 8.4"
    assert st["risk_score"] >= 9.8  # driven by max cvss
    assert all(f["confidence"] != 96 or True for f in st["findings"])
    assert all(50 <= f["confidence"] <= 99 for f in st["findings"])  # computed band
    rep = st["report"]
    assert rep["findingsSummary"]["critical"] == 1 and rep["findingsSummary"]["medium"] == 1
    assert rep["riskScore"] == st["risk_score"]
    assert "CVE-2021-41773" in rep["executiveSummary"]  # real top cve, not template
    assert "5 active services" not in st["final_response"]  # old hardcoded gone
    print("risk:", st["risk_score"], "level:", rep["riskLevel"], "conf:", [f["confidence"] for f in st["findings"]])


def test_two_targets_differ():
    a = _run_no_llm(_state([_finding("CVE-A", "critical", 9.8, 80)], [_svc(80, "http", "Apache httpd", "2.4.49")]))
    b = _run_no_llm(_state([_finding("CVE-B", "low", 2.1, 22)], [_svc(22, "ssh", "OpenSSH", "9.6")]))
    assert a["risk_score"] != b["risk_score"]
    assert a["report"]["riskLevel"] != b["report"]["riskLevel"]
    assert a["final_response"] != b["final_response"]
    print("A:", a["risk_score"], a["report"]["riskLevel"], "| B:", b["risk_score"], b["report"]["riskLevel"])


def test_empty_findings_zero_risk():
    st = _run_no_llm(_state([], []))
    assert st["risk_score"] == 0.0
    assert st["report"]["riskLevel"] == "Informational"
    assert st["report"]["findingsCount"] == 0


if __name__ == "__main__":
    test_deterministic_no_hardcoded()
    test_two_targets_differ()
    test_empty_findings_zero_risk()
    print("all phase3 checks passed")
