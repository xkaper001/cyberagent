import React, { useRef, useEffect, useState } from 'react';
import { 
  Sparkles, 
  Crosshair, 
  Search, 
  Bug, 
  FileText, 
  Bot,
  ShieldCheck,
  Terminal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useCyber } from '../../context/CyberContext';
import { ChatMessageItem } from '../chat/ChatMessageItem';
import { ChatInput } from '../chat/ChatInput';

import { WorkspacePanel } from '../workspace/WorkspacePanel';

export const ChatView: React.FC = () => {
  const { 
    messages, 
    sendMessage, 
    setIsScopeModalOpen, 
    setCurrentView,
    findings,
    setSelectedFinding,
    activeAssessment
  } = useCyber();
  const [showWorkspace, setShowWorkspace] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const suggestedActions = [
    { 
      label: 'Start Security Assessment', 
      icon: <Crosshair className="w-3.5 h-3.5 text-cyber-emerald" />, 
      action: () => setIsScopeModalOpen(true) 
    },
    { 
      label: 'Analyze Security Finding', 
      icon: <Bug className="w-3.5 h-3.5 text-rose-400" />, 
      action: () => {
        if (findings.length > 0) {
          setSelectedFinding(findings[0]);
          setCurrentView('findings');
        }
      } 
    },
    { 
      label: 'Investigate Vulnerability', 
      icon: <Search className="w-3.5 h-3.5 text-cyber-cyan" />, 
      action: () => sendMessage("Investigate Apache httpd CVE-2021-41773 vulnerability and check proof of concept execution steps.") 
    },
    { 
      label: 'Review Scan Results', 
      icon: <Bot className="w-3.5 h-3.5 text-purple-400" />, 
      action: () => sendMessage("Analyze open network ports and Spring Actuator endpoints on target 10.10.14.5.") 
    },
    { 
      label: 'Generate Security Report', 
      icon: <FileText className="w-3.5 h-3.5 text-amber-400" />, 
      action: () => setCurrentView('reports') 
    },
  ];

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-cyber-bg">
      {/* Workspace Banner Toggle */}
      <div className="px-4 py-2 bg-cyber-surface/90 border-b border-cyber-border flex items-center justify-between font-mono text-xs">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyber-accent" />
          <span className="font-bold text-slate-100">SHARED AGENT WORKSPACE</span>
          <span className="text-[10px] text-cyber-muted">({activeAssessment?.id || 'Active Assessment'})</span>
        </div>

        <button
          onClick={() => setShowWorkspace(!showWorkspace)}
          className={`px-3 py-1 rounded-lg flex items-center gap-1.5 font-bold transition-all border ${
            showWorkspace
              ? 'bg-cyber-accent/20 text-cyber-accent border-cyber-accent/40'
              : 'bg-cyber-card text-slate-300 border-cyber-border hover:text-white'
          }`}
        >
          <span>{showWorkspace ? 'Hide Workspace' : 'Open Workspace Terminal'}</span>
          {showWorkspace ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Embedded Shared Workspace Container */}
      {showWorkspace && (
        <div className="p-3 bg-black/60 border-b border-cyber-border animate-in slide-in-from-top-2 duration-200">
          <WorkspacePanel assessmentId={activeAssessment?.id || 'default_assessment'} />
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero Welcome Container (if messages list is empty) */}
        {messages.length === 0 && (
          <div className="py-16 px-4 max-w-2xl mx-auto text-center space-y-6 animate-in fade-in duration-300 select-none">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-cyber-accent/15 border border-cyber-accent/30 flex items-center justify-center text-cyber-accent shadow-glow-accent">
              <ShieldCheck className="w-9 h-9" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 tracking-tight">
                CyberAgents Copilot
              </h1>
              <p className="text-sm text-cyber-muted max-w-lg mx-auto leading-relaxed">
                What would you like to assess? Ask CyberAgents to perform authorized reconnaissance, service discovery, or security analysis.
              </p>
            </div>

            {/* Example Prompt Chips */}
            <div className="pt-4 flex flex-wrap justify-center gap-2.5 max-w-xl mx-auto">
              <button
                onClick={() => sendMessage("Scan my authorized target http://127.0.0.1:8000 for web vulnerabilities")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyber-surface/90 border border-cyber-border hover:border-cyber-accent/50 hover:bg-cyber-surface text-xs font-medium text-slate-200 transition-all shadow-sm active:scale-95 text-left"
              >
                <Crosshair className="w-4 h-4 text-cyber-emerald shrink-0" />
                <span>Scan target http://127.0.0.1:8000 for vulnerabilities</span>
              </button>

              <button
                onClick={() => sendMessage("Run reconnaissance to check DNS resolution and HTTP headers on 127.0.0.1")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyber-surface/90 border border-cyber-border hover:border-cyber-accent/50 hover:bg-cyber-surface text-xs font-medium text-slate-200 transition-all shadow-sm active:scale-95 text-left"
              >
                <Search className="w-4 h-4 text-cyber-cyan shrink-0" />
                <span>Reconnaissance & HTTP header inspection (127.0.0.1)</span>
              </button>

              <button
                onClick={() => sendMessage("Analyze this target 10.10.14.5 and find open services with Nmap")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyber-surface/90 border border-cyber-border hover:border-cyber-accent/50 hover:bg-cyber-surface text-xs font-medium text-slate-200 transition-all shadow-sm active:scale-95 text-left"
              >
                <Bot className="w-4 h-4 text-purple-400 shrink-0" />
                <span>Nmap Service Discovery on target 10.10.14.5</span>
              </button>
            </div>
          </div>
        )}

        {/* Message Items List */}
        <div className="divide-y divide-cyber-border/40">
          {messages.map((message) => (
            <ChatMessageItem key={message.id} message={message} />
          ))}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Dock */}
      <ChatInput />
    </div>
  );
};
