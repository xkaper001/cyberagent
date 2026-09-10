import re
from typing import Dict, Any, List

class DNSParser:
    @staticmethod
    def parse_dig_output(raw_output: str, target: str) -> Dict[str, Any]:
        records = []
        for line in raw_output.splitlines():
            line = line.strip()
            if not line or line.startswith(";"):
                continue
            records.append(line)
        return {
            "target": target,
            "resolved_ips": records,
            "count": len(records)
        }

class HTTPParser:
    @staticmethod
    def parse_header_output(raw_output: str, target: str) -> Dict[str, Any]:
        headers = {}
        status_line = ""
        for line in raw_output.splitlines():
            line = line.strip()
            if not line:
                continue
            if line.startswith("HTTP/"):
                status_line = line
                continue
            if ":" in line:
                k, v = line.split(":", 1)
                headers[k.strip().lower()] = v.strip()

        server_banner = headers.get("server", "Unknown Web Server")
        content_type = headers.get("content-type", "")

        return {
            "target": target,
            "status_line": status_line,
            "server": server_banner,
            "content_type": content_type,
            "headers": headers
        }
