import json
import asyncio
import datetime
import re
import socket
from typing import Tuple, List, Dict, Any, Optional
from fastapi import APIRouter
from fastapi.responses import StreamingResponse
from backend.schemas.cyber import ChatRequestSchema
from backend.tools.registry import tool_registry
from backend.security.scope import scope_validator, ScopeDecision
from backend.services.store import store
from backend.utils.target_normalizer import target_normalizer
from backend.graph.nodes import research_node, vulnerability_node, critic_node, risk_node, report_node

router = APIRouter(prefix="/api/chat", tags=["chat"])

def parse_target_from_user_request(message: str) -> Tuple[Optional[str], Optional[str]]:
    """
    Extract user-specified target string and resolve actual IP/host.
    Returns (None, None) if no explicit target URL, IP, or domain is present.
    """
    url_match = re.search(r"https?://[^\s/]+", message, re.IGNORECASE)
    if url_match:
        user_target = url_match.group(0)
        domain = user_target.split("://")[1].split(":")[0]
        try:
            resolved_ip = socket.gethostbyname(domain)
        except Exception:
            resolved_ip = "127.0.0.1"
        return user_target, resolved_ip

    ip_match = re.search(r"\b(?:\d{1,3}\.){3}\d{1,3}\b", message)
    if ip_match:
        ip_str = ip_match.group(0)
        return ip_str, ip_str

    domain_match = re.search(r"\b([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}\b", message)
    if domain_match:
        domain_str = domain_match.group(0)
        try:
            resolved_ip = socket.gethostbyname(domain_str)
        except Exception:
            resolved_ip = "127.0.0.1"
        return domain_str, resolved_ip

    return None, None

def send_sse(evt_obj: dict) -> str:
    return f"data: {json.dumps(evt_obj)}\n\n"

