import json
import asyncio
import os
from typing import Dict, Any, Optional
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Query, Body
from pydantic import BaseModel

from backend.workspace.workspace_manager import workspace_manager
from backend.execution.manager import execution_manager
from backend.execution.sandbox import sandbox_runner

router = APIRouter(prefix="/api/workspace", tags=["workspace"])

class FileWriteSchema(BaseModel):
    path: str
    content: str

class CommandExecSchema(BaseModel):
    command: str
    actor: Optional[str] = "human"

class PackageInstallSchema(BaseModel):
    package: str

@router.get("/{assessment_id}/info")
async def get_workspace_info(assessment_id: str):
    return workspace_manager.get_workspace_info(assessment_id)

@router.get("/{assessment_id}/files")
async def list_workspace_files(assessment_id: str, path: str = Query("", alias="path")):
    ws = workspace_manager.get_or_create_workspace(assessment_id)
    try:
        files = ws.list_files(path)
        return {"assessment_id": assessment_id, "path": path or "/", "items": files}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{assessment_id}/files/content")
async def read_workspace_file(assessment_id: str, path: str = Query(...)):
    ws = workspace_manager.get_or_create_workspace(assessment_id)
    try:
        content = ws.read_file(path)
        return {"assessment_id": assessment_id, "path": path, "content": content}
    except Exception as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/{assessment_id}/files/content")
async def write_workspace_file(assessment_id: str, payload: FileWriteSchema):
    ws = workspace_manager.get_or_create_workspace(assessment_id)
    try:
        res = ws.write_file(payload.path, payload.content)
        return {"assessment_id": assessment_id, "result": res}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{assessment_id}/tools")
async def list_workspace_tools(assessment_id: str):
    ws = workspace_manager.get_or_create_workspace(assessment_id)
    caps = sandbox_runner.check_capabilities()
    tool_status = caps.get("capabilities", {})

    from backend.tools.package_catalog import package_catalog
    catalog = package_catalog.get_catalog()

    items = []
    for pkg_name, spec in catalog.items():
        info = tool_status.get(spec.executable, {})
        installed = info.get("installed", False)
        version = info.get("version_string", None) if installed else None

        items.append({
            "package_name": spec.package_name,
            "display_name": spec.display_name,
            "description": spec.description,
            "category": spec.category,
            "executable": spec.executable,
            "is_core": spec.is_core,
            "requires_approval": spec.requires_approval,
            "installed": installed,
            "available": True,
            "version": version,
        })
    return {
        "assessment_id": assessment_id,
        "sandbox_mode": caps.get("mode"),
        "sandbox_status": caps.get("sandbox_status"),
        "tools": items
    }

@router.post("/{assessment_id}/packages/install")
async def install_workspace_package(assessment_id: str, payload: PackageInstallSchema):
    ws = workspace_manager.get_or_create_workspace(assessment_id)
    res = await sandbox_runner.install_package(payload.package, ws.root_path)
    if res.get("status") == "rejected":
        raise HTTPException(status_code=400, detail=res.get("error"))
    elif res.get("status") == "failed":
        raise HTTPException(status_code=500, detail=res.get("error"))
    return res


@router.post("/{assessment_id}/command")
async def execute_workspace_command(assessment_id: str, payload: CommandExecSchema):
    ws = workspace_manager.get_or_create_workspace(assessment_id)
    res = ws.execute_command(payload.command, actor=payload.actor or "human")
    return res

@router.post("/{assessment_id}/reset")
async def reset_workspace(assessment_id: str):
    execution_manager.interrupt_session(assessment_id)
    ws = workspace_manager.get_or_create_workspace(assessment_id)
    sandbox_res = sandbox_runner.reset_sandbox(ws.root_path)
    ws_res = workspace_manager.reset_workspace(assessment_id)
    return {
        "status": "reset",
        "workspace_id": ws_res.workspace_id,
        "assessment_id": assessment_id,
        "sandbox": sandbox_res
    }



