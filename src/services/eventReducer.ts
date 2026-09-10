import { AgentActivity, AgentStep, ToolExecutionCardState, EvidenceArtifact, CriticResult, PlanStepItem, SupervisorDelegation, SupervisorInterpretation } from '../types/cyber';

export function createEmptyActivity(id: string = `act-${Date.now()}`): AgentActivity {
  return {
    id,
    title: 'Agent Activity & Execution Trace',
    isExpanded: true,
    steps: [],
    planSteps: [],
    delegations: [],
    toolExecutions: [],
    evidenceArtifacts: []
  };
}

export function reduceSSEEvent(activity: AgentActivity, event: any): AgentActivity {
  const next = { ...activity };
  next.steps = [...(next.steps || [])];
  next.planSteps = [...(next.planSteps || [])];
  next.delegations = [...(next.delegations || [])];
  next.decisions = [...(next.decisions || [])];
  next.toolExecutions = [...(next.toolExecutions || [])];
  next.evidenceArtifacts = [...(next.evidenceArtifacts || [])];

  switch (event.event) {
    case 'supervisor_interpreted':
      next.supervisorInterpretation = {
        requestClassified: event.request_classified,
        target: event.target,
        scope: event.scope,
        summary: event.summary
      };
      break;

    case 'plan_created':
      next.planSteps = event.steps.map((s: any) => ({
        id: s.id,
        title: s.title,
        assigned_agent: s.assigned_agent,
        status: s.status || 'pending',
        detail: s.detail
      }));
      break;

    case 'plan_step_updated':
      if (event.step_id) {
        const pIdx = next.planSteps.findIndex(p => p.id === event.step_id);
        if (pIdx !== -1) {
          next.planSteps[pIdx] = {
            ...next.planSteps[pIdx],
            status: event.status,
            detail: event.detail || next.planSteps[pIdx].detail
          };
        }
      }
      break;

    case 'agent_assigned':
      next.delegations.push({
        fromAgent: event.from_agent,
        toAgent: event.to_agent,
        task: event.task,
        priority: event.priority || 'High',
        status: 'assigned'
      });
      break;

    case 'supervisor_decision':
      next.decisions.push({
        agent: event.agent || 'supervisor',
        decision: event.decision,
        reason: event.reason,
        nextStep: event.next_step,
        timestamp: event.timestamp || new Date().toLocaleTimeString()
      });
      break;

    case 'agent_explanation':
      if (event.agent && event.explanation) {
        const stepIdx = next.steps.findIndex(s => s.agentType === event.agent);
        if (stepIdx !== -1) {
          next.steps[stepIdx] = {
            ...next.steps[stepIdx],
            explanation: event.explanation
          };
        }
      }
      break;

    case 'tool_queued':
    case 'tool_started':
      const existingTIdx = next.toolExecutions.findIndex(t => t.id === event.tool_id);
      if (existingTIdx !== -1) {
        next.toolExecutions[existingTIdx] = {
          ...next.toolExecutions[existingTIdx],
          status: event.event === 'tool_queued' ? 'queued' : 'running',
          profile: event.profile || next.toolExecutions[existingTIdx].profile,
          target: event.target || next.toolExecutions[existingTIdx].target
        };
      } else {
        next.toolExecutions.push({
          id: event.tool_id || `t-${Date.now()}`,
          agent: event.agent,
          toolName: event.tool,
          profile: event.profile,
          target: event.target,
          status: event.event === 'tool_queued' ? 'queued' : 'running',
          input: event.input || {},
          timestamp: event.timestamp || new Date().toLocaleTimeString()
        });
      }
      break;

    case 'tool_completed':
      const idx = next.toolExecutions.findIndex(t => t.id === event.tool_id || (t.toolName === event.tool && (t.status === 'running' || t.status === 'queued')));
      if (idx !== -1) {
        next.toolExecutions[idx] = {
          ...next.toolExecutions[idx],
          status: event.status === 'success' || event.status === 'completed' ? 'success' : 'error',
          output: event.output,
          stdoutRaw: event.stdout,
          stderrRaw: event.stderr,
          exitCode: event.exit_code,
          duration: event.duration || '0.4s'
        };
      } else {
        next.toolExecutions.push({
          id: event.tool_id || `t-${Date.now()}`,
          agent: event.agent,
          toolName: event.tool,
          profile: event.profile,
          target: event.target,
          status: event.status === 'success' || event.status === 'completed' ? 'success' : 'error',
          input: event.input || {},
          output: event.output,
          stdoutRaw: event.stdout,
          stderrRaw: event.stderr,
          exitCode: event.exit_code,
          duration: event.duration || '0.4s',
          timestamp: new Date().toLocaleTimeString()
        });
      }
      break;

    case 'evidence_created':
      if (event.evidence) {
        next.evidenceArtifacts.push({
          id: event.evidence.id,
          sourceAgent: event.evidence.source_agent,
          toolName: event.evidence.tool_name,
          capturedAt: event.evidence.captured_at,
          confidence: event.evidence.confidence,
          summary: event.evidence.summary,
          hash: event.evidence.hash
        });
      }
      break;

    case 'critic_result':
      next.criticResult = {
        agent: event.agent || 'critic',
        status: event.status || 'VALIDATED',
        confidence: event.confidence || 0.95,
        summary: event.summary,
        decision: event.decision || 'Proceed'
      };
      break;

    case 'agent_step':
      if (event.step) {
        const stepIdx = next.steps.findIndex(s => s.id === event.step.id);
        if (stepIdx !== -1) {
          next.steps[stepIdx] = { ...next.steps[stepIdx], ...event.step };
        } else {
          next.steps.push(event.step);
        }
      }
      break;

    default:
      break;
  }

  return next;
}
