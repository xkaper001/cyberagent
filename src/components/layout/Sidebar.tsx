import React from 'react';
import { 
  ShieldAlert, 
  Plus, 
  MessageSquare, 
  LayoutDashboard, 
  Crosshair, 
  Bug, 
  FileText, 
  BookOpen, 
  Bot, 
  ChevronLeft, 
  ChevronRight, 
  Settings, 
  User, 
  Server,
  Activity
} from 'lucide-react';
import { useCyber } from '../../context/CyberContext';
import { ViewType } from '../../types/cyber';

export const Sidebar: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    isSidebarCollapsed, 
    toggleSidebar, 
    setIsScopeModalOpen, 
    setIsSettingsOpen,
    assessments,
    activeAssessment,
    setActiveAssessment,
    startNewBlankAssessment
  } = useCyber();

  const navItems: { id: ViewType; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'chat', label: 'Chat Copilot', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'assessments', label: 'Assessments', icon: <Crosshair className="w-4 h-4" />, badge: 'Active' },
    { id: 'findings', label: 'Findings', icon: <Bug className="w-4 h-4" />, badge: '5' },
    { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
    { id: 'knowledge', label: 'Knowledge', icon: <BookOpen className="w-4 h-4" /> },
    { id: 'agents', label: 'Agents', icon: <Bot className="w-4 h-4" />, badge: '9' },
  ];

  return (
    <aside 
      className={`relative flex flex-col h-screen bg-cyber-sidebar border-r border-cyber-border transition-all duration-300 z-30 select-none ${
        isSidebarCollapsed ? 'w-16' : 'w-[260px]'
      }`}
    >
      {/* Header / Logo */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-cyber-border/60">
        {!isSidebarCollapsed ? (
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setCurrentView('chat')}>
            <div className="w-9 h-9 rounded-lg bg-cyber-accent/15 border border-cyber-accent/30 flex items-center justify-center text-cyber-accent shadow-glow-accent">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-100 tracking-wide text-sm flex items-center gap-1.5">
                CyberAgents
                <span className="text-[10px] bg-cyber-accent/20 text-cyber-accent px-1.5 py-0.2 rounded font-mono font-medium border border-cyber-accent/30">PRO</span>
              </div>
              <p className="text-[11px] text-cyber-muted font-medium">AI Security Copilot</p>
            </div>
          </div>
        ) : (
          <div className="w-9 h-9 mx-auto rounded-lg bg-cyber-accent/15 border border-cyber-accent/30 flex items-center justify-center text-cyber-accent cursor-pointer" onClick={() => setCurrentView('chat')}>
            <ShieldAlert className="w-5 h-5" />
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="p-3">
        <button
          onClick={startNewBlankAssessment}
          className={`w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg font-medium text-xs text-white bg-gradient-to-r from-cyber-accent to-indigo-600 hover:from-indigo-600 hover:to-cyber-accent transition-all shadow-glow-accent active:scale-[0.98] ${
            isSidebarCollapsed ? 'px-0' : ''
          }`}
          title="Start New ChatGPT-like Security Assessment"
        >
          <Plus className="w-4 h-4 shrink-0" />
          {!isSidebarCollapsed && <span>New Assessment</span>}
        </button>
      </div>

      {/* Main Navigation */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        <div className={`px-2 pb-1 text-[10px] font-semibold text-cyber-subtle uppercase tracking-wider ${isSidebarCollapsed ? 'hidden' : 'block'}`}>
          Navigation
        </div>
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-colors group relative ${
                isActive 
                  ? 'bg-cyber-accent/15 text-slate-100 border border-cyber-accent/30 font-semibold' 
                  : 'text-cyber-muted hover:text-slate-100 hover:bg-cyber-surface'
              }`}
              title={isSidebarCollapsed ? item.label : undefined}
            >
              <div className="flex items-center gap-3">
                <span className={`${isActive ? 'text-cyber-accent' : 'text-cyber-muted group-hover:text-slate-200'}`}>
                  {item.icon}
                </span>
                {!isSidebarCollapsed && <span>{item.label}</span>}
              </div>

              {!isSidebarCollapsed && item.badge && (
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  isActive 
                    ? 'bg-cyber-accent/30 text-slate-100 font-bold' 
                    : 'bg-cyber-surface text-cyber-muted'
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Recent Assessments Section */}
        {!isSidebarCollapsed && (
          <div className="pt-5 pb-1">
            <div className="px-2 pb-2 text-[10px] font-semibold text-cyber-subtle uppercase tracking-wider flex items-center justify-between">
              <span>Recent Assessments</span>
              <Activity className="w-3 h-3 text-cyber-muted" />
            </div>
            <div className="space-y-0.5">
              {assessments.slice(0, 4).map((asm) => {
                const isSelected = activeAssessment?.id === asm.id;
                return (
                  <button
                    key={asm.id}
                    onClick={() => {
                      setActiveAssessment(asm);
                      setCurrentView('assessments');
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-xs truncate transition-colors flex items-center justify-between ${
                      isSelected 
                        ? 'bg-cyber-surface text-slate-100 border-l-2 border-cyber-accent font-medium' 
                        : 'text-cyber-muted hover:text-slate-200 hover:bg-cyber-surface/50'
                    }`}
                  >
                    <span className="truncate">{asm.title}</span>
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                      asm.status === 'in_progress' ? 'bg-cyber-emerald animate-pulse' : 'bg-slate-600'
                    }`} />
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer / Profile & Workspace */}
      <div className="p-3 border-t border-cyber-border space-y-2">
        {/* Workspace Selector */}
        {!isSidebarCollapsed ? (
          <div className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-cyber-surface/70 border border-cyber-border text-xs text-cyber-muted">
            <div className="flex items-center gap-2 truncate">
              <Server className="w-3.5 h-3.5 text-cyber-cyan shrink-0" />
              <span className="truncate font-mono text-[11px] text-slate-300">Lab Workspace</span>
            </div>
            <span className="w-2 h-2 rounded-full bg-cyber-emerald" title="Authorized Environment Active" />
          </div>
        ) : null}

        {/* User Profile & Settings */}
        <div className="flex items-center justify-between pt-1">
          {!isSidebarCollapsed ? (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-cyber-surface border border-cyber-border flex items-center justify-center text-slate-300">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="text-left leading-none">
                <p className="text-xs font-semibold text-slate-200">Security Lead</p>
                <p className="text-[10px] text-cyber-muted font-mono">operator@lab.internal</p>
              </div>
            </div>
          ) : (
            <div className="w-7 h-7 mx-auto rounded-full bg-cyber-surface border border-cyber-border flex items-center justify-center text-slate-300">
              <User className="w-3.5 h-3.5" />
            </div>
          )}

          {!isSidebarCollapsed && (
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-1.5 rounded-md text-cyber-muted hover:text-slate-100 hover:bg-cyber-surface transition-colors"
              title="Settings"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Collapse Toggle Control */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-cyber-surface border border-cyber-border flex items-center justify-center text-cyber-muted hover:text-white shadow-md transition-colors z-40"
        title={isSidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
      >
        {isSidebarCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  );
};