# WebSocket interactive streaming terminal session
@router.websocket("/{assessment_id}/terminal")
async def workspace_terminal_websocket(websocket: WebSocket, assessment_id: str):
    await websocket.accept()
    
    session = execution_manager.get_or_create_session(assessment_id)
    caps = sandbox_runner.check_capabilities()

    banner = (
        f"\r\n\x1b[1;36m┌────────────────────────────────────────────────────────┐\x1b[0m\r\n"
        f"\x1b[1;36m│ CyberAgents Isolated Shared Workspace  ● ACTIVE       │\x1b[0m\r\n"
        f"\x1b[1;36m└────────────────────────────────────────────────────────┘\x1b[0m\r\n"
        f"Assessment ID : \x1b[1;33m{assessment_id}\x1b[0m\r\n"
        f"Container     : \x1b[1;32m{caps['sandbox_container']}\x1b[0m\r\n"
        f"Execution Mode: \x1b[1;35m{caps['mode']}\x1b[0m\r\n"
        f"Workspace Path: \x1b[1;34m{session.current_workspace_display_path}\x1b[0m\r\n\r\n"
        f"{session.current_workspace_display_path} $ "
    )
    await websocket.send_text(banner)

    cmd_buffer = ""

    try:
        while True:
            data = await websocket.receive_text()
            if not data:
                continue

            # Handle JSON protocol commands
            if data.startswith("{") and data.endswith("}"):
                try:
                    evt = json.loads(data)
                    evt_type = evt.get("type")
                    if evt_type == "input":
                        data = evt.get("data", "")
                    elif evt_type == "interrupt" or evt_type == "stop":
                        execution_manager.interrupt_session(assessment_id)
                        await websocket.send_text("\r\n\x1b[31m^C [Process Interrupted]\x1b[0m\r\n")
                        await websocket.send_text(f"{session.current_workspace_display_path} $ ")
                        continue
                    elif evt_type == "resize":
                        continue
                except Exception:
                    pass

            for char in data:
                if char in ["\r", "\n"]:
                    full_cmd = cmd_buffer.strip()
                    cmd_buffer = ""
                    await websocket.send_text("\r\n")

                    if full_cmd:
                        if full_cmd == "clear":
                            await websocket.send_text("\x1b[2J\x1b[H")
                            await websocket.send_text(f"{session.current_workspace_display_path} $ ")
                            continue

                        # Live stream execution output
                        duration = 0.0
                        exit_code = 0
                        async for evt in execution_manager.execute_terminal_command(
                            command=full_cmd,
                            assessment_id=assessment_id,
                            actor="human",
                            timeout=30
                        ):
                            if evt.get("type") == "stdout":
                                out_text = evt.get("data", "").replace("\n", "\r\n")
                                await websocket.send_text(out_text)
                            elif evt.get("type") == "stderr":
                                err_text = evt.get("data", "").replace("\n", "\r\n")
                                await websocket.send_text(err_text)
                            elif evt.get("type") == "exit":
                                exit_code = evt.get("exit_code", 0)
                                duration = evt.get("duration_seconds", 0.0)
                            elif evt.get("type") == "error":
                                await websocket.send_text(f"Error: {evt.get('message', '')}\r\n")

                        exit_color = "\x1b[32m" if exit_code == 0 else "\x1b[31m"
                        await websocket.send_text(
                            f"{exit_color}[exit {exit_code} | {duration}s]\x1b[0m\r\n"
                        )
                        await websocket.send_text(f"{session.current_workspace_display_path} $ ")
                    else:
                        await websocket.send_text(f"{session.current_workspace_display_path} $ ")
                elif char in ["\x08", "\x7f"]:  # Backspace
                    if len(cmd_buffer) > 0:
                        cmd_buffer = cmd_buffer[:-1]
                        await websocket.send_text("\b \b")
                elif char == "\x03":  # Ctrl+C
                    cmd_buffer = ""
                    execution_manager.interrupt_session(assessment_id)
                    await websocket.send_text(f"^C\r\n{session.current_workspace_display_path} $ ")
                else:
                    cmd_buffer += char
                    await websocket.send_text(char)

    except WebSocketDisconnect:
        pass
    except Exception as e:
        await websocket.close()