@router.post("")
async def chat_endpoint(request: ChatRequestSchema):
    async def event_generator():
        conv_id = request.conversation_id or f"conv_{int(datetime.datetime.now().timestamp())}"
        asm_id = request.assessment_id or f"asm_{int(datetime.datetime.now().timestamp())}"

        extracted_target, resolved_ip = parse_target_from_user_request(request.message)

        # Step 1: message_start
        yield send_sse({'event': 'message_start', 'conversation_id': conv_id, 'assessment_id': asm_id})
        await asyncio.sleep(0.05)

        # Retrieve or initialize assessment record
        asm_record = store.get_assessment(asm_id)
        if not asm_record:
            asm_record = store.create_assessment(target=None, assessment_id=asm_id)
            asm_id = asm_record.id

        print(f"[GRAPH] LANGGRAPH CHAT ENTRYPOINT conv_id={conv_id} asm_id={asm_id} message='{request.message[:40]}...'")

        msg_lower = request.message.lower()

        # Check for explicit user confirmation or authorized request keywords in message
        user_confirmed_in_msg = any(phrase in msg_lower for phrase in [
            "yes", "i am authorized", "confirm", "authorized", "i'm authorized", "proceed",
            "perform scanning", "run security check", "scan my", "target.lab"
        ])

        # Active target resolution
        active_target = extracted_target or asm_record.target or (asm_record.targets[0] if asm_record.targets else None)

        # Loopback targets are always auto-authorized
        is_loopback = active_target in ["127.0.0.1", "localhost", "http://127.0.0.1", "http://localhost"] or (extracted_target and "127.0.0.1" in extracted_target)

        if extracted_target and (user_confirmed_in_msg or is_loopback or asm_record.authorization_status == "confirmed"):
            # Update assessment record with confirmed target
            from backend.utils.target_normalizer import target_normalizer
            norm = target_normalizer.normalize(extracted_target)
            canonical = norm["hostname"]

            asm_record.target = canonical
            asm_record.targetIp = norm["ip"]
            asm_record.targets = [canonical]
            asm_record.scope = canonical
            asm_record.status = "in_progress"
            asm_record.authorization_status = "confirmed"
            asm_record.authorization_confirmed_at = datetime.datetime.utcnow().isoformat() + "Z"
            asm_record.authorization_method = "user_confirmation"
            active_target = canonical
            resolved_ip = norm["ip"]

        elif (user_confirmed_in_msg or is_loopback) and active_target:
            from backend.utils.target_normalizer import target_normalizer
            norm = target_normalizer.normalize(active_target)
            canonical = norm["hostname"]

            asm_record.target = canonical
            asm_record.targetIp = norm["ip"]
            asm_record.targets = [canonical]
            asm_record.scope = canonical
            asm_record.status = "in_progress"
            asm_record.authorization_status = "confirmed"
            asm_record.authorization_confirmed_at = datetime.datetime.utcnow().isoformat() + "Z"
            asm_record.authorization_method = "user_confirmation"
            active_target = canonical
            resolved_ip = norm["ip"]

        # Case A: No target provided anywhere yet
        if not active_target:
            prompt_msg = (
                "Sure! What target URL or IP address would you like CyberAgents to assess, "
                "and are you authorized to perform security testing against it?"
            )
            yield send_sse({'event': 'message_delta', 'delta': prompt_msg})
            yield send_sse({
                'event': 'target_requested',
                'conversation_id': conv_id,
                'assessment_id': asm_id,
                'timestamp': datetime.datetime.now().strftime('%H:%M:%S')
            })
            yield send_sse({
                'event': 'message_complete',
                'id': f"msg_{int(datetime.datetime.now().timestamp() * 1000)}",
                'role': 'assistant',
                'content': prompt_msg,
                'timestamp': datetime.datetime.now().strftime('%H:%M')
            })
            return

        # Case B: Target provided but authorization is unconfirmed
        if asm_record.authorization_status != "confirmed":
            # Save unconfirmed target on assessment draft
            from backend.utils.target_normalizer import target_normalizer
            norm = target_normalizer.normalize(active_target)
            asm_record.target = norm["hostname"]
            asm_record.targetIp = norm["ip"]
            asm_record.status = "unconfirmed"

            confirm_prompt = (
                f"### Target Identified\n\n"
                f"**Target**: `{active_target}` (Resolved IP: `{norm['ip']}`)\n\n"
                f"Before I execute active security tools, please confirm that you are explicitly authorized to perform security testing against this target."
            )
            yield send_sse({'event': 'message_delta', 'delta': confirm_prompt})
            yield send_sse({
                'event': 'authorization_requested',
                'target': active_target,
                'canonical_target': norm["hostname"],
                'target_ip': norm["ip"],
                'assessment_id': asm_id,
                'timestamp': datetime.datetime.now().strftime('%H:%M:%S')
            })
            yield send_sse({
                'event': 'message_complete',
                'id': f"msg_{int(datetime.datetime.now().timestamp() * 1000)}",
                'role': 'assistant',
                'content': confirm_prompt,
                'timestamp': datetime.datetime.now().strftime('%H:%M')
            })
            return

        # Case C: Target provided & authorization is confirmed — proceed with dynamic execution loop!
        user_target = active_target
        if not resolved_ip or resolved_ip == "127.0.0.1":
            from backend.utils.target_normalizer import target_normalizer
            resolved_ip = target_normalizer.normalize(user_target)["ip"]

        # Autonomous agent takes over: it chooses its own tools and order.
        from backend.agents.autonomous import run_autonomous

        yield send_sse({'event': 'message_delta', 'delta': f'Authorized. Launching autonomous assessment of `{user_target}` (`{resolved_ip}`). The agent decides its own tools.\n\n'})
        yield send_sse({'event': 'supervisor_decision', 'agent': 'supervisor', 'decision': 'Autonomous run authorized', 'reason': f'Target {user_target} confirmed in scope. Handing control to the agent.', 'next_step': 'Agent', 'timestamp': datetime.datetime.now().strftime('%H:%M:%S')})

        real_findings: List[Dict[str, Any]] = []
        summary: Optional[Dict[str, Any]] = None
        for ev in run_autonomous(user_target, resolved_ip):
            if ev.get('event') == 'finding_created':
                real_findings.append(ev['finding'])
                yield send_sse(ev)
            elif ev.get('event') == 'run_summary':
                summary = ev
            else:
                yield send_sse(ev)
            await asyncio.sleep(0)

        final_content = (summary or {}).get('final_text') or f'Assessment of {user_target} complete.'
        report = (summary or {}).get('report')
        risk = (summary or {}).get('risk', 0.0)

        words = final_content.split(' ')
        for i in range(0, len(words), 8):
            yield send_sse({'event': 'message_delta', 'delta': ' '.join(words[i:i+8]) + ' '})
            await asyncio.sleep(0.01)

        complete_payload = {
            'event': 'message_complete',
            'id': f"msg_{int(datetime.datetime.now().timestamp() * 1000)}",
            'role': 'assistant',
            'content': final_content,
            'timestamp': datetime.datetime.now().strftime('%H:%M'),
            'findings': real_findings,
            'report': report,
            'riskScore': risk,
            'references': []
        }
        yield send_sse(complete_payload)

    return StreamingResponse(event_generator(), media_type="text/event-stream")
