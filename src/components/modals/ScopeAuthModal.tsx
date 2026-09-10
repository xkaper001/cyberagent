import React, { useState } from 'react';
import { ShieldCheck, AlertTriangle, X, Lock, CheckSquare, Square } from 'lucide-react';
import { useCyber } from '../../context/CyberContext';

export const ScopeAuthModal: React.FC = () => {
  const { isScopeModalOpen, setIsScopeModalOpen, startNewAssessment } = useCyber();

  const [target, setTarget] = useState('10.10.14.5 / lab-web.internal');
  const [environment, setEnvironment] = useState<'Lab' | 'Internal' | 'Authorized Cloud'>('Lab');
  const [scopeNotes, setScopeNotes] = useState('Full HTTP, HTTPS, Spring Actuator, SSH, and DB passive service enumeration & vuln correlation.');
  const [confirmed, setConfirmed] = useState(false);

  if (!isScopeModalOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmed || !target.trim()) return;
    startNewAssessment(target, environment, scopeNotes);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="w-full max-w-lg bg-cyber-card border border-cyber-border rounded-xl shadow-cyber overflow-hidden animate-in fade-in zoom-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyber-border bg-cyber-surface/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 tracking-wide">AUTHORIZED SECURITY ASSESSMENT</h2>
              <p className="text-[11px] text-cyber-muted font-mono">Scope Authorization & Safety Policy Verification</p>
            </div>
          </div>
          <button 
            onClick={() => setIsScopeModalOpen(false)}
            className="text-cyber-muted hover:text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {/* Target Host */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-200 text-xs">
              Target IP / Domain / Subnet Scope
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                placeholder="e.g. 10.10.14.5 or lab.internal.corp"
                className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyber-accent"
              />
              <Lock className="w-3.5 h-3.5 text-cyber-muted absolute right-3 top-2.5" />
            </div>
          </div>

          {/* Environment */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-200 text-xs">
              Assessment Target Environment
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Lab', 'Internal', 'Authorized Cloud'] as const).map((env) => (
                <button
                  type="button"
                  key={env}
                  onClick={() => setEnvironment(env)}
                  className={`py-2 px-3 rounded-lg font-medium border text-center transition-all ${
                    environment === env
                      ? 'bg-cyber-accent/20 border-cyber-accent text-slate-100 font-bold'
                      : 'bg-cyber-bg border-cyber-border text-cyber-muted hover:text-slate-200'
                  }`}
                >
                  {env}
                </button>
              ))}
            </div>
          </div>

          {/* Scope Parameters */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-200 text-xs">
              Scope Definition & Exclusions
            </label>
            <textarea
              rows={2}
              value={scopeNotes}
              onChange={(e) => setScopeNotes(e.target.value)}
              className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-slate-200 font-mono text-[11px] focus:outline-none focus:border-cyber-accent"
            />
          </div>

          {/* Policy Confirmation Checkbox */}
          <div 
            onClick={() => setConfirmed(!confirmed)}
            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start gap-3 select-none ${
              confirmed 
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300'
                : 'bg-cyber-surface border-cyber-border text-cyber-muted hover:border-cyber-border-light'
            }`}
          >
            <div className="mt-0.5 shrink-0 text-emerald-400">
              {confirmed ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4 text-cyber-muted" />}
            </div>
            <div className="text-[11px] leading-relaxed">
              <span className="font-semibold text-slate-200 block">Authorization Confirmation</span>
              I confirm that I am explicitly authorized to assess this target system, and that all automated agent activity complies with our engagement agreement.
            </div>
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-cyber-border/80">
            <button
              type="button"
              onClick={() => setIsScopeModalOpen(false)}
              className="px-4 py-2 rounded-lg bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!confirmed || !target.trim()}
              className={`px-5 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-cyber-accent to-indigo-600 shadow-glow-accent transition-all ${
                !confirmed || !target.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-95 active:scale-95'
              }`}
            >
              Start Assessment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
