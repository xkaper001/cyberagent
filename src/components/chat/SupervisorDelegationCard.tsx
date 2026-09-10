import React from 'react';
import { Shield, ArrowRight, CheckCircle2 } from 'lucide-react';
import { SupervisorDelegation } from '../../types/cyber';

interface SupervisorDelegationCardProps {
  delegation: SupervisorDelegation;
}

export const SupervisorDelegationCard: React.FC<SupervisorDelegationCardProps> = ({ delegation }) => {
  return (
    <div className="rounded-xl border border-cyber-accent/30 bg-cyber-accent/5 p-3 text-xs space-y-2">
      <div className="flex items-center gap-2 text-cyber-accent font-semibold text-[11px]">
        <Shield className="w-3.5 h-3.5" />
        <span>SUPERVISOR DELEGATION</span>
      </div>

      <div className="flex items-center gap-2 text-slate-200">
        <span className="font-mono text-cyber-muted">{delegation.fromAgent}</span>
        <ArrowRight className="w-3.5 h-3.5 text-cyber-accent" />
        <span className="font-bold text-slate-100 uppercase">{delegation.toAgent} Agent</span>
      </div>

      <div className="p-2 rounded bg-cyber-surface/90 border border-cyber-border text-[11px] font-mono text-slate-300">
        <div className="text-[10px] text-cyber-subtle uppercase">Task Objective</div>
        <div>"{delegation.task}"</div>
      </div>
    </div>
  );
};
