"""
CyberAgents — Authoritative Scope Validator
--------------------------------------------
Single source of truth for all scope decisions across:
  - Supervisor Agent
  - LangGraph nodes
  - LangChain tools
  - Terminal Execution Manager
  - WorkerManager

DO NOT add parallel scope checks elsewhere.
"""
import ipaddress
import re
import socket
from typing import Dict, Any, Optional
from backend.config.settings import settings
from backend.utils.target_normalizer import target_normalizer


class TargetValidationError(Exception):
    pass


class ScopeDecision:
    AUTHORIZED = "AUTHORIZED"
    BLOCKED_SCOPE = "BLOCKED_SCOPE"
    BLOCKED_POLICY = "BLOCKED_POLICY"


class TargetScopeValidator:
    """
    Canonical, unified scope validator.

    Assessment-level scope is preferred over global subnet settings.
    The validator normalises the target before comparing so that:
        https://Target.Lab/path
        target.lab
        TARGET.LAB:443
    all resolve to "target.lab" before checking.
    """

    def __init__(self, allowed_subnets: Optional[str] = None):
        if allowed_subnets is None:
            allowed_subnets = settings.DEFAULT_AUTHORIZED_SUBNETS
        self._global_networks = self._parse_networks(allowed_subnets)

    @staticmethod
    def _parse_networks(subnet_str: str):
        networks = []
        for item in subnet_str.split(","):
            item = item.strip()
            if not item:
                continue
            if item.lower() in ("localhost", "127.0.0.1"):
                networks.append(ipaddress.ip_network("127.0.0.1/32"))
                continue
            try:
                if "/" not in item:
                    item = f"{item}/32"
                networks.append(ipaddress.ip_network(item, strict=False))
            except ValueError:
                pass
        return networks

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def check(
        self,
        target: str,
        assessment_scope: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Returns a structured scope decision dict:
        {
            "decision": "AUTHORIZED" | "BLOCKED_SCOPE",
            "reason": str,
            "canonical_target": str,
            "normalized": {...},
            "assessment_scope": str | None,
        }
        """
        if settings.ALLOW_UNAUTHORIZED_TARGETS:
            norm = target_normalizer.normalize(target)
            return _ok(target, norm, assessment_scope, "ALLOW_UNAUTHORIZED_TARGETS flag is set")

        norm = target_normalizer.normalize(target)
        canonical = norm["hostname"]

        # 1. Always allow loopback
        if canonical in ("localhost", "127.0.0.1") or norm["ip"] == "127.0.0.1":
            return _ok(target, norm, assessment_scope, "Loopback address — authorized for testing")

        # 2. Check assessment-level scope target
        if assessment_scope:
            asm_targets = [t.strip() for t in assessment_scope.split(",") if t.strip()]
            for single_scope in asm_targets:
                asm_norm = target_normalizer.normalize(single_scope)
                asm_host = asm_norm["hostname"]
                if canonical == asm_host or norm["ip"] == asm_norm["ip"] or canonical.endswith(f".{asm_host}"):
                    return _ok(target, norm, assessment_scope, f"Matches authorized assessment target: {single_scope}")
                try:
                    net = ipaddress.ip_network(single_scope, strict=False)
                    if ipaddress.ip_address(norm["ip"]) in net:
                        return _ok(target, norm, assessment_scope, f"IP {norm['ip']} is in authorized assessment network {single_scope}")
                except ValueError:
                    pass

        # 3. Global subnet allowlist (if configured)
        try:
            ip_obj = ipaddress.ip_address(norm["ip"])
            for net in self._global_networks:
                if ip_obj in net:
                    return _ok(target, norm, assessment_scope, f"IP {norm['ip']} is in global authorized subnet {net}")
        except ValueError:
            pass

        # 4. Optional domain pattern match (.lab, .internal, .local)
        if re.match(r".*\.(lab|internal|local)$|^localhost$", canonical, re.IGNORECASE):
            return _ok(target, norm, assessment_scope, f"Domain '{canonical}' matches authorized internal pattern")

        reason = (
            f"Target '{canonical}' (IP: {norm['ip']}) has not been confirmed for this assessment. "
            f"Please confirm authorization to proceed with security testing."
        )

        return {
            "decision": ScopeDecision.BLOCKED_SCOPE,
            "reason": reason,
            "canonical_target": canonical,
            "normalized": norm,
            "assessment_scope": assessment_scope,
        }

    def validate_target(self, target: str, assessment_scope: Optional[str] = None) -> bool:
        """
        Legacy compatibility method — raises TargetValidationError if blocked.
        Used by old code paths that expect an exception-based API.
        """
        result = self.check(target, assessment_scope)
        if result["decision"] != ScopeDecision.AUTHORIZED:
            raise TargetValidationError(result["reason"])
        return True

    def is_authorized(self, target: str, assessment_scope: Optional[str] = None) -> bool:
        """Non-raising convenience method."""
        return self.check(target, assessment_scope)["decision"] == ScopeDecision.AUTHORIZED


def _ok(target: str, norm: Dict[str, Any], assessment_scope: Optional[str], reason: str) -> Dict[str, Any]:
    return {
        "decision": ScopeDecision.AUTHORIZED,
        "reason": reason,
        "canonical_target": norm["hostname"],
        "normalized": norm,
        "assessment_scope": assessment_scope,
    }


scope_validator = TargetScopeValidator()
