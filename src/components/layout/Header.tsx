import React from 'react';
import { 
  Search, 
  PanelRightClose, 
  PanelRightOpen, 
  ShieldCheck, 
  BellRing, 
  Settings,
  Sparkles
} from 'lucide-react';
import { useCyber } from '../../context/CyberContext';

export const Header: React.FC = () => {
  const { 
    currentView, 
    isRightPanelOpen, 
    toggleRightPanel, 
    setIsCommandPaletteOpen, 
    setIsSettingsOpen,
    humanApproval,
    setIsHumanApprovalOpen,
    activeAssessment
  } = useCyber();

  const viewTitles: Record<string, string> = {
    chat: 'Security Copilot Workspace',
    dashboard: 'Enterprise Security Overview',
    assessments: 'Security Assessment Workbench',
    findings: 'Discovered Vulnerabilities & Findings',
    reports: 'Security Reports & Executive Documentation',
    knowledge: 'Security Intelligence & CVE Knowledge Base',
    agents: 'Specialized Agentic AI Workers',
  };

  return (
    <header className="h-16 bg-cyber-bg/95 backdrop-blur border-b border-cyber-border px-6 flex items-center justify-between shrink-0 z-20">
      {/* Title & Status */}
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
            <span>{viewTitles[currentView] || 'CyberAgents Workspace'}</span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              System Operational
            </span>
          </h1>
          <p className="text-[11px] text-cyber-muted font-medium hidden sm:block">
            Authorized Agentic Security Assistant • 9 Specialized Agents Active
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5">
        {/* Command Palette Trigger */}
        <button
          onClick={() => setIsCommandPaletteOpen(true)}
          className="flex items-center gap-3 px-3 py-1.5 rounded-lg bg-cyber-surface/90 border border-cyber-border text-xs text-cyber-muted hover:text-slate-200 hover:border-cyber-border-light transition-all shadow-sm group"
        >
          <Search className="w-3.5 h-3.5 text-cyber-muted group-hover:text-cyber-accent" />
          <span className="hidden md:inline text-[11px]">Search actions, findings, CVEs...</span>
          <kbd className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-cyber-bg border border-cyber-border text-[10px] font-mono text-cyber-subtle">
            Ctrl K
          </kbd>
        </button>

        {/* Human Approval Notification Badge (if pending) */}
        {humanApproval && humanApproval.status === 'pending' && (
          <button
            onClick={() => setIsHumanApprovalOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400 text-xs font-medium hover:bg-amber-500/25 transition-all animate-pulse"
            title="Agent approval pending"
          >
            <BellRing className="w-3.5 h-3.5 animate-bounce" />
            <span className="hidden sm:inline text-[11px]">1 Approval Needed</span>
          </button>
        )}

        {/* Dynamic Target Scope Indicator */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyber-surface border border-cyber-border text-[11px] font-mono text-cyber-muted">
          <ShieldCheck className={`w-3.5 h-3.5 ${
            activeAssessment?.authorization_status === 'confirmed' ? 'text-cyber-emerald' : 'text-amber-400'
          }`} />
          <span>
            {activeAssessment?.target 
              ? `${activeAssessment.target} (${activeAssessment.authorization_status === 'confirmed' ? '✓ Confirmed' : '⚠ Unconfirmed'})`
              : 'Target Scope: Awaiting Prompt'}
          </span>
        </div>

        {/* Settings Toggle */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 rounded-lg bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-white hover:border-cyber-border-light transition-all"
          title="Platform Settings"
        >
          <Settings className="w-4 h-4" />
        </button>

        {/* Toggle Right Panel */}
        <button
          onClick={toggleRightPanel}
          className={`p-2 rounded-lg border transition-all ${
            isRightPanelOpen 
              ? 'bg-cyber-accent/15 border-cyber-accent/30 text-cyber-accent' 
              : 'bg-cyber-surface border-cyber-border text-cyber-muted hover:text-white'
          }`}
          title={isRightPanelOpen ? "Hide Context Panel" : "Show Context Panel"}
        >
          {isRightPanelOpen ? <PanelRightClose className="w-4 h-4" /> : <PanelRightOpen className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
