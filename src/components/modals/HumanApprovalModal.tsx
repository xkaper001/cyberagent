import React from 'react';
import { AlertCircle, ShieldAlert, Check, X, HelpCircle, Server } from 'lucide-react';
import { useCyber } from '../../context/CyberContext';

export const HumanApprovalModal: React.FC = () => {
  const { 
    isHumanApprovalOpen, 
    setIsHumanApprovalOpen, 
    humanApproval, 
    approveAction, 
    rejectAction 
  } = useCyber();

  if (!isHumanApprovalOpen || !humanApproval) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="w-full max-w-lg bg-cyber-card border border-amber-500/40 rounded-xl shadow-cyber overflow-hidden animate-in fade-in zoom-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyber-border bg-amber-500/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <AlertCircle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 tracking-wide">ACTION REQUIRES APPROVAL</h2>
              <p className="text-[11px] text-amber-400 font-mono">Human-in-the-Loop Safety Gate</p>
            </div>
          </div>
          <button 
            onClick={() => setIsHumanApprovalOpen(false)}
            className="text-cyber-muted hover:text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Main Action Banner */}
          <div className="bg-cyber-surface p-3.5 rounded-lg border border-cyber-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-cyber-subtle uppercase">AGENT REQUESTING APPROVAL</span>
              <span className="font-mono text-cyber-accent text-[11px] font-bold">{humanApproval.agentName}</span>
            </div>
            <div className="font-semibold text-slate-100 text-sm">{humanApproval.action}</div>
            <div className="flex items-center gap-2 text-cyber-muted font-mono text-[11px]">
              <Server className="w-3.5 h-3.5 text-cyber-cyan" />
              <span>Target: {humanApproval.target}</span>
            </div>
          </div>

          {/* Reason & Context */}
          <div className="space-y-3 pt-1">
            <div className="space-y-1">
              <span className="font-semibold text-slate-200 block text-xs flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-cyber-accent" />
                Why is this required?
              </span>
              <p className="text-cyber-muted leading-relaxed text-[11px] bg-cyber-bg p-2.5 rounded border border-cyber-border">
                {humanApproval.reason}
              </p>
            </div>

            <div className="space-y-1">
              <span className="font-semibold text-slate-200 block text-xs">What will happen & data collected?</span>
              <p className="text-cyber-muted leading-relaxed text-[11px] bg-cyber-bg p-2.5 rounded border border-cyber-border font-mono">
                {humanApproval.expectedOutcome}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-end gap-3 border-t border-cyber-border">
            <button
              onClick={() => rejectAction(humanApproval.id)}
              className="px-4 py-2 rounded-lg bg-cyber-surface border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 font-semibold transition-colors flex items-center gap-1.5"
            >
              <X className="w-4 h-4" />
              Reject Action
            </button>
            <button
              onClick={() => approveAction(humanApproval.id)}
              className="px-5 py-2 rounded-lg bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-bold shadow-glow-accent transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Approve & Proceed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
