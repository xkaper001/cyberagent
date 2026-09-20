import pytest
import os
import json
from backend.execution.models import ExecutionJob, ExecutionStatus
from backend.execution.worker_manager import worker_manager
from backend.security.scope import scope_validator, TargetValidationError
from backend.tools.registry import tool_registry

# 1. SCOPE VALIDATOR TESTS
def test_scope_validation_authorized():
    assert scope_validator.validate_target("10.10.14.5") is True
    assert scope_validator.validate_target("127.0.0.1") is True
    assert scope_validator.validate_target("localhost") is True

def test_scope_validation_unauthorized():
    with pytest.raises(TargetValidationError):
        scope_validator.validate_target("8.8.8.8")

# 2. TOOL REGISTRY & PROFILES TESTS
def test_tool_registry_allowlist():
    tools = tool_registry.list_tools()
    tool_names = [t.name for t in tools]
    assert "nmap" in tool_names
    assert "dns_lookup" in tool_names
    assert "http_probe" in tool_names

def test_tool_registry_invalid_profile():
    with pytest.raises(ValueError, match="not an approved safe template"):
        tool_registry.execute_tool("nmap", {"target": "10.10.14.5"}, profile="unauthorized_exploit_profile")

# 3. WORKER MANAGER & EXECUTIONS
def test_blocked_out_of_scope_execution():
    job = worker_manager.execute_job(
        agent="scanning",
        tool="nmap",
        profile="service_detection",
        target="8.8.8.8"
    )
    assert job.status == ExecutionStatus.BLOCKED
    assert job.error["code"] == "TARGET_OUT_OF_SCOPE"

@pytest.mark.needs_worker
def test_sanitized_nmap_execution():
    res = tool_registry.execute_tool(
        tool_name="nmap",
        input_data={"target": "10.10.14.5", "options": {"ports": "80,443"}},
        profile="service_detection"
    )
    assert res["status"] in ["success", "completed"]
    assert res["tool_name"] == "nmap"
    assert res["target"] == "10.10.14.5"
    assert "output" in res
