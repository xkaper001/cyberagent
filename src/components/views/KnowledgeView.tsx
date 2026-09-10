import React, { useState } from 'react';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  ExternalLink, 
  ShieldCheck, 
  Cpu, 
  Tag, 
  CheckCircle2
} from 'lucide-react';
import { useCyber } from '../../context/CyberContext';

export const KnowledgeView: React.FC = () => {
  const { knowledgeItems, sendMessage, setCurrentView } = useCyber();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const filteredKnowledge = knowledgeItems.filter(k => {
    const matchesSearch = k.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          k.summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          k.affectedTech.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          k.cveId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = categoryFilter === 'all' || k.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchesSearch && matchesCat;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-y-auto bg-cyber-bg p-6 space-y-6 select-none">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-amber-400" />
            <span>Security Intelligence & CVE Knowledge Base</span>
          </h2>
          <p className="text-xs text-cyber-muted">
            Specialized threat intelligence integrated directly with CyberAgents reasoning engine.
          </p>
        </div>

        {/* AI RAG Indicator Pill */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-cyber-accent/15 border border-cyber-accent/30 text-cyber-accent text-xs font-mono">
          <Sparkles className="w-4 h-4 animate-spin" />
          <span>RAG Retrieval Active in Copilot</span>
        </div>
      </div>

      {/* Search & Category Pills */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search CVE-2021-41773, OWASP, MITRE T1059, Spring..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-cyber-surface border border-cyber-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-cyber-muted focus:outline-none focus:border-cyber-accent"
          />
          <Search className="w-4 h-4 text-cyber-muted absolute left-3.5 top-3" />
        </div>

        {/* Categories */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {['all', 'OWASP', 'MITRE ATT&CK', 'CWE', 'CVE', 'Research'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                categoryFilter === cat
                  ? 'bg-cyber-accent/20 border border-cyber-accent text-slate-100 font-bold'
                  : 'bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Knowledge Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredKnowledge.map((k) => (
          <div 
            key={k.id}
            className="p-6 rounded-2xl bg-cyber-card border border-cyber-border hover:border-cyber-accent/40 shadow-cyber transition-all space-y-4 flex flex-col justify-between group"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                  k.severity === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                  k.severity === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                  'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                }`}>
                  {k.severity}
                </span>

                <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-cyber-surface border border-cyber-border text-cyber-accent font-semibold">
                  {k.category}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-100 group-hover:text-cyber-accent transition-colors">
                {k.title}
              </h3>

              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
                <Cpu className="w-3.5 h-3.5 text-cyber-cyan" />
                <span>Affected: {k.affectedTech}</span>
              </div>

              <p className="text-xs text-cyber-muted leading-relaxed">
                {k.summary}
              </p>
            </div>

            {/* Remediation Note & Action */}
            <div className="pt-4 border-t border-cyber-border/60 space-y-3">
              <div className="p-2.5 rounded-lg bg-cyber-bg border border-cyber-border/80 text-[11px] font-mono text-emerald-400">
                <span className="font-bold text-slate-300 block mb-0.5">Remediation:</span>
                {k.remediation}
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[10px] text-cyber-subtle font-mono">Source: {k.source}</span>
                <button
                  onClick={() => {
                    sendMessage(`Query security intelligence regarding ${k.cveId || k.title}. How does CyberAgents protect against this vector?`);
                    setCurrentView('chat');
                  }}
                  className="text-xs text-cyber-accent hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Ask Copilot</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
