import os
os.environ.setdefault("DATABASE_URL", "sqlite:///./cyberagents.db")

from backend.services.cve_lookup import _cpe23, _severity_from_cvss
import backend.graph.nodes as N


def test_cpe22_to_cpe23():
    assert _cpe23("cpe:/a:apache:http_server:2.4.49") == "cpe:2.3:a:apache:http_server:2.4.49"
    assert _cpe23("cpe:2.3:a:openbsd:openssh:8.2p1:x:y") == "cpe:2.3:a:openbsd:openssh:8.2p1"
    assert _cpe23("garbage") is None


def test_severity_bands():
    assert _severity_from_cvss(9.8) == "critical"
    assert _severity_from_cvss(7.5) == "high"
    assert _severity_from_cvss(5.0) == "medium"
    assert _severity_from_cvss(1.0) == "low"
    assert _severity_from_cvss(None) == "info"


FAKE = {
    ("Apache httpd", "2.4.49", ("cpe:/a:apache:http_server:2.4.49",)): (
        {"cveId": "CVE-2021-41773", "cweId": "CWE-22", "cvssScore": 9.8, "severity": "critical",
         "summary": "path traversal", "references": ["https://nvd.nist.gov/vuln/detail/CVE-2021-41773"]},
    ),
    ("OpenSSH", "8.2p1", ("cpe:/a:openbsd:openssh:8.2p1",)): (
        {"cveId": "CVE-2020-14145", "cweId": "CWE-200", "cvssScore": 5.9, "severity": "medium",
         "summary": "info leak", "references": []},
    ),
}


def _stub(product, version, cpes=()):
    return FAKE.get((product, version, tuple(cpes)), tuple())


def _state():
    job = {"tool_name": "nmap", "output": {"hosts": [{"address": "10.0.0.1", "ports": [
        {"port": 80, "protocol": "tcp", "state": "open", "service": "http",
         "product": "Apache httpd", "version": "2.4.49", "cpes": ["cpe:/a:apache:http_server:2.4.49"]},
        {"port": 22, "protocol": "tcp", "state": "open", "service": "ssh",
         "product": "OpenSSH", "version": "8.2p1", "cpes": ["cpe:/a:openbsd:openssh:8.2p1"]},
        {"port": 443, "protocol": "tcp", "state": "closed", "service": "https",
         "product": "nginx", "version": "1", "cpes": []},
    ]}]}}
    return {"target": "10.0.0.1", "user_request": "scan", "evidence": [], "tool_results": [job],
            "execution_history": [], "retrieved_documents": [], "findings": [], "current_agent": ""}


def test_nodes_build_real_findings_from_cves(monkeypatch=None):
    orig = N.cve_lookup
    N.cve_lookup = _stub
    try:
        st = _state()
        st = N.research_node(st)
        st = N.vulnerability_node(st)
    finally:
        N.cve_lookup = orig

    cves = {f["cveId"] for f in st["findings"]}
    assert cves == {"CVE-2021-41773", "CVE-2020-14145"}
    by_ip = {f["cveId"]: f["targetIp"] for f in st["findings"]}
    assert by_ip["CVE-2021-41773"] == "10.0.0.1:80"
    assert by_ip["CVE-2020-14145"] == "10.0.0.1:22"
    assert not any(f["targetIp"].endswith(":443") for f in st["findings"])  # closed excluded
    assert len(st["retrieved_documents"]) == 2
    apache = next(f for f in st["findings"] if f["cveId"] == "CVE-2021-41773")
    assert apache["severity"] == "critical" and apache["cweId"] == "CWE-22"

    # idempotent: re-run vuln node does not duplicate
    N.cve_lookup = _stub
    try:
        n_before = len(st["findings"])
        st = N.vulnerability_node(st)
    finally:
        N.cve_lookup = orig
    assert len(st["findings"]) == n_before


if __name__ == "__main__":
    test_cpe22_to_cpe23()
    test_severity_bands()
    test_nodes_build_real_findings_from_cves()
    print("all phase2 checks passed")
