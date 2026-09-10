import React from 'react';
import { 
  Server, 
  ShieldAlert, 
  Activity, 
  Bug, 
  Bot, 
  CheckCircle2, 
  ExternalLink,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { useCyber } from '../../context/CyberContext';

export const RightContextPanel: React.FC = () => {
  const { 
    isRightPanelOpen, 
    activeAssessment, 
    findings, 
    agents,
    setCurrentView,
    setSelectedFinding
  } = useCyber();

  if (!isRightPanelOpen) return null;

  return (
    <aside className="w-[300px] h-screen bg-cyber-sidebar border-l border-cyber-border flex flex-col shrink-0 overflow-y-auto text-xs z-10 select-none">
      {/* Panel Header */}
      <div className="h-16 px-4 border-b border-cyber-border/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyber-accent" />
          <span className="font-semibold text-slate-100 text-xs">Target Context</span>
        </div>
        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyber-accent/15 text-cyber-accent border border-cyber-accent/30 font-medium">
          LIVE
        </span>
      </div>

      <div className="p-4 space-y-5">
        {/* Target Card */}
        <div className="bg-cyber-surface/80 rounded-xl p-3.5 border border-cyber-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-cyber-subtle uppercase tracking-wider">TARGET ENVIRONMENT</span>
            <span className="w-2 h-2 rounded-full bg-cyber-emerald animate-pulse" title="Scoped & Authorized" />
          </div>

          <div className="space-y-1.5">
            <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Server className="w-4 h-4 text-cyber-cyan" />
              {activeAssessment?.target || 'Authorized Lab'}
            </div>
            <div className="font-mono text-[11px] text-cyber-muted bg-cyber-bg px-2 py-1 rounded border border-cyber-border/60 flex justify-between items-center">
              <span>{activeAssessment?.targetIp || '10.10.14.5'}</span>
              <span className="text-[9px] text-emerald-400 font-sans">Lab Scoped</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="bg-cyber-bg/60 p-2 rounded-lg border border-cyber-border/50">
              <span className="text-[10px] text-cyber-muted block">Environment</span>
              <span className="font-semibold text-slate-200 text-[11px]">{activeAssessment?.environment || 'Lab'}</span>
            </div>
            <div className="bg-cyber-bg/60 p-2 rounded-lg border border-cyber-border/50">
              <span className="text-[10px] text-cyber-muted block">Assessment</span>
              <span className="font-semibold text-slate-200 text-[11px]">Web Security</span>
            </div>
          </div>

          {/* Risk Score */}
          <div className="pt-2 border-t border-cyber-border/60 flex items-center justify-between">
            <span className="text-[11px] text-cyber-muted">Contextual Risk:</span>
            <div className="flex items-center gap-1.5 font-bold text-xs">
              <span className="text-rose-400 font-mono text-sm">{activeAssessment?.riskScore || 8.4}</span>
              <span className="text-cyber-muted text-[10px]">/ 10</span>
              <span className="px-1.5 py-0.2 rounded text-[9px] bg-rose-500/20 text-rose-300 font-mono">HIGH</span>
            </div>
          </div>
        </div>

        {/* Active Agents Summary */}
        <div className="bg-cyber-surface/80 rounded-xl p-3.5 border border-cyber-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-cyber-subtle uppercase tracking-wider">COORDINATED AGENTS</span>
            <span className="text-[11px] font-mono text-cyber-accent font-semibold">{agents.length} Available</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-slate-300">
                <Bot className="w-3.5 h-3.5 text-cyber-accent" />
                <span>Active Workers</span>
              </div>
              <span className="font-mono text-emerald-400 font-semibold">5 Executing</span>
            </div>

            {/* Micro execution status indicators */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              <div className="h-1.5 rounded bg-emerald-500" title="Planner: Completed" />
              <div className="h-1.5 rounded bg-emerald-500" title="Recon: Completed" />
              <div className="h-1.5 rounded bg-cyber-accent animate-pulse" title="Scanning: Running" />
              <div className="h-1.5 rounded bg-cyber-purple/50" title="Vulnerability: Queued" />
              <div className="h-1.5 rounded bg-cyber-border" title="Risk: Queued" />
            </div>
          </div>
        </div>

        {/* Top Discovered Findings */}
        <div className="bg-cyber-surface/80 rounded-xl p-3.5 border border-cyber-border space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-cyber-subtle uppercase tracking-wider">VERIFIED FINDINGS ({findings.length})</span>
            <button 
              onClick={() => setCurrentView('findings')}
              className="text-[10px] text-cyber-accent hover:underline flex items-center gap-0.5"
            >
              View All <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-2">
            {findings.slice(0, 3).map((f) => (
              <div 
                key={f.id}
                onClick={() => {
                  setSelectedFinding(f);
                  setCurrentView('findings');
                }}
                className="p-2 rounded-lg bg-cyber-bg/80 border border-cyber-border/80 hover:border-cyber-accent/40 cursor-pointer transition-all space-y-1 group"
              >
                <div className="flex items-center justify-between">
                  <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                    f.severity === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                    f.severity === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                    'bg-cyan-500/20 text-cyan-400'
                  }`}>
                    {f.severity}
                  </span>
                  <span className="text-[10px] text-cyber-muted font-mono">{f.confidence}% Conf.</span>
                </div>
                <p className="text-slate-200 font-medium text-[11px] truncate group-hover:text-cyber-accent transition-colors">
                  {f.title}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* System Authorization Note */}
        <div className="p-3 rounded-lg bg-cyber-bg/50 border border-cyber-border/60 text-cyber-muted text-[11px] space-y-1">
          <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5 text-cyber-emerald" />
            <span>Scope Verification</span>
          </div>
          <p className="text-[10px] text-cyber-subtle leading-relaxed">
            All agent activities are restricted to authorized target parameters defined in engagement agreement.
          </p>
        </div>
      </div>
    </aside>
  );
};
