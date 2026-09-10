import React, { useState } from 'react';
import { Shield, CheckCircle2, Clock, AlertTriangle, ChevronDown, ChevronUp, Terminal, FileText } from 'lucide-react';
import { AgentStep } from '../../types/cyber';

interface AgentExecutionCardProps {
  step: AgentStep;
  toolsUsed?: string[];
  evidenceCount?: number;
}

export const AgentExecutionCard: React.FC<AgentExecutionCardProps> = ({ step, toolsUsed = [], evidenceCount = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400';
      case 'running': return 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400 animate-pulse';
      case 'failed': return 'border-rose-500/40 bg-rose-500/10 text-rose-400';
      default: return 'border-amber-500/40 bg-amber-500/10 text-amber-400';
    }
  };

  return (
    <div className="rounded-xl border border-cyber-border/80 bg-cyber-card/80 backdrop-blur-sm overflow-hidden text-xs transition-all hover:border-cyber-accent/40">
      <div className="p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-cyber-surface border border-cyber-border flex items-center justify-center text-cyber-accent shrink-0 font-mono text-[10px] font-bold">
            {step.agentType.substring(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100">{step.agentName}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-semibold uppercase ${getStatusColor(step.status)}`}>
                {step.status}
              </span>
            </div>
            <p className="text-[11px] text-cyber-muted truncate mt-0.5">{step.summary}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-cyber-muted text-[11px]">
          {step.duration && (
            <span className="flex items-center gap-1 font-mono text-[10px]">
              <Clock className="w-3 h-3 text-cyber-accent" />
              {step.duration}
            </span>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 rounded hover:bg-cyber-surface text-cyber-subtle hover:text-slate-200 transition-colors"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="px-3 pb-3 pt-1 border-t border-cyber-border/60 bg-cyber-bg/50 space-y-2 text-[11px]">
          {step.details && (
            <div>
              <span className="text-cyber-subtle uppercase text-[10px] font-semibold tracking-wider">Details</span>
              <p className="text-slate-300 font-mono mt-0.5">{step.details}</p>
            </div>
          )}

          {toolsUsed.length > 0 && (
            <div>
              <span className="text-cyber-subtle uppercase text-[10px] font-semibold tracking-wider">Tools Executed</span>
              <div className="flex flex-wrap gap-1.5 mt-1">
                {toolsUsed.map((tool, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded bg-cyber-surface border border-cyber-border text-slate-200 font-mono text-[10px] flex items-center gap-1">
                    <Terminal className="w-3 h-3 text-cyber-accent" />
                    {tool}
                  </span>
                ))}
              </div>
            </div>
          )}

          {evidenceCount > 0 && (
            <div className="flex items-center gap-1.5 text-cyber-accent font-mono text-[10px]">
              <FileText className="w-3 h-3" />
              <span>{evidenceCount} Evidence Artifacts Generated</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
