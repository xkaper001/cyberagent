import React from 'react';
import { RunRecord } from '../../lib/runsStore';

const fmt = (iso: string) => new Date(iso).toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });

export const ReportsView: React.FC<{
  runs: RunRecord[];
  onOpen: (r: RunRecord) => void;
}> = ({ runs, onOpen }) => {
  const reported = runs.filter((r) => r.report || (r.risk != null && r.status === 'done'));
  return (
    <div className="h-full overflow-y-auto">
      <div className="px-10 py-8 border-b border-ink-300">
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-ink-500 mt-2">Generated from completed assessments. {reported.length} report{reported.length === 1 ? '' : 's'}.</p>
      </div>

      {reported.length === 0 ? (
        <p className="px-10 py-8 text-ink-400">No reports yet. Complete an assessment in the Console.</p>
      ) : (
        <div className="grid grid-cols-2 gap-px bg-ink-300 border-b border-ink-300">
          {reported.map((r) => {
            const active = r.findings.filter((f) => f.status !== 'rejected').length;
            return (
              <button key={r.id} onClick={() => onOpen(r)} className="text-left bg-white p-8 hover:bg-ink-50">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="font-mono text-sm font-medium truncate">{r.target}</div>
                    <div className="font-mono text-xs text-ink-400 mt-0.5">{fmt(r.startedAt)}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-3xl font-semibold tabular-nums leading-none">{r.risk != null ? r.risk.toFixed(1) : '—'}</div>
                    <div className="font-mono text-[10px] tracking-wider uppercase text-ink-500 mt-1">{r.report?.riskLevel || '—'}</div>
                  </div>
                </div>
                <p className="text-sm text-ink-600 mt-4 line-clamp-3">
                  {r.report?.executiveSummary || `${active} finding(s) identified.`}
                </p>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
