import React, { useState } from 'react';
import { Terminal as TerminalIcon, HardDrive, Cpu, ShieldCheck } from 'lucide-react';
import { WorkspaceTerminal } from './WorkspaceTerminal';
import { WorkspaceFileBrowser } from './WorkspaceFileBrowser';

interface WorkspacePanelProps {
  assessmentId: string;
}

export const WorkspacePanel: React.FC<WorkspacePanelProps> = ({ assessmentId }) => {
  const [activeTab, setActiveTab] = useState<'terminal' | 'files'>('terminal');

  return (
    <div className="flex flex-col h-[520px] bg-cyber-bg border border-cyber-border rounded-2xl overflow-hidden shadow-2xl">
      {/* Top Panel Bar */}
      <div className="px-4 py-3 bg-cyber-surface border-b border-cyber-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-lg bg-cyber-accent/10 border border-cyber-accent/30 text-cyber-accent">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-xs tracking-wide">SHARED AGENT COMPUTER WORKSPACE</h3>
            <p className="text-[10px] text-cyber-muted font-mono">Isolated PTY Linux Environment • /workspace</p>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-cyber-bg p-1 rounded-xl border border-cyber-border font-mono text-xs">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-3 py-1 rounded-lg flex items-center gap-1.5 font-bold transition-all ${
              activeTab === 'terminal'
                ? 'bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/30 shadow-sm'
                : 'text-cyber-muted hover:text-slate-200'
            }`}
          >
            <TerminalIcon className="w-3.5 h-3.5" />
            Interactive Terminal
          </button>

          <button
            onClick={() => setActiveTab('files')}
            className={`px-3 py-1 rounded-lg flex items-center gap-1.5 font-bold transition-all ${
              activeTab === 'files'
                ? 'bg-cyber-accent/20 text-cyber-accent border border-cyber-accent/30 shadow-sm'
                : 'text-cyber-muted hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-3.5 h-3.5" />
            File Explorer
          </button>
        </div>
      </div>

      {/* Panel Content */}
      <div className="flex-1 p-3 overflow-hidden bg-black/40">
        {activeTab === 'terminal' ? (
          <WorkspaceTerminal assessmentId={assessmentId} />
        ) : (
          <WorkspaceFileBrowser assessmentId={assessmentId} />
        )}
      </div>
    </div>
  );
};
