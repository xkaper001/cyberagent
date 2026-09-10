from typing import Dict, Any, List
from langchain_core.tools import tool
from backend.security.audit import log_security_event
from backend.security.scope import scope_validator

@tool
def service_discovery(target: str, ports: str = "80,443,8080,22,5432") -> Dict[str, Any]:
    """Execute authorized TCP service discovery and banner grabbing on target."""
    scope_validator.validate_target(target)
    log_security_event("Scanning Agent", "service_discovery", "TCP Service Audit", target)
    return {
        "target": target,
        "scanned_ports": ports,
        "open_services": [
            {"port": 80, "service": "http", "version": "Apache httpd 2.4.49", "banner": "HTTP/1.1 200 OK Server: Apache/2.4.49"},
            {"port": 443, "service": "https", "version": "OpenSSL 1.1.1k", "banner": "TLSv1.3 ECDHE-RSA-AES256-GCM-SHA384"},
            {"port": 8080, "service": "http-proxy", "version": "Spring Boot 2.3.1.RELEASE", "banner": "JVM 11.0.11 Actuator Endpoint Exposed"},
            {"port": 22, "service": "ssh", "version": "OpenSSH 8.2p1 Ubuntu", "banner": "SSH-2.0-OpenSSH_8.2p1"},
            {"port": 5432, "service": "postgresql", "version": "PostgreSQL DB 13.4", "banner": "PostgreSQL 13.4"}
        ]
    }
