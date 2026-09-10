import React, { useState } from 'react';
import { 
  Bug, 
  Search, 
  Filter, 
  Server, 
  ChevronRight, 
  ShieldAlert, 
  ArrowUpDown,
  CheckCircle2
} from 'lucide-react';
import { useCyber } from '../../context/CyberContext';
import { Finding, Severity, FindingStatus } from '../../types/cyber';
import { FindingDetailDrawer } from './FindingDetailDrawer';

export const FindingsView: React.FC = () => {
  const { findings, selectedFinding, setSelectedFinding } = useCyber();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredFindings = findings.filter(f => {
    const matchesSearch = f.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          f.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          f.cveId?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSeverity = severityFilter === 'all' || f.severity === severityFilter;
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchesSearch && matchesSeverity && matchesStatus;
  });

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-cyber-bg p-6 space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Bug className="w-5 h-5 text-rose-400" />
            <span>Discovered Vulnerabilities & Findings</span>
          </h2>
          <p className="text-xs text-cyber-muted">
            Correlated evidence captured across automated multi-agent assessments.
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <input
            type="text"
            placeholder="Search findings, CVEs, assets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-cyber-surface border border-cyber-border rounded-lg pl-9 pr-4 py-2 text-xs text-slate-100 placeholder-cyber-muted focus:outline-none focus:border-cyber-accent"
          />
          <Search className="w-4 h-4 text-cyber-muted absolute left-3 top-2.5" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-cyber-surface/70 border border-cyber-border text-xs">
        <div className="flex items-center gap-1.5 text-cyber-subtle font-semibold uppercase text-[10px] tracking-wider">
          <Filter className="w-3.5 h-3.5" />
          <span>Filters:</span>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1">
          {['all', 'critical', 'high', 'medium', 'low', 'info'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded-md capitalize text-[11px] font-medium transition-all ${
                severityFilter === sev
                  ? 'bg-cyber-accent/20 border border-cyber-accent text-slate-100 font-bold'
                  : 'bg-cyber-bg text-cyber-muted hover:text-slate-200 border border-transparent'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-cyber-border mx-1" />

        {/* Status Filter */}
        <div className="flex items-center gap-1">
          {['all', 'active', 'investigating', 'remediated'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded-md capitalize text-[11px] font-medium transition-all ${
                statusFilter === st
                  ? 'bg-cyber-accent/20 border border-cyber-accent text-slate-100 font-bold'
                  : 'bg-cyber-bg text-cyber-muted hover:text-slate-200 border border-transparent'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Findings Data Table & Cards */}
      <div className="flex-1 overflow-y-auto rounded-xl border border-cyber-border bg-cyber-card shadow-cyber">
        {filteredFindings.length > 0 ? (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-cyber-border bg-cyber-surface/60 text-cyber-subtle text-[10px] font-semibold uppercase tracking-wider">
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Finding Title</th>
                <th className="py-3 px-4">Target Asset</th>
                <th className="py-3 px-4">Confidence</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cyber-border/60">
              {filteredFindings.map((f) => (
                <tr 
                  key={f.id}
                  onClick={() => setSelectedFinding(f)}
                  className="hover:bg-cyber-surface/60 cursor-pointer transition-colors group"
                >
                  {/* Severity */}
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      f.severity === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                      f.severity === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                      'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                    }`}>
                      {f.severity}
                    </span>
                  </td>

                  {/* Title */}
                  <td className="py-3.5 px-4 font-semibold text-slate-100 group-hover:text-cyber-accent transition-colors">
                    <div className="flex flex-col">
                      <span>{f.title}</span>
                      <span className="text-[10px] text-cyber-muted font-mono">{f.cveId || f.category}</span>
                    </div>
                  </td>

                  {/* Asset */}
                  <td className="py-3.5 px-4 text-slate-300 font-mono text-[11px] whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <Server className="w-3.5 h-3.5 text-cyber-cyan shrink-0" />
                      <span>{f.asset}</span>
                    </div>
                  </td>

                  {/* Confidence */}
                  <td className="py-3.5 px-4 whitespace-nowrap font-mono text-[11px] text-emerald-400">
                    {f.confidence}%
                  </td>

                  {/* Status */}
                  <td className="py-3.5 px-4 whitespace-nowrap capitalize text-cyber-muted font-mono text-[11px]">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        f.status === 'active' ? 'bg-rose-400' : 'bg-amber-400'
                      }`} />
                      {f.status}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button className="text-cyber-accent hover:underline flex items-center gap-1 ml-auto text-xs font-medium">
                      <span>Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="py-16 text-center text-cyber-muted text-xs space-y-2">
            <ShieldAlert className="w-8 h-8 text-cyber-subtle mx-auto" />
            <p>No findings match search or filter criteria.</p>
          </div>
        )}
      </div>

      {/* Slide-over Detail Drawer */}
      <FindingDetailDrawer 
        finding={selectedFinding} 
        onClose={() => setSelectedFinding(null)} 
      />
    </div>
  );
};
