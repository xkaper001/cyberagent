import React from 'react';
import { ListOrdered, CheckCircle2, Circle, Loader2, AlertTriangle, ShieldX } from 'lucide-react';
import { PlanStepItem } from '../../types/cyber';

interface PlannerVisualizationCardProps {
  steps: PlanStepItem[];
}

export const PlannerVisualizationCard: React.FC<PlannerVisualizationCardProps> = ({ steps }) => {
  return (
    <div className="rounded-xl border border-cyber-border bg-cyber-card/60 p-3.5 space-y-2.5 text-xs">
      <div className="flex items-center justify-between text-cyber-accent font-semibold text-[11px] uppercase tracking-wider">
        <div className="flex items-center gap-2">
          <ListOrdered className="w-4 h-4" />
          <span>Structured Assessment Plan ({steps.length} Stages)</span>
        </div>
        <span className="text-[10px] text-cyber-muted font-mono lowercase">
          {steps.filter(s => s.status === 'completed').length}/{steps.length} completed
        </span>
      </div>

      <div className="space-y-1.5 font-mono text-[11px]">
        {steps.map((step, idx) => (
          <div key={step.id || idx} className={`flex flex-col gap-1 p-2 rounded border transition-colors ${
            step.status === 'completed' ? 'bg-cyber-surface/70 border-emerald-500/30' :
            step.status === 'running' ? 'bg-cyan-500/10 border-cyan-500/40 animate-pulse' :
            step.status === 'failed' ? 'bg-rose-500/10 border-rose-500/40' :
            step.status === 'blocked' ? 'bg-amber-500/10 border-amber-500/40' :
            'bg-cyber-surface/40 border-cyber-border/60'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {step.status === 'completed' ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : step.status === 'running' ? (
                  <Loader2 className="w-3.5 h-3.5 text-cyan-400 animate-spin shrink-0" />
                ) : step.status === 'failed' ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                ) : step.status === 'blocked' ? (
                  <ShieldX className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                ) : (
                  <Circle className="w-3.5 h-3.5 text-cyber-subtle shrink-0" />
                )}
                <span className={`font-semibold ${
                  step.status === 'completed' ? 'text-slate-200' :
                  step.status === 'running' ? 'text-cyan-300' : 'text-slate-300'
                }`}>
                  {idx + 1}. {step.title}
                </span>
              </div>
              <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${
                step.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                step.status === 'running' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                'bg-cyber-bg text-cyber-muted border-cyber-border/40'
              }`}>
                {step.assigned_agent}
              </span>
            </div>
            {step.detail && (
              <p className="text-[10.5px] text-cyber-muted pl-6 italic">{step.detail}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
