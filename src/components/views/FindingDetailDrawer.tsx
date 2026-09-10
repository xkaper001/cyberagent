import React from 'react';
import { 
  X, 
  Bug, 
  ShieldAlert, 
  CheckCircle2, 
  ExternalLink, 
  MessageSquare, 
  Server, 
  Terminal, 
  Copy,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { Finding } from '../../types/cyber';
import { useCyber } from '../../context/CyberContext';

interface FindingDetailDrawerProps {
  finding: Finding | null;
  onClose: () => void;
}

export const FindingDetailDrawer: React.FC<FindingDetailDrawerProps> = ({ finding, onClose }) => {
  const { investigateFinding, addToast } = useCyber();

  if (!finding) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast('info', 'Evidence copied to clipboard');
  };

  return (
    <div className="fixed inset-y-0 right-0 w-full max-w-xl bg-cyber-card border-l border-cyber-border shadow-cyber z-50 flex flex-col animate-in slide-in-from-right duration-200 text-xs">
      {/* Drawer Header */}
      <div className="h-16 px-6 border-b border-cyber-border bg-cyber-surface/60 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-lg border flex items-center justify-center ${
            finding.severity === 'critical' ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
            finding.severity === 'high' ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
            'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
          }`}>
            <Bug className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-100 tracking-tight">FINDING DETAILS</h2>
            <p className="text-[11px] text-cyber-muted font-mono">{finding.cveId || finding.category}</p>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="text-cyber-muted hover:text-white p-1 rounded transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Drawer Scrollable Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Title & Severity Row */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
              finding.severity === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
              finding.severity === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
              'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
            }`}>
              {finding.severity}
            </span>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-cyber-surface border border-cyber-border text-emerald-400 font-semibold">
              {finding.confidence}% Confidence
            </span>
            <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-cyber-bg border border-cyber-border text-cyber-muted">
              Status: {finding.status.toUpperCase()}
            </span>
          </div>

          <h3 className="text-base font-bold text-slate-100 leading-snug">{finding.title}</h3>
        </div>

        {/* Affected Asset Card */}
        <div className="p-3.5 rounded-xl bg-cyber-surface/80 border border-cyber-border space-y-2">
          <span className="text-[10px] font-semibold text-cyber-subtle uppercase tracking-wider block">AFFECTED ASSET & SCOPE</span>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 font-mono text-slate-200">
              <Server className="w-4 h-4 text-cyber-cyan" />
              <span>{finding.asset}</span>
            </div>
            <span className="text-[10px] text-cyber-muted font-mono bg-cyber-bg px-2 py-0.5 rounded border border-cyber-border">
              {finding.targetIp}
            </span>
          </div>
        </div>

        {/* Evidence & Proof of Concept */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-cyber-subtle uppercase tracking-wider">PROOF OF CONCEPT EVIDENCE</span>
            <button 
              onClick={() => copyToClipboard(finding.evidence.join('\n'))}
              className="text-[10px] text-cyber-muted hover:text-white flex items-center gap-1"
            >
              <Copy className="w-3 h-3" /> Copy Evidence
            </button>
          </div>
          <div className="p-3.5 rounded-xl bg-cyber-bg border border-cyber-border font-mono space-y-2 text-[11px]">
            {finding.evidence.map((item, idx) => (
              <div key={idx} className="flex items-start gap-2 text-slate-300">
                <Terminal className="w-3.5 h-3.5 text-cyber-accent shrink-0 mt-0.5" />
                <span className="leading-relaxed">{item}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Potential Impact */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-semibold text-cyber-subtle uppercase tracking-wider block">POTENTIAL SECURITY IMPACT</span>
          <p className="p-3 rounded-xl bg-cyber-surface/50 border border-cyber-border text-slate-300 leading-relaxed text-[11.5px]">
            {finding.impact}
          </p>
        </div>

        {/* Recommended Remediation */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-semibold text-cyber-subtle uppercase tracking-wider block">RECOMMENDED REMEDIATION</span>
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-1 text-[11.5px]">
            <div className="flex items-center gap-2 font-bold text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>Remediation Guidance</span>
            </div>
            <p className="leading-relaxed font-mono text-[11px] pt-1">
              {finding.remediation}
            </p>
          </div>
        </div>

        {/* Agent Activity Summary */}
        {finding.agentActivitySummary && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-cyber-subtle uppercase tracking-wider block">AGENT WORK SUMMARY</span>
            <p className="p-3 rounded-xl bg-cyber-bg border border-cyber-border text-cyber-muted text-[11px]">
              {finding.agentActivitySummary}
            </p>
          </div>
        )}

        {/* References */}
        {finding.references && finding.references.length > 0 && (
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-cyber-subtle uppercase tracking-wider block">REFERENCES & CITATIONS</span>
            <div className="space-y-1">
              {finding.references.map((ref, idx) => (
                <a
                  key={idx}
                  href={ref}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 text-cyber-accent hover:underline text-[11px] font-mono"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span className="truncate">{ref}</span>
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Drawer Action Footer */}
      <div className="p-4 border-t border-cyber-border bg-cyber-bg/90 flex items-center justify-between shrink-0">
        <div className="text-[10px] text-cyber-muted font-mono">
          Detected: {new Date(finding.firstDetected).toLocaleDateString()}
        </div>

        <button
          onClick={() => {
            investigateFinding(finding);
            onClose();
          }}
          className="px-4 py-2 rounded-lg font-semibold text-white bg-gradient-to-r from-cyber-accent to-indigo-600 shadow-glow-accent hover:opacity-95 transition-all flex items-center gap-2 text-xs"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Investigate with Copilot</span>
        </button>
      </div>
    </div>
  );
};
