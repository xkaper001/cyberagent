import React, { useState } from 'react';
import { 
  ChevronDown, 
  ChevronUp, 
  Bot, 
  Shield, 
  Terminal, 
  FileCheck, 
  Scale, 
  ListOrdered 
} from 'lucide-react';
import { AgentActivity } from '../../types/cyber';
import { AgentExecutionCard } from './AgentExecutionCard';
import { ToolExecutionCard } from './ToolExecutionCard';
import { SupervisorDelegationCard } from './SupervisorDelegationCard';
import { PlannerVisualizationCard } from './PlannerVisualizationCard';
import { EvidenceCard } from './EvidenceCard';
import { CriticValidationCard } from './CriticValidationCard';

interface AgentActivityTimelineProps {
  activity: AgentActivity;
}

export const AgentActivityTimeline: React.FC<AgentActivityTimelineProps> = ({ activity }) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(activity.isExpanded ?? true);

  const completedCount = activity.steps.filter(s => s.status === 'completed').length;
  const toolCount = activity.toolExecutions?.length || 0;
  const evidenceCount = activity.evidenceArtifacts?.length || 0;

  return (
    <div className="my-3 border border-cyber-border/80 bg-cyber-card/90 rounded-xl overflow-hidden shadow-cyber text-xs select-none">
      {/* Accordion Bar Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2.5 bg-cyber-surface/60 hover:bg-cyber-surface/90 flex items-center justify-between transition-colors border-b border-cyber-border/50 text-slate-200"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-5.5 h-5.5 rounded-lg bg-cyber-accent/15 border border-cyber-accent/40 flex items-center justify-center text-cyber-accent shadow-glow-accent">
            <Bot className="w-3.5 h-3.5" />
          </div>
          <span className="font-semibold text-slate-100 text-xs tracking-wide">{activity.title}</span>
          
          <div className="flex items-center gap-1.5 text-[10px] text-cyber-muted font-mono">
            <span className="bg-cyber-bg px-2 py-0.5 rounded border border-cyber-border/60">
              {completedCount} / {activity.steps.length} Steps
            </span>
            {toolCount > 0 && (
              <span className="bg-cyber-bg px-2 py-0.5 rounded border border-cyber-border/60 text-cyber-accent">
                {toolCount} Tools
              </span>
            )}
            {evidenceCount > 0 && (
              <span className="bg-cyber-bg px-2 py-0.5 rounded border border-cyber-border/60 text-emerald-400">
                {evidenceCount} Evidence
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 text-cyber-muted text-[11px]">
          <span className="font-mono">{isExpanded ? 'Hide Trace' : 'View Agent Work ↓'}</span>
          {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Expanded Timeline Execution Trace */}
      {isExpanded && (
        <div className="p-4 space-y-3.5 bg-cyber-bg/70 backdrop-blur-md">
          {/* 1. Supervisor Request Breakdown Card */}
          {activity.supervisorInterpretation && (
            <div className="rounded-xl border border-cyber-accent/30 bg-cyber-accent/5 p-3.5 text-xs space-y-1.5">
              <div className="flex items-center gap-2 text-cyber-accent font-semibold text-[11px] uppercase tracking-wider">
                <Shield className="w-4 h-4" />
                <span>SUPERVISOR REQUEST ANALYSIS</span>
              </div>
              <div className="text-slate-200 font-mono text-[11.5px] leading-relaxed">
                <div><strong>Classification:</strong> {activity.supervisorInterpretation.requestClassified}</div>
                <div><strong>Target:</strong> {activity.supervisorInterpretation.target}</div>
                <div><strong>Scope:</strong> {activity.supervisorInterpretation.scope}</div>
              </div>
              <p className="text-[11px] text-cyber-muted italic">{activity.supervisorInterpretation.summary}</p>
            </div>
          )}

          {/* 2. Planner Stage Plan */}
          {activity.planSteps && activity.planSteps.length > 0 && (
            <PlannerVisualizationCard steps={activity.planSteps} />
          )}

          {/* 3. Supervisor Decisions */}
          {activity.decisions && activity.decisions.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-cyber-subtle tracking-wider flex items-center gap-1.5 text-cyber-accent">
                <Scale className="w-3.5 h-3.5" />
                <span>Supervisor Decisions ({activity.decisions.length})</span>
              </div>
              <div className="space-y-2">
                {activity.decisions.map((dec, idx) => (
                  <div key={idx} className="p-3 rounded-xl border border-cyber-accent/30 bg-cyber-accent/5 space-y-1 font-mono text-[11px]">
                    <div className="flex items-center justify-between text-cyber-accent font-bold">
                      <span>Decision: {dec.decision}</span>
                      <span className="text-[10px] text-cyber-muted font-normal">{dec.timestamp}</span>
                    </div>
                    <div className="text-slate-200"><strong>Reason:</strong> {dec.reason}</div>
                    <div className="text-cyber-accent"><strong>Next:</strong> {dec.nextStep}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 4. Supervisor Delegations */}
          {activity.delegations && activity.delegations.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-cyber-subtle tracking-wider">Supervisor Task Delegations</div>
              {activity.delegations.map((del, idx) => (
                <SupervisorDelegationCard key={idx} delegation={del} />
              ))}
            </div>
          )}

          {/* 4. Agent Execution Cards */}
          {activity.steps.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-cyber-subtle tracking-wider">Agent Execution Steps</div>
              <div className="space-y-2">
                {activity.steps.map((step) => (
                  <AgentExecutionCard 
                    key={step.id} 
                    step={step} 
                    toolsUsed={activity.toolExecutions?.filter(t => t.agent === step.agentType).map(t => t.toolName)}
                    evidenceCount={activity.evidenceArtifacts?.filter(e => e.sourceAgent.toLowerCase().includes(step.agentType)).length}
                  />
                ))}
              </div>
            </div>
          )}

          {/* 5. Tool Executions */}
          {activity.toolExecutions && activity.toolExecutions.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-cyber-subtle tracking-wider flex items-center gap-1.5 text-slate-200">
                <Terminal className="w-3.5 h-3.5 text-cyber-accent" />
                <span>Real Backend Tool Executions ({activity.toolExecutions.length})</span>
              </div>
              <div className="space-y-2">
                {activity.toolExecutions.map((tool) => (
                  <ToolExecutionCard key={tool.id} tool={tool} />
                ))}
              </div>
            </div>
          )}

          {/* 6. Evidence Artifacts */}
          {activity.evidenceArtifacts && activity.evidenceArtifacts.length > 0 && (
            <div className="space-y-2">
              <div className="text-[10px] uppercase font-bold text-cyber-subtle tracking-wider flex items-center gap-1.5 text-emerald-400">
                <FileCheck className="w-3.5 h-3.5" />
                <span>Captured Evidence Artifacts ({activity.evidenceArtifacts.length})</span>
              </div>
              <div className="space-y-2">
                {activity.evidenceArtifacts.map((ev) => (
                  <EvidenceCard key={ev.id} evidence={ev} />
                ))}
              </div>
            </div>
          )}

          {/* 7. Critic Validation */}
          {activity.criticResult && (
            <CriticValidationCard critic={activity.criticResult} />
          )}
        </div>
      )}
    </div>
  );
};
