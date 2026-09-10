import datetime
import logging
from backend.config.logging import logger

def log_security_event(
    agent_name: str,
    tool_name: str,
    action: str,
    target: str,
    authorization_status: str = "AUTHORIZED",
    result_status: str = "SUCCESS",
    duration: str = "1.0s"
):
    timestamp_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_msg = f"[AUDIT] {timestamp_str} | Agent: {agent_name:<15} | Tool: {tool_name:<15} | Target: {target:<20} | Status: {result_status}"
    logger.info(log_msg)
