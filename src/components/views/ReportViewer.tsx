import React from 'react';
import { 
  X, 
  Download, 
  Share2, 
  ShieldAlert, 
  CheckCircle2, 
  Server, 
  FileText, 
  Calendar,
  User,
  Printer
} from 'lucide-react';
import { SecurityReport } from '../../types/cyber';
import { useCyber } from '../../context/CyberContext';

interface ReportViewerProps {
  report: SecurityReport | null;
  onClose: () => void;
}

export const ReportViewer: React.FC<ReportViewerProps> = ({ report, onClose }) => {
  const { addToast } = useCyber();

  if (!report) return null;

  const handleExport = (format: string) => {
    addToast('success', `Initiated report export in ${format.toUpperCase()} format`);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div 
        className="w-full max-w-4xl bg-cyber-card border border-cyber-border rounded-2xl shadow-cyber overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Document Header Controls */}
        <div className="h-16 px-6 border-b border-cyber-border bg-cyber-surface/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyber-accent/15 border border-cyber-accent/30 flex items-center justify-center text-cyber-accent">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100">{report.title}</h2>
              <p className="text-[11px] text-cyber-muted font-mono">CyberAgents Security Documentation Report</p>
            </div>
          </div>

          {/* Export & Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('pdf')}
              className="px-3 py-1.5 rounded-lg bg-cyber-surface border border-cyber-border text-slate-200 hover:text-white hover:border-cyber-accent/40 font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-cyber-accent" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={() => handleExport('markdown')}
              className="px-3 py-1.5 rounded-lg bg-cyber-surface border border-cyber-border text-slate-200 hover:text-white font-medium text-xs flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5 text-cyber-cyan" />
              <span>Markdown</span>
            </button>
            <button
              onClick={() => addToast('info', 'Report shareable link copied')}
              className="p-2 rounded-lg bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-white transition-colors"
              title="Share Report"
            >
              <Share2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-cyber-muted hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Formatted Security Report Document */}
        <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-[#0D1117] text-slate-200 leading-relaxed font-sans">
          {/* Report Title & Metadata Header */}
          <div className="border-b border-cyber-border pb-6 space-y-4">
            <div className="flex items-center justify-between text-[11px] font-mono text-cyber-muted">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-cyber-accent" />
                <span>{report.date}</span>
              </div>
              <div className="flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-cyber-cyan" />
                <span>Author: {report.author}</span>
              </div>
            </div>

            <h1 className="text-2xl font-bold text-slate-100 tracking-tight">{report.title}</h1>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              <div className="p-3 rounded-xl bg-cyber-surface/60 border border-cyber-border">
                <span className="text-[10px] text-cyber-muted uppercase block font-semibold">Target Scope</span>
                <span className="font-mono text-slate-100 font-semibold text-[11.5px] truncate block">{report.target}</span>
              </div>
              <div className="p-3 rounded-xl bg-cyber-surface/60 border border-cyber-border">
                <span className="text-[10px] text-cyber-muted uppercase block font-semibold">Composite Risk Score</span>
                <span className="font-mono text-rose-400 font-bold text-sm">{report.riskScore} / 10 ({report.riskLevel})</span>
              </div>
              <div className="p-3 rounded-xl bg-cyber-surface/60 border border-cyber-border">
                <span className="text-[10px] text-cyber-muted uppercase block font-semibold">Findings Count</span>
                <span className="font-mono text-slate-100 font-semibold text-sm">{report.findingsCount} Discovered</span>
              </div>
              <div className="p-3 rounded-xl bg-cyber-surface/60 border border-cyber-border">
                <span className="text-[10px] text-cyber-muted uppercase block font-semibold">Status</span>
                <span className="font-mono text-emerald-400 font-semibold text-[11.5px]">{report.status}</span>
              </div>
            </div>
          </div>

          {/* Section 1: Executive Summary */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider text-cyber-accent border-l-2 border-cyber-accent pl-3">
              1. Executive Summary
            </h2>
            <p className="p-4 rounded-xl bg-cyber-card border border-cyber-border text-slate-300 leading-relaxed text-xs sm:text-sm">
              {report.executiveSummary}
            </p>
          </div>

          {/* Section 2: Attack Surface */}
          <div className="space-y-2">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider text-cyber-accent border-l-2 border-cyber-accent pl-3">
              2. Attack Surface Analysis
            </h2>
            <p className="p-4 rounded-xl bg-cyber-card border border-cyber-border text-slate-300 leading-relaxed text-xs sm:text-sm">
              {report.attackSurface}
            </p>
          </div>

          {/* Section 3: Findings Summary Distribution */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider text-cyber-accent border-l-2 border-cyber-accent pl-3">
              3. Vulnerability Distribution Breakdown
            </h2>
            <div className="grid grid-cols-5 gap-3 font-mono text-center">
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30">
                <span className="text-[10px] text-rose-300 block">CRITICAL</span>
                <span className="text-lg font-bold text-rose-400">{report.findingsSummary.critical}</span>
              </div>
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30">
                <span className="text-[10px] text-amber-300 block">HIGH</span>
                <span className="text-lg font-bold text-amber-400">{report.findingsSummary.high}</span>
              </div>
              <div className="p-3 rounded-xl bg-cyan-500/15 border border-cyan-500/30">
                <span className="text-[10px] text-cyan-300 block">MEDIUM</span>
                <span className="text-lg font-bold text-cyan-400">{report.findingsSummary.medium}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-500/15 border border-slate-500/30">
                <span className="text-[10px] text-slate-300 block">LOW</span>
                <span className="text-lg font-bold text-slate-300">{report.findingsSummary.low}</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-500/15 border border-slate-500/30">
                <span className="text-[10px] text-slate-300 block">INFO</span>
                <span className="text-lg font-bold text-slate-300">{report.findingsSummary.info}</span>
              </div>
            </div>
          </div>

          {/* Section 4: Prioritized Remediation Roadmap */}
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider text-cyber-accent border-l-2 border-cyber-accent pl-3">
              4. Prioritized Remediation Roadmap
            </h2>
            <div className="space-y-2">
              {report.remediationRoadmap.map((item, idx) => (
                <div key={idx} className="p-3 rounded-xl bg-cyber-card border border-cyber-border flex items-start gap-3 text-xs">
                  <span className="w-5 h-5 rounded-full bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/30 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-slate-200 font-mono leading-relaxed">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer Signoff */}
          <div className="pt-6 border-t border-cyber-border text-center text-cyber-muted text-xs space-y-1 font-mono">
            <p>Generated automatically by CyberAgents Agentic AI Platform</p>
            <p className="text-[10px] text-cyber-subtle">Authorized / Lab / Security Research Purpose Only</p>
          </div>
        </div>
      </div>
    </div>
  );
};
