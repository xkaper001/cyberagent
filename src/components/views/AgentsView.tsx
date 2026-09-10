import React from 'react';
import { 
  Bot, 
  ShieldAlert, 
  Compass, 
  Radar, 
  Scan, 
  Bug, 
  BookOpen, 
  Activity, 
  CheckCircle2, 
  FileText,
  Wrench,
  Play,
  Zap
} from 'lucide-react';
import { useCyber } from '../../context/CyberContext';
import { AgentType } from '../../types/cyber';

export const AgentsView: React.FC = () => {
  const { agents, sendMessage, setCurrentView, addToast } = useCyber();

  const getAgentIcon = (type: AgentType) => {
    switch (type) {
      case 'supervisor': return <ShieldAlert className="w-5 h-5 text-cyber-accent" />;
      case 'planner': return <Compass className="w-5 h-5 text-cyber-cyan" />;
      case 'recon': return <Radar className="w-5 h-5 text-cyber-cyan" />;
      case 'scanning': return <Scan className="w-5 h-5 text-emerald-400" />;
      case 'vulnerability': return <Bug className="w-5 h-5 text-rose-400" />;
      case 'research': return <BookOpen className="w-5 h-5 text-purple-400" />;
      case 'risk': return <Activity className="w-5 h-5 text-amber-400" />;
      case 'critic': return <CheckCircle2 className="w-5 h-5 text-blue-400" />;
      case 'report': return <FileText className="w-5 h-5 text-emerald-400" />;
      default: return <Bot className="w-5 h-5 text-cyber-accent" />;
    }
  };

  const testAgent = (name: string) => {
    addToast('info', `Testing ${name} execution capabilities`);
    sendMessage(`Run execution diagnostic test for ${name} on authorized lab target 10.10.14.5.`);
    setCurrentView('chat');
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-cyber-bg p-6 space-y-6 select-none">
      {/* Header Banner */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Bot className="w-5 h-5 text-purple-400" />
            <span>Specialized Agentic AI Hub</span>
          </h2>
          <p className="text-xs text-cyber-muted">
            9 Autonomous security workers orchestrated behind CyberAgents conversational interface.
          </p>
        </div>

        <div className="px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-mono text-xs flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span>9 / 9 Agents Ready</span>
        </div>
      </div>

      {/* Agents Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {agents.map((ag) => (
          <div 
            key={ag.id}
            className="p-6 rounded-2xl bg-cyber-card border border-cyber-border hover:border-cyber-accent/40 shadow-cyber transition-all space-y-4 flex flex-col justify-between group"
          >
            <div className="space-y-3">
              {/* Top Row: Icon, Name & Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyber-surface border border-cyber-border group-hover:border-cyber-accent/40 flex items-center justify-center transition-colors">
                    {getAgentIcon(ag.type)}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-100 group-hover:text-cyber-accent transition-colors">
                      {ag.name}
                    </h3>
                    <span className="text-[10px] text-cyber-muted font-mono">{ag.executionsCount} Runs Completed</span>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  {ag.status}
                </span>
              </div>

              {/* Purpose */}
              <p className="text-xs text-cyber-muted leading-relaxed">
                {ag.purpose}
              </p>

              {/* Tools Available */}
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-semibold text-cyber-subtle uppercase tracking-wider flex items-center gap-1">
                  <Wrench className="w-3 h-3 text-cyber-accent" />
                  <span>Assigned Tools</span>
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ag.tools.map((t, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-cyber-surface border border-cyber-border text-[10px] font-mono text-slate-300">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Card Footer Action */}
            <div className="pt-4 border-t border-cyber-border/60 flex items-center justify-between">
              <span className="text-[10px] text-cyber-subtle font-mono">Last activity: {ag.lastActivity}</span>
              <button
                onClick={() => testAgent(ag.name)}
                className="px-3 py-1.5 rounded-lg bg-cyber-surface border border-cyber-border hover:border-cyber-accent/40 text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-cyber-accent" />
                <span>Test Agent</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
