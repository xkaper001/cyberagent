import React from 'react';
import { Scale, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';
import { CriticResult } from '../../types/cyber';

interface CriticValidationCardProps {
  critic: CriticResult;
}

export const CriticValidationCard: React.FC<CriticValidationCardProps> = ({ critic }) => {
  return (
    <div className="rounded-xl border border-purple-500/40 bg-purple-500/5 p-3.5 space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-purple-400 font-semibold text-[11px] uppercase tracking-wider">
          <Scale className="w-4 h-4" />
          <span>CRITIC AGENT EVIDENCE VALIDATION</span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">
          {(critic.confidence * 100).toFixed(0)}% RIGOR CONFIDENCE
        </span>
      </div>

      <p className="text-slate-200 text-[11.5px] leading-relaxed">{critic.summary}</p>

      <div className="pt-1.5 border-t border-purple-500/20 flex items-center justify-between text-[10.5px] font-mono text-purple-300">
        <span>Decision: {critic.decision}</span>
        <div className="flex items-center gap-1 text-emerald-400">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{critic.status}</span>
        </div>
      </div>
    </div>
  );
};
