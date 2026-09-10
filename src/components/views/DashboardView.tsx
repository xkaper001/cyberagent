import React from 'react';
import { 
  LayoutDashboard, 
  Crosshair, 
  Bug, 
  ShieldAlert, 
  FileText, 
  Activity, 
  Server, 
  ChevronRight,
  Bot,
  Plus
} from 'lucide-react';
import { useCyber } from '../../context/CyberContext';

export const DashboardView: React.FC = () => {
  const { 
    assessments, 
    findings, 
    reports, 
    agents, 
    setCurrentView, 
    setSelectedFinding,
    setIsScopeModalOpen,
    setActiveAssessment 
  } = useCyber();

  const criticalCount = findings.filter(f => f.severity === 'critical').length;
  const highCount = findings.filter(f => f.severity === 'high').length;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-cyber-bg p-6 space-y-6 select-none">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-cyber-accent" />
            <span>Enterprise Security Overview</span>
          </h2>
          <p className="text-xs text-cyber-muted">
            High-level metrics across active security assessments and agent operations.
          </p>
        </div>

        <button
          onClick={() => setIsScopeModalOpen(true)}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-cyber-accent to-indigo-600 shadow-glow-accent hover:opacity-95 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Security Assessment</span>
        </button>
      </div>

      {/* Metrics Cards Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div 
          onClick={() => setCurrentView('assessments')}
          className="p-5 rounded-2xl bg-cyber-card border border-cyber-border hover:border-cyber-accent/40 shadow-cyber transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-cyber-subtle uppercase tracking-wider">ACTIVE ASSESSMENTS</span>
            <Crosshair className="w-4 h-4 text-cyber-accent group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-100">{assessments.length}</span>
            <span className="text-[11px] text-emerald-400 font-mono">1 Running</span>
          </div>
        </div>

        <div 
          onClick={() => setCurrentView('findings')}
          className="p-5 rounded-2xl bg-cyber-card border border-cyber-border hover:border-cyber-accent/40 shadow-cyber transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-cyber-subtle uppercase tracking-wider">DISCOVERED FINDINGS</span>
            <Bug className="w-4 h-4 text-rose-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-100">{findings.length}</span>
            <span className="text-[11px] text-rose-400 font-mono font-bold">{criticalCount} Critical</span>
          </div>
        </div>

        <div 
          onClick={() => setCurrentView('reports')}
          className="p-5 rounded-2xl bg-cyber-card border border-cyber-border hover:border-cyber-accent/40 shadow-cyber transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-cyber-subtle uppercase tracking-wider">COMPLETED REPORTS</span>
            <FileText className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-100">{reports.length}</span>
            <span className="text-[11px] text-cyber-muted font-mono">Documentation Ready</span>
          </div>
        </div>

        <div 
          onClick={() => setCurrentView('agents')}
          className="p-5 rounded-2xl bg-cyber-card border border-cyber-border hover:border-cyber-accent/40 shadow-cyber transition-all cursor-pointer space-y-2 group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-cyber-subtle uppercase tracking-wider">AI AGENTS ACTIVE</span>
            <Bot className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-100">{agents.length}</span>
            <span className="text-[11px] text-emerald-400 font-mono">100% Operational</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Risk Overview & Recent Assessments */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Card */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-cyber-card border border-cyber-border shadow-cyber space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyber-accent" />
              <span>Vulnerability Severity Distribution</span>
            </h3>
            <span className="text-[11px] font-mono text-cyber-muted">Lab Context: 8.4 Composite Risk</span>
          </div>

          {/* Visual Risk Bar */}
          <div className="space-y-3">
            <div className="h-4 w-full rounded-full bg-cyber-surface overflow-hidden flex">
              <div className="bg-rose-500 w-[40%]" title="Critical (40%)" />
              <div className="bg-amber-500 w-[30%]" title="High (30%)" />
              <div className="bg-cyan-500 w-[20%]" title="Medium (20%)" />
              <div className="bg-slate-500 w-[10%]" title="Low (10%)" />
            </div>

            <div className="grid grid-cols-4 gap-2 font-mono text-center text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <span className="text-[10px] text-rose-300 block">CRITICAL</span>
                <span className="font-bold text-rose-400">{criticalCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <span className="text-[10px] text-amber-300 block">HIGH</span>
                <span className="font-bold text-amber-400">{highCount}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                <span className="text-[10px] text-cyan-300 block">MEDIUM</span>
                <span className="font-bold text-cyan-400">1</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-500/10 border border-slate-500/20">
                <span className="text-[10px] text-slate-300 block">LOW</span>
                <span className="font-bold text-slate-300">1</span>
              </div>
            </div>
          </div>

          {/* Recent Findings Preview List */}
          <div className="space-y-2 pt-2 border-t border-cyber-border/60">
            <div className="flex items-center justify-between text-[11px] text-cyber-muted">
              <span className="font-semibold uppercase tracking-wider text-[10px]">High Priority Findings</span>
              <button onClick={() => setCurrentView('findings')} className="text-cyber-accent hover:underline">
                View All Findings &rarr;
              </button>
            </div>

            <div className="space-y-2">
              {findings.slice(0, 2).map((f) => (
                <div 
                  key={f.id}
                  onClick={() => {
                    setSelectedFinding(f);
                    setCurrentView('findings');
                  }}
                  className="p-3 rounded-xl bg-cyber-surface/60 border border-cyber-border hover:border-cyber-accent/40 cursor-pointer transition-all flex items-center justify-between text-xs group"
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                      f.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {f.severity}
                    </span>
                    <span className="font-semibold text-slate-200 group-hover:text-cyber-accent transition-colors">
                      {f.title}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-cyber-subtle group-hover:text-white transition-colors" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Assessments & Activity List */}
        <div className="p-6 rounded-2xl bg-cyber-card border border-cyber-border shadow-cyber space-y-4">
          <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
            <Server className="w-4 h-4 text-cyber-cyan" />
            <span>Recent Assessments</span>
          </h3>

          <div className="space-y-2">
            {assessments.map((asm) => (
              <div 
                key={asm.id}
                onClick={() => {
                  setActiveAssessment(asm);
                  setCurrentView('assessments');
                }}
                className="p-3 rounded-xl bg-cyber-surface/60 border border-cyber-border hover:border-cyber-accent/40 cursor-pointer transition-all space-y-1 group text-xs"
              >
                <div className="flex items-center justify-between font-semibold text-slate-200 group-hover:text-cyber-accent transition-colors">
                  <span>{asm.title}</span>
                  <span className={`w-2 h-2 rounded-full ${
                    asm.status === 'in_progress' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                  }`} />
                </div>
                <div className="flex items-center justify-between text-[10px] text-cyber-muted font-mono">
                  <span>{asm.target}</span>
                  <span className="text-rose-400 font-bold">{asm.riskScore} Risk</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
