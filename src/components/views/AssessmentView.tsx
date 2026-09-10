import React from 'react';
import { 
  Crosshair, 
  Server, 
  Activity, 
  CheckCircle2, 
  Loader2, 
  Circle, 
  ShieldAlert, 
  Terminal, 
  Play, 
  Pause,
  Bug
} from 'lucide-react';
import { useCyber } from '../../context/CyberContext';

export const AssessmentView: React.FC = () => {
  const { activeAssessment, setIsScopeModalOpen, setCurrentView } = useCyber();

  if (!activeAssessment) return null;

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-cyber-bg p-6 space-y-6 select-none">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-6 rounded-2xl bg-cyber-surface/90 border border-cyber-border shadow-cyber">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-cyber-emerald/15 text-emerald-400 border border-cyber-emerald/30 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              In Progress
            </span>
            <span className="text-[11px] text-cyber-muted font-mono">{activeAssessment.environment}</span>
          </div>

          <h2 className="text-xl font-bold text-slate-100">{activeAssessment.title}</h2>
          <p className="text-xs text-cyber-muted font-mono flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-cyber-cyan" />
            <span>Target: {activeAssessment.targetIp}</span>
          </p>
        </div>

        {/* Risk Score Widget */}
        <div className="flex items-center gap-6 bg-cyber-card px-5 py-3 rounded-xl border border-cyber-border">
          <div className="text-center">
            <span className="text-[10px] font-semibold text-cyber-subtle uppercase tracking-wider block">COMPOSITE RISK SCORE</span>
            <div className="flex items-baseline gap-1 font-bold">
              <span className="text-2xl font-mono text-rose-400">{activeAssessment.riskScore}</span>
              <span className="text-cyber-muted text-xs">/ 10</span>
            </div>
          </div>

          <button 
            onClick={() => setIsScopeModalOpen(true)}
            className="px-4 py-2 rounded-lg text-xs font-semibold text-white bg-cyber-accent hover:bg-indigo-600 shadow-glow-accent transition-all"
          >
            New Assessment
          </button>
        </div>
      </div>

      {/* Multi-Agent Pipeline Progress Bar */}
      <div className="p-6 rounded-2xl bg-cyber-card border border-cyber-border shadow-cyber space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-100 tracking-wider uppercase flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyber-accent" />
            <span>Multi-Agent Execution Pipeline</span>
          </h3>
          <span className="text-[11px] text-cyber-muted font-mono">Phase 3 of 5 Running</span>
        </div>

        {/* Phase Steps Graphic */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {/* Phase 1: Recon */}
          <div className="p-3 rounded-xl bg-cyber-surface border border-emerald-500/30 text-emerald-400 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>1. Recon</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-[10px] text-cyber-muted font-mono">DNS, SSL, HTTP OSINT Verified</p>
          </div>

          {/* Phase 2: Service Analysis */}
          <div className="p-3 rounded-xl bg-cyber-surface border border-emerald-500/30 text-emerald-400 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>2. Service Analysis</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-[10px] text-cyber-muted font-mono">5 Open Ports Banner Identified</p>
          </div>

          {/* Phase 3: Vulnerability Research (Running) */}
          <div className="p-3 rounded-xl bg-cyber-accent/15 border border-cyber-accent text-cyber-accent space-y-1.5 shadow-glow-accent">
            <div className="flex items-center justify-between text-xs font-bold">
              <span>3. Vuln Research</span>
              <Loader2 className="w-4 h-4 animate-spin" />
            </div>
            <p className="text-[10px] text-slate-300 font-mono">Correlating CVE-2021-41773...</p>
          </div>

          {/* Phase 4: Risk Assessment (Queued) */}
          <div className="p-3 rounded-xl bg-cyber-surface/50 border border-cyber-border text-cyber-muted space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>4. Risk Assessment</span>
              <Circle className="w-3.5 h-3.5 text-cyber-subtle" />
            </div>
            <p className="text-[10px] text-cyber-subtle font-mono">Impact Score Weighting</p>
          </div>

          {/* Phase 5: Report (Queued) */}
          <div className="p-3 rounded-xl bg-cyber-surface/50 border border-cyber-border text-cyber-muted space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span>5. Report</span>
              <Circle className="w-3.5 h-3.5 text-cyber-subtle" />
            </div>
            <p className="text-[10px] text-cyber-subtle font-mono">Markdown Document Generation</p>
          </div>
        </div>
      </div>

      {/* Discovered Attack Surface & Open Services */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Services Table (2 Cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-cyber-card border border-cyber-border shadow-cyber space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Server className="w-4 h-4 text-cyber-cyan" />
              <span>Discovered Network Services ({activeAssessment.openServices.length})</span>
            </h3>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
              Active TCP Audit
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-cyber-border text-cyber-subtle text-[10px] font-semibold uppercase">
                  <th className="py-2.5 px-3">Port</th>
                  <th className="py-2.5 px-3">Service</th>
                  <th className="py-2.5 px-3">Identified Version</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyber-border/60 font-mono text-[11px]">
                {activeAssessment.openServices.map((svc, idx) => (
                  <tr key={idx} className="hover:bg-cyber-surface/50">
                    <td className="py-3 px-3 text-cyber-accent font-bold">{svc.port} / tcp</td>
                    <td className="py-3 px-3 text-slate-200 capitalize">{svc.service}</td>
                    <td className="py-3 px-3 text-slate-300">{svc.version}</td>
                    <td className="py-3 px-3 text-emerald-400">OPEN</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Tech Stack & Verified Findings Counter */}
        <div className="space-y-6">
          {/* Tech Stack Card */}
          <div className="p-6 rounded-2xl bg-cyber-card border border-cyber-border shadow-cyber space-y-3">
            <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Fingerprinted Tech Stack</h3>
            <div className="flex flex-wrap gap-2">
              {activeAssessment.techStack.map((tech, tIdx) => (
                <span key={tIdx} className="px-2.5 py-1 rounded-lg bg-cyber-surface border border-cyber-border text-xs text-slate-200 font-mono">
                  {tech}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Action Button to Findings */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-cyber-surface to-cyber-card border border-cyber-border shadow-cyber space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Bug className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] text-cyber-muted uppercase font-semibold">VERIFIED FINDINGS</span>
                <p className="text-lg font-bold text-slate-100 font-mono">
                  {activeAssessment.verifiedFindingsCount} Vulnerabilities
                </p>
              </div>
            </div>
            <button
              onClick={() => setCurrentView('findings')}
              className="w-full py-2.5 px-3 rounded-xl bg-cyber-surface border border-cyber-border hover:border-cyber-accent/40 text-xs font-semibold text-slate-200 hover:text-white transition-all text-center"
            >
              View Discovered Vulnerabilities &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
