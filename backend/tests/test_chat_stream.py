import pytest
import json
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

@pytest.mark.live_llm
def test_chat_stream_authorized_target():
    payload = {
        "message": "I want to perform scanning on https://target.lab",
        "conversation_id": "test-chat-conv-1"
    }

    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200

    events = []
    for line in response.iter_lines():
        if line.startswith("data: "):
            raw_data = line[6:]
            try:
                events.append(json.loads(raw_data))
            except Exception:
                pass

    event_types = [e.get("event") for e in events]

    # Verify essential SSE events exist in stream
    assert "message_start" in event_types
    assert "supervisor_interpreted" in event_types
    assert "plan_created" in event_types
    assert "tool_started" in event_types
    assert "tool_completed" in event_types
    assert "supervisor_decision" in event_types
    assert "critic_result" in event_types
    assert "message_complete" in event_types

    # Verify target preservation in supervisor analysis
    sup_event = next(e for e in events if e.get("event") == "supervisor_interpreted")
    assert sup_event["target"] in ["target.lab", "https://target.lab"]


@pytest.mark.live_llm
def test_chat_stream_events_have_real_tool_outputs():
    payload = {
        "message": "Run security check on 127.0.0.1",
        "conversation_id": "test-chat-conv-2"
    }

    response = client.post("/api/chat", json=payload)
    assert response.status_code == 200

    events = [json.loads(line[6:]) for line in response.iter_lines() if line.startswith("data: ")]
    
    tool_completed_events = [e for e in events if e.get("event") == "tool_completed"]
    assert len(tool_completed_events) >= 2

    # Check that tool execution outputs contain parsed results and exit codes
    for tool_evt in tool_completed_events:
        assert "output" in tool_evt
        assert "exit_code" in tool_evt
        assert tool_evt["status"] in ["success", "completed", "failed"]
