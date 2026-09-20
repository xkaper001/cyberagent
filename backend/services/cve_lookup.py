import os
import threading
import time
import httpx
from functools import lru_cache
from typing import List, Dict, Any, Optional
from backend.config.logging import logger

NVD_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"
NVD_API_KEY = os.getenv("NVD_API_KEY", "")
# Unauthenticated NVD allows 5 requests / 30s; a key raises it to 50.
_MIN_INTERVAL = 1.0 if NVD_API_KEY else 6.5
# ponytail: one global lock, calls are serialized. Fine for one assessment at a
# time; switch to a token bucket if concurrent runs ever matter.
_throttle = threading.Lock()
_last_call = 0.0


class NvdUnavailable(Exception):
    """NVD refused the request (rate limit or outage) — absence of CVEs is unknown, not proven."""


def _wait_turn() -> None:
    global _last_call
    with _throttle:
        gap = time.monotonic() - _last_call
        if gap < _MIN_INTERVAL:
            time.sleep(_MIN_INTERVAL - gap)
        _last_call = time.monotonic()


def _severity_from_cvss(score: Optional[float]) -> str:
    if score is None:
        return "info"
    if score >= 9.0:
        return "critical"
    if score >= 7.0:
        return "high"
    if score >= 4.0:
        return "medium"
    if score > 0:
        return "low"
    return "info"


def _parse_cve(item: Dict[str, Any]) -> Dict[str, Any]:
    cve = item.get("cve", {})
    cve_id = cve.get("id")

    summary = ""
    for d in cve.get("descriptions", []):
        if d.get("lang") == "en":
            summary = d.get("value", "")
            break

    score, severity = None, "info"
    metrics = cve.get("metrics", {})
    for key in ("cvssMetricV31", "cvssMetricV30", "cvssMetricV2"):
        if metrics.get(key):
            data = metrics[key][0].get("cvssData", {})
            score = data.get("baseScore")
            severity = (data.get("baseSeverity") or _severity_from_cvss(score)).lower()
            break

    cwe = None
    for w in cve.get("weaknesses", []):
        for d in w.get("description", []):
            if d.get("value", "").startswith("CWE-"):
                cwe = d["value"]
                break
        if cwe:
            break

    return {
        "cveId": cve_id,
        "cweId": cwe,
        "cvssScore": score,
        "severity": severity,
        "summary": summary,
        "references": [r.get("url") for r in cve.get("references", []) if r.get("url")][:5]
        or [f"https://nvd.nist.gov/vuln/detail/{cve_id}"],
    }


def _cpe23(cpe: str) -> Optional[str]:
    # nmap emits cpe 2.2 (cpe:/a:apache:http_server:2.4.49); NVD wants 2.3.
    if cpe.startswith("cpe:2.3:"):
        return ":".join(cpe.split(":")[:6])
    if cpe.startswith("cpe:/"):
        body = cpe[len("cpe:/"):]
        parts = body.split(":")
        return "cpe:2.3:" + ":".join(parts[:5])
    return None


def _query(params: dict, label: str) -> tuple:
    headers = {"apiKey": NVD_API_KEY} if NVD_API_KEY else {}
    for attempt in (1, 2):
        _wait_turn()
        try:
            resp = httpx.get(NVD_URL, params={**params, "resultsPerPage": 5},
                             headers=headers, timeout=20.0)
        except Exception as e:
            logger.warning(f"NVD lookup {label} failed: {e}")
            return tuple()

        if resp.status_code == 200:
            vulns = resp.json().get("vulnerabilities", [])
            return tuple(_parse_cve(v) for v in vulns if v.get("cve", {}).get("id"))

        if resp.status_code in (429, 503) and attempt == 1:
            logger.warning(f"NVD lookup {label} -> HTTP {resp.status_code}, backing off")
            time.sleep(_MIN_INTERVAL)
            continue

        logger.warning(f"NVD lookup {label} -> HTTP {resp.status_code}")
        if resp.status_code in (429, 503):
            raise NvdUnavailable(f"NVD returned HTTP {resp.status_code} for {label}")
        return tuple()
    return tuple()


@lru_cache(maxsize=256)
def lookup(product: str, version: Optional[str], cpes: tuple = ()) -> tuple:
    # Prefer precise CPE applicability match; keyword is a coarse fallback.
    if cpes:
        seen, out = set(), []
        for cpe in cpes:
            vm = _cpe23(cpe)
            if not vm:
                continue
            for cve in _query({"virtualMatchString": vm}, vm):
                if cve["cveId"] not in seen:
                    seen.add(cve["cveId"])
                    out.append(cve)
        return tuple(out)

    keyword = " ".join(x for x in (product, version) if x).strip()
    if not keyword:
        return tuple()
    return _query({"keywordSearch": keyword}, f"'{keyword}'")
