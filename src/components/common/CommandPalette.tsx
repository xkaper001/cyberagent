import React, { useState, useEffect } from 'react';
import { 
  Search, 
  MessageSquare, 
  LayoutDashboard, 
  Crosshair, 
  Bug, 
  FileText, 
  BookOpen, 
  Bot, 
  Plus, 
  X,
  ArrowRight,
  ShieldAlert
} from 'lucide-react';
import { useCyber } from '../../context/CyberContext';
import { ViewType } from '../../types/cyber';

export const CommandPalette: React.FC = () => {
  const { 
    isCommandPaletteOpen, 
    setIsCommandPaletteOpen, 
    setCurrentView, 
    setIsScopeModalOpen,
    findings,
    setSelectedFinding
  } = useCyber();

  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen(true);
      }
      if (e.key === 'Escape' && isCommandPaletteOpen) {
        setIsCommandPaletteOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCommandPaletteOpen, setIsCommandPaletteOpen]);

  if (!isCommandPaletteOpen) return null;

  const actions = [
    { id: 'new-asm', title: 'Start New Security Assessment', category: 'Action', icon: <Plus className="w-4 h-4 text-cyber-emerald" />, action: () => { setIsScopeModalOpen(true); setIsCommandPaletteOpen(false); } },
    { id: 'nav-chat', title: 'Open Security Copilot Chat', category: 'Navigation', icon: <MessageSquare className="w-4 h-4 text-cyber-accent" />, action: () => { setCurrentView('chat'); setIsCommandPaletteOpen(false); } },
    { id: 'nav-findings', title: 'View Discovered Findings & Vulnerabilities', category: 'Navigation', icon: <Bug className="w-4 h-4 text-rose-400" />, action: () => { setCurrentView('findings'); setIsCommandPaletteOpen(false); } },
    { id: 'nav-reports', title: 'Open Security Reports Library', category: 'Navigation', icon: <FileText className="w-4 h-4 text-cyan-400" />, action: () => { setCurrentView('reports'); setIsCommandPaletteOpen(false); } },
    { id: 'nav-knowledge', title: 'Search CVE & Security Intelligence Knowledge Base', category: 'Navigation', icon: <BookOpen className="w-4 h-4 text-amber-400" />, action: () => { setCurrentView('knowledge'); setIsCommandPaletteOpen(false); } },
    { id: 'nav-agents', title: 'View Specialized Agent Hub', category: 'Navigation', icon: <Bot className="w-4 h-4 text-purple-400" />, action: () => { setCurrentView('agents'); setIsCommandPaletteOpen(false); } },
  ];

  const filteredActions = actions.filter(a => a.title.toLowerCase().includes(query.toLowerCase()));
  const filteredFindings = findings.filter(f => f.title.toLowerCase().includes(query.toLowerCase()) || f.cveId?.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-start justify-center pt-24 px-4">
      <div 
        className="w-full max-w-xl bg-cyber-card border border-cyber-border rounded-xl shadow-cyber overflow-hidden animate-in fade-in zoom-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Bar */}
        <div className="flex items-center px-4 py-3 border-b border-cyber-border gap-3">
          <Search className="w-4 h-4 text-cyber-muted" />
          <input
            type="text"
            autoFocus
            placeholder="Type a command, navigate, or search findings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-100 placeholder-cyber-muted focus:outline-none"
          />
          <button 
            onClick={() => setIsCommandPaletteOpen(false)}
            className="p-1 text-cyber-muted hover:text-white rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-80 overflow-y-auto p-2 space-y-3">
          {/* Actions Section */}
          {filteredActions.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold text-cyber-subtle uppercase tracking-wider">
                Quick Actions & Navigation
              </div>
              <div className="space-y-1 mt-1">
                {filteredActions.map((item) => (
                  <button
                    key={item.id}
                    onClick={item.action}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-cyber-surface hover:text-white transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      {item.icon}
                      <span>{item.title}</span>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-cyber-subtle opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Findings Search Section */}
          {filteredFindings.length > 0 && (
            <div>
              <div className="px-3 py-1 text-[10px] font-semibold text-cyber-subtle uppercase tracking-wider">
                Discovered Vulnerabilities ({filteredFindings.length})
              </div>
              <div className="space-y-1 mt-1">
                {filteredFindings.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => {
                      setSelectedFinding(f);
                      setCurrentView('findings');
                      setIsCommandPaletteOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs text-slate-200 hover:bg-cyber-surface hover:text-white transition-colors group text-left"
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Bug className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      <span className="truncate">{f.title}</span>
                    </div>
                    <span className="text-[10px] font-mono text-cyber-muted bg-cyber-bg px-2 py-0.5 rounded border border-cyber-border shrink-0">
                      {f.severity.toUpperCase()}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {filteredActions.length === 0 && filteredFindings.length === 0 && (
            <div className="py-8 text-center text-cyber-muted text-xs">
              No actions or findings match "{query}"
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2 border-t border-cyber-border bg-cyber-bg/50 flex items-center justify-between text-[11px] text-cyber-muted">
          <span>Tip: Navigate with arrow keys, press ESC to dismiss</span>
          <span className="font-mono">CyberAgents v1.0 PRO</span>
        </div>
      </div>
    </div>
  );
};
