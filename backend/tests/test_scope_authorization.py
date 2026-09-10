"""
Test Suite: CyberAgents User-Defined Target Authorization & Scope Rules
-----------------------------------------------------------------------
Verifies that:
1. New assessments default to awaiting_target and unconfirmed authorization without target.lab.
2. User-provided domains (e.g. vtop.vitbhopal.ac.in, example.com) and URLs are correctly extracted.
3. TargetScopeValidator enforces user-confirmed assessment target scope rather than hardcoded domain allowlists.
4. Active tool execution is blocked when authorization is unconfirmed.
5. Active tool execution is permitted when authorization is confirmed.
"""
import pytest
from backend.services.store import BackendStore
from backend.security.scope import TargetScopeValidator, ScopeDecision
from backend.api.routes.chat import parse_target_from_user_request

def test_new_assessment_default_state():
    store = BackendStore()
    asm = store.create_assessment(target=None)
    assert asm.target is None
    assert asm.targets == []
    assert asm.status == "awaiting_target"
    assert asm.authorization_status == "unconfirmed"
    assert asm.scope is None

def test_parse_target_from_user_request():
    target, ip = parse_target_from_user_request("Scan https://example.com for vulnerabilities")
    assert target == "https://example.com"

    target_vtop, _ = parse_target_from_user_request("Analyze target vtop.vitbhopal.ac.in")
    assert target_vtop == "vtop.vitbhopal.ac.in"

    target_none, _ = parse_target_from_user_request("do the scan part for my authorized website")
    assert target_none is None

def test_scope_validator_unconfirmed_target():
    validator = TargetScopeValidator()
    # Unconfirmed target without assessment scope
    res = validator.check("vtop.vitbhopal.ac.in", assessment_scope=None)
    assert res["decision"] == ScopeDecision.BLOCKED_SCOPE
    assert "has not been confirmed" in res["reason"]

def test_scope_validator_confirmed_assessment_target():
    validator = TargetScopeValidator()
    # Confirmed target set as assessment scope
    res = validator.check("vtop.vitbhopal.ac.in", assessment_scope="vtop.vitbhopal.ac.in")
    assert res["decision"] == ScopeDecision.AUTHORIZED
    assert "Matches authorized assessment target" in res["reason"]

def test_scope_validator_url_normalization():
    validator = TargetScopeValidator()
    res = validator.check("https://vtop.vitbhopal.ac.in/path/page", assessment_scope="vtop.vitbhopal.ac.in")
    assert res["decision"] == ScopeDecision.AUTHORIZED
    assert res["canonical_target"] == "vtop.vitbhopal.ac.in"

def test_authorization_endpoint_and_state():
    from fastapi.testclient import TestClient
    from backend.main import app
    client = TestClient(app)

    asm_id = "asm_test_auth_123"
    # Call authorization endpoint
    resp = client.post(f"/api/assessments/{asm_id}/authorization", json={"authorized": True, "target": "example.com"})
    assert resp.status_code == 200
    data = resp.json()
    assert data["assessment_id"] == asm_id
    assert data["authorization_status"] == "confirmed"
    assert data["status"] == "running"
    assert data["target"] == "example.com"

