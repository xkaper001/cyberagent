import time
import httpx
from functools import lru_cache
from typing import List, Dict, Any, Optional
from backend.config.logging import logger

NVD_URL = "https://services.nvd.nist.gov/rest/json/cves/2.0"


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
    try:
        resp = httpx.get(NVD_URL, params={**params, "resultsPerPage": 5}, timeout=20.0)
        if resp.status_code != 200:
            logger.warning(f"NVD lookup {label} -> HTTP {resp.status_code}")
            return tuple()
        vulns = resp.json().get("vulnerabilities", [])
        return tuple(_parse_cve(v) for v in vulns if v.get("cve", {}).get("id"))
    except Exception as e:
        logger.warning(f"NVD lookup {label} failed: {e}")
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
