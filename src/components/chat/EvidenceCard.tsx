import React from 'react';
import { FileCheck, Shield, Hash, Clock } from 'lucide-react';
import { EvidenceArtifact } from '../../types/cyber';

interface EvidenceCardProps {
  evidence: EvidenceArtifact;
}

export const EvidenceCard: React.FC<EvidenceCardProps> = ({ evidence }) => {
  return (
    <div className="rounded-xl border border-cyber-accent/30 bg-cyber-card p-3 space-y-2 text-xs font-mono">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-cyber-accent font-semibold text-[11px]">
          <FileCheck className="w-3.5 h-3.5" />
          <span>EVIDENCE ARTIFACT ({evidence.id})</span>
        </div>
        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
          {(evidence.confidence * 100).toFixed(0)}% Confidence
        </span>
      </div>

      <p className="text-slate-200 text-[11.5px] leading-relaxed font-sans">{evidence.summary}</p>

      <div className="pt-1 border-t border-cyber-border/60 flex items-center justify-between text-[10px] text-cyber-muted">
        <div className="flex items-center gap-2">
          <span>Source: {evidence.sourceAgent}</span>
          <span>•</span>
          <span>Tool: {evidence.toolName}</span>
        </div>
        <span className="text-cyber-subtle font-mono">{evidence.hash}</span>
      </div>
    </div>
  );
};
