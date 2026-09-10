from backend.graph.state import SecurityState

def route_after_critic(state: SecurityState) -> str:
    """Conditional routing function evaluating Critic Agent validation result."""
    # Check if any errors or if critic rejected findings
    if len(state.get("findings", [])) == 0 and len(state.get("evidence", [])) < 2:
        return "planner"
    return "risk"
