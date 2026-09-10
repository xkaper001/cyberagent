import os
os.environ.setdefault("DATABASE_URL", "sqlite:///./cyberagents.db")

from security_worker_shim import NmapParser  # noqa

XML_A = """<?xml version="1.0"?><nmaprun>
<host><status state="up"/><address addr="10.0.0.1"/>
<ports>
<port protocol="tcp" portid="22"><state state="open"/><service name="ssh" product="OpenSSH" version="8.9"/></port>
<port protocol="tcp" portid="80"><state state="open"/><service name="http" product="nginx" version="1.24.0"/></port>
<port protocol="tcp" portid="443"><state state="closed"/><service name="https"/></port>
</ports></host></nmaprun>"""

XML_EMPTY = """<?xml version="1.0"?><nmaprun>
<host><status state="up"/><address addr="10.0.0.2"/>
<ports>
<port protocol="tcp" portid="80"><state state="filtered"/><service name="http"/></port>
</ports></host></nmaprun>"""


def _run_agent(parsed, error=None):
    from backend.agents.scanning import scanning_agent
    import backend.agents.scanning as scan_mod

    class FakeReg:
        def execute_tool(self, **kw):
            return {"output": parsed, "error": error, "duration": "1.2s"}

    orig = scan_mod.tool_registry
    scan_mod.tool_registry = FakeReg()
    try:
        state = {"target": "t", "evidence": [], "tool_results": [], "execution_history": [], "current_agent": ""}
        return scanning_agent.execute(state)
    finally:
        scan_mod.tool_registry = orig


def test_open_ports_drive_evidence():
    parsed = NmapParser.parse_xml(XML_A)
    st = _run_agent(parsed)
    ev = " ".join(st["evidence"])
    assert "22" in ev and "ssh" in ev and "OpenSSH 8.9" in ev
    assert "80" in ev and "nginx 1.24.0" in ev
    assert "443" not in ev  # closed port excluded
    assert st["tool_results"], "raw job stored for downstream"


def test_no_open_ports_is_empty_not_fake():
    parsed = NmapParser.parse_xml(XML_EMPTY)
    st = _run_agent(parsed)
    ev = " ".join(st["evidence"])
    assert "no open ports" in ev.lower()
    assert "spring-actuator" not in ev and "Apache" not in ev  # no hardcoded fakes


def test_scan_error_surfaces():
    st = _run_agent({}, error={"message": "TOOL_NOT_INSTALLED: nmap"})
    assert "failed" in " ".join(st["evidence"]).lower()


if __name__ == "__main__":
    test_open_ports_drive_evidence()
    test_no_open_ports_is_empty_not_fake()
    test_scan_error_surfaces()
    print("all scanning checks passed")


def _run_recon(dns_out, http_out, dns_err=None, http_err=None):
    import backend.agents.recon as recon_mod
    jobs = iter([
        {"output": dns_out, "error": dns_err, "duration": "0.3s"},
        {"output": http_out, "error": http_err, "duration": "0.4s"},
    ])

    class FakeReg:
        def execute_tool(self, *a, **k):
            return next(jobs)

    orig = recon_mod.tool_registry
    recon_mod.tool_registry = FakeReg()
    try:
        state = {"target": "t", "evidence": [], "tool_results": [], "execution_history": [], "current_agent": ""}
        return recon_mod.recon_agent.execute(state)
    finally:
        recon_mod.tool_registry = orig


def test_recon_uses_real_dns_and_banner():
    st = _run_recon(
        {"resolved_ips": ["93.184.216.34"], "count": 1},
        {"server": "ECS (dcb/7EA3)", "status_line": "HTTP/1.1 200 OK"},
    )
    ev = " ".join(st["evidence"])
    assert "93.184.216.34" in ev
    assert "ECS (dcb/7EA3)" in ev
    assert "Apache/2.4.49" not in ev  # killed fake default banner
    assert "TLS/SSL details inspected" not in ev  # killed fake TLS line


def test_recon_no_records_is_honest():
    st = _run_recon({"resolved_ips": [], "count": 0}, {"server": "Unknown Web Server", "status_line": ""})
    ev = " ".join(st["evidence"]).lower()
    assert "no records" in ev
