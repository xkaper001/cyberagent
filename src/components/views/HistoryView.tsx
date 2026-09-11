import React from 'react';
import { RunRecord } from '../../lib/runsStore';

const fmt = (iso: string) => new Date(iso).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

export const HistoryView: React.FC<{
  runs: RunRecord[];
  onOpen: (r: RunRecord) => void;
  onClear: () => void;
}> = ({ runs, onOpen, onClear }) => (
  <div className="h-full overflow-y-auto">
    <div className="px-10 py-8 border-b border-ink-300 flex items-end justify-between">
      <div>
        <h1 className="text-2xl font-semibold">Run History</h1>
        <p className="text-ink-500 mt-2">Past assessments from this browser. {runs.length} run{runs.length === 1 ? '' : 's'}.</p>
      </div>
      {runs.length > 0 && (
        <button onClick={onClear} className="h-10 px-4 border border-ink-300 text-sm hover:border-ink-950">Clear</button>
      )}
    </div>

    {runs.length === 0 ? (
      <p className="px-10 py-8 text-ink-400">No runs yet. Start one from the Console.</p>
    ) : (
      <table className="w-full">
        <thead>
          <tr className="text-left font-mono text-xs tracking-wider text-ink-400 border-b border-ink-300">
            <th className="px-10 py-3 font-normal">TARGET</th>
            <th className="py-3 font-normal">WHEN</th>
            <th className="py-3 font-normal">STATUS</th>
            <th className="py-3 font-normal text-right">RISK</th>
            <th className="py-3 pr-10 font-normal text-right">FINDINGS</th>
          </tr>
        </thead>
        <tbody>
          {runs.map((r) => {
            const active = r.findings.filter((f) => f.status !== 'rejected').length;
            return (
              <tr key={r.id} onClick={() => onOpen(r)} className="border-b border-ink-300 hover:bg-ink-50 cursor-pointer">
                <td className="px-10 py-4 font-mono text-sm font-medium">{r.target}</td>
                <td className="py-4 text-sm text-ink-500">{fmt(r.startedAt)}</td>
                <td className="py-4 font-mono text-xs uppercase tracking-wider text-ink-500">{r.status}</td>
                <td className="py-4 text-right font-mono text-sm tabular-nums">{r.risk != null ? r.risk.toFixed(1) : '—'}</td>
                <td className="py-4 pr-10 text-right font-mono text-sm tabular-nums">{active}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    )}
  </div>
);
