import re
import socket
from urllib.parse import urlparse
from typing import Dict, Any, Tuple

class TargetNormalizer:
    @staticmethod
    def normalize(raw_target: str) -> Dict[str, Any]:
        """
        Takes raw input (e.g. 'HTTPS://VT0P.VITBHOPAL.AC.IN', 'http://127.0.0.1:8000', '10.10.14.5')
        and produces normalized host, domain, full URL, scheme, and port details while preserving original input.
        """
        raw_target = (raw_target or "").strip()
        if not raw_target:
            return {
                "requested_target": "",
                "hostname": "127.0.0.1",
                "domain": "127.0.0.1",
                "url": "http://127.0.0.1",
                "scheme": "http",
                "port": 80,
                "ip": "127.0.0.1"
            }

        # Check if scheme is present
        working_target = raw_target
        if not re.match(r"^https?://", working_target, re.IGNORECASE):
            working_target = f"http://{working_target}"

        try:
            parsed = urlparse(working_target)
            scheme = (parsed.scheme or "http").lower()
            netloc = parsed.netloc or parsed.path.split("/")[0]

            # Extract hostname and port
            if ":" in netloc:
                hostname, port_str = netloc.split(":", 1)
                try:
                    port = int(port_str)
                except ValueError:
                    port = 443 if scheme == "https" else 80
            else:
                hostname = netloc
                port = 443 if scheme == "https" else 80

            hostname = hostname.lower().strip()

            # Clean trailing slash or path from hostname
            hostname = hostname.split("/")[0]

            # Resolve IP if possible
            try:
                ip = socket.gethostbyname(hostname)
            except Exception:
                ip = hostname

            full_url = f"{scheme}://{hostname}:{port}" if (port != 80 and port != 443) else f"{scheme}://{hostname}"

            return {
                "requested_target": raw_target,
                "hostname": hostname,
                "domain": hostname,
                "url": full_url,
                "scheme": scheme,
                "port": port,
                "ip": ip
            }
        except Exception:
            clean_host = re.sub(r"^https?://", "", raw_target, flags=re.IGNORECASE).split("/")[0].split(":")[0].lower()
            return {
                "requested_target": raw_target,
                "hostname": clean_host or "127.0.0.1",
                "domain": clean_host or "127.0.0.1",
                "url": f"http://{clean_host or '127.0.0.1'}",
                "scheme": "http",
                "port": 80,
                "ip": clean_host or "127.0.0.1"
            }

target_normalizer = TargetNormalizer()
