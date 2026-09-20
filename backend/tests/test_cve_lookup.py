"""NVD client: rate-limit honesty and request spacing."""
import time
import httpx
import backend.services.cve_lookup as cl


class _Resp:
    def __init__(self, status: int, payload=None):
        self.status_code = status
        self._payload = payload or {"vulnerabilities": []}

    def json(self):
        return self._payload


def _patch(responses, monkeypatch_interval=0.05):
    calls = {"n": 0, "at": []}

    def fake_get(url, params=None, headers=None, timeout=None):
        calls["at"].append(time.monotonic())
        r = responses[min(calls["n"], len(responses) - 1)]
        calls["n"] += 1
        return r

    cl.httpx = type("stub", (), {"get": staticmethod(fake_get)})
    cl._MIN_INTERVAL = monkeypatch_interval
    cl._last_call = 0.0
    return calls


def test_rate_limit_raises_instead_of_reporting_zero_cves():
    _patch([_Resp(429), _Resp(429)])
    try:
        cl._query({"keywordSearch": "OpenSSH"}, "'OpenSSH'")
    except cl.NvdUnavailable:
        pass
    else:
        raise AssertionError("a rate-limited NVD must not look like 'no CVEs found'")


def test_retries_once_then_succeeds():
    calls = _patch([_Resp(429), _Resp(200, {"vulnerabilities": []})])
    assert cl._query({"keywordSearch": "x"}, "x") == ()
    assert calls["n"] == 2, "should retry a 429 exactly once"


def test_requests_are_spaced_by_the_throttle():
    calls = _patch([_Resp(200)], monkeypatch_interval=0.2)
    cl._query({"keywordSearch": "a"}, "a")
    cl._query({"keywordSearch": "b"}, "b")
    assert calls["at"][1] - calls["at"][0] >= 0.19, "throttle must space NVD calls"


def test_non_rate_limit_error_is_empty_not_an_exception():
    _patch([_Resp(404)])
    assert cl._query({"keywordSearch": "nope"}, "nope") == ()


if __name__ == "__main__":
    import sys
    real_httpx = httpx
    for name, fn in sorted(globals().items()):
        if name.startswith("test_"):
            fn()
            print(f"ok  {name}")
    cl.httpx = real_httpx
    sys.exit(0)
