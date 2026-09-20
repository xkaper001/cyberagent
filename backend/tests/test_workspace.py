import pytest
import json
from fastapi.testclient import TestClient
from backend.main import app
from backend.workspace.workspace_manager import workspace_manager

client = TestClient(app)

def test_workspace_manager_lifecycle():
    asm_id = "test_asm_lifecycle_101"
    ws = workspace_manager.get_or_create_workspace(asm_id)
    assert ws.assessment_id == asm_id
    assert ws.root_path.exists()
    assert (ws.root_path / "files").exists()

    info = workspace_manager.get_workspace_info(asm_id)
    assert info["assessment_id"] == asm_id
    assert info["status"] == "running"
    assert "nmap" in info["installed_packages"]

def test_workspace_file_operations():
    asm_id = "test_asm_files_102"
    ws = workspace_manager.get_or_create_workspace(asm_id)

    # Write file
    write_res = ws.write_file("files/test_evidence.txt", "CVE-2026-9999 found")
    assert write_res["status"] == "created"

    # Read file
    content = ws.read_file("files/test_evidence.txt")
    assert content == "CVE-2026-9999 found"

    # List files
    files = ws.list_files("files")
    assert len(files) >= 1
    assert files[0]["name"] == "test_evidence.txt"

@pytest.mark.needs_worker
def test_workspace_command_execution():
    asm_id = "test_asm_exec_103"
    ws = workspace_manager.get_or_create_workspace(asm_id)

    res = ws.execute_command("echo 'Hello CyberAgents Workspace'", actor="agent")
    assert res["status"] == "completed"
    assert res["exit_code"] == 0
    assert "Hello CyberAgents Workspace" in res["stdout"]

def test_workspace_package_allowlist():
    asm_id = "test_asm_pkg_104"
    ws = workspace_manager.get_or_create_workspace(asm_id)

    # Approved package
    res_ok = ws.install_package("ncat")
    assert res_ok["status"] == "installed"
    assert "ncat" in res_ok["installed_packages"]

    # Forbidden package
    res_bad = ws.install_package("unauthorized_rootkit")
    assert res_bad["status"] == "rejected"
    assert "allowlist" in res_bad["error"]

@pytest.mark.live_llm
def test_workspace_api_endpoints():
    asm_id = "test_asm_api_105"

    # 1. Info endpoint
    res_info = client.get(f"/api/workspace/{asm_id}/info")
    assert res_info.status_code == 200
    assert res_info.json()["assessment_id"] == asm_id

    # 2. File write API
    res_write = client.post(
        f"/api/workspace/{asm_id}/files/content",
        json={"path": "scripts/poc.py", "content": "print('exploit proof')"}
    )
    assert res_write.status_code == 200

    # 3. File read API
    res_read = client.get(f"/api/workspace/{asm_id}/files/content?path=scripts/poc.py")
    assert res_read.status_code == 200
    assert res_read.json()["content"] == "print('exploit proof')"

    # 4. Command execution API
    res_cmd = client.post(
        f"/api/workspace/{asm_id}/command",
        json={"command": "python scripts/poc.py", "actor": "human"}
    )
    assert res_cmd.status_code == 200
    assert "exploit proof" in res_cmd.json()["stdout"]
