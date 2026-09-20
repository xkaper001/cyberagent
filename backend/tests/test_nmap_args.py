"""Agent-chosen nmap flags: what the policy must allow and must refuse."""
from backend.execution.policy import execution_policy as p


def test_allows_agent_chosen_scan_flags():
    for args in [
        "-sn",
        "-sV -p 80,443,8080,22",
        "-sV -p- -T4",
        "-sT --top-ports 100 --open",
        "-sV --version-intensity 9",
        "-O",
        "-p1-1024",
        "",
    ]:
        ok, err, _ = p.validate_nmap_args(args)
        assert ok, f"{args!r} should be allowed, got: {err}"


def test_blocks_target_sourcing():
    for args in ["-iL /tmp/hosts.txt", "-iR 1000", "--excludefile /etc/passwd"]:
        ok, err, _ = p.validate_nmap_args(args)
        assert not ok and "not permitted" in err


def test_blocks_output_redirection():
    for args in ["-oN /tmp/out.txt", "-oA scan", "-oX /workspace/x.xml"]:
        ok, _, _ = p.validate_nmap_args(args)
        assert not ok


def test_blocks_nse_scripts():
    for args in ["--script vuln", "--script=exploit", "--script-args creds=x"]:
        ok, _, _ = p.validate_nmap_args(args)
        assert not ok


def test_blocks_a_second_target_smuggled_into_args():
    for args in ["-sV 10.0.0.5", "-sV example.com", "-sV 192.168.1.0/24"]:
        ok, err, _ = p.validate_nmap_args(args)
        assert not ok and "scan target" in err


def test_port_values_are_not_mistaken_for_targets():
    ok, err, argv = p.validate_nmap_args("-p 80,443 -T4 --top-ports 20")
    assert ok, err
    assert argv == ["-p", "80,443", "-T4", "--top-ports", "20"]


if __name__ == "__main__":
    for name, fn in sorted(globals().items()):
        if name.startswith("test_"):
            fn()
            print(f"ok  {name}")
