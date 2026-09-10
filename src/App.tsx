import React from 'react';
import { CyberProvider, useCyber } from './context/CyberContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { RightContextPanel } from './components/layout/RightContextPanel';

import { ChatView } from './components/views/ChatView';
import { DashboardView } from './components/views/DashboardView';
import { AssessmentView } from './components/views/AssessmentView';
import { FindingsView } from './components/views/FindingsView';
import { ReportsView } from './components/views/ReportsView';
import { KnowledgeView } from './components/views/KnowledgeView';
import { AgentsView } from './components/views/AgentsView';

import { CommandPalette } from './components/common/CommandPalette';
import { ScopeAuthModal } from './components/modals/ScopeAuthModal';
import { HumanApprovalModal } from './components/modals/HumanApprovalModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

const MainWorkspace: React.FC = () => {
  const { currentView, toasts, removeToast } = useCyber();

  const renderView = () => {
    switch (currentView) {
      case 'chat': return <ChatView />;
      case 'dashboard': return <DashboardView />;
      case 'assessments': return <AssessmentView />;
      case 'findings': return <FindingsView />;
      case 'reports': return <ReportsView />;
      case 'knowledge': return <KnowledgeView />;
      case 'agents': return <AgentsView />;
      default: return <ChatView />;
    }
  };

  return (
    <div className="flex h-screen w-screen bg-cyber-bg overflow-hidden text-cyber-text antialiased">
      {/* 1. Left Sidebar */}
      <Sidebar />

      {/* 2. Main Center Workspace */}
      <div className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        <Header />
        <main className="flex-1 overflow-hidden relative">
          {renderView()}
        </main>
      </div>

      {/* 3. Optional Right Context Panel */}
      <RightContextPanel />

      {/* Global Modals */}
      <CommandPalette />
      <ScopeAuthModal />
      <HumanApprovalModal />
      <SettingsModal />

      {/* Toast Notification Container */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2 pointer-events-none max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3 rounded-xl border shadow-cyber flex items-center justify-between gap-3 text-xs animate-in slide-in-from-bottom duration-200 ${
              toast.type === 'success' ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300' :
              toast.type === 'warning' ? 'bg-amber-500/15 border-amber-500/40 text-amber-300' :
              toast.type === 'error' ? 'bg-rose-500/15 border-rose-500/40 text-rose-300' :
              'bg-cyber-card border-cyber-border text-slate-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {toast.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              {toast.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />}
              {toast.type === 'info' && <Info className="w-4 h-4 text-cyber-accent shrink-0" />}
              <span>{toast.message}</span>
            </div>
            <button 
              onClick={() => removeToast(toast.id)}
              className="text-cyber-muted hover:text-white p-0.5 rounded"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <CyberProvider>
      <MainWorkspace />
    </CyberProvider>
  );
};

export default App;
