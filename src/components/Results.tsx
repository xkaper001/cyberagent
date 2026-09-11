import React, { useState } from 'react';
import { AssessmentState, Finding } from '../lib/useAssessment';

const pct = (v?: number | null) => Math.max(0, Math.min(100, ((v ?? 0) / 10) * 100));

const Bar: React.FC<{ value?: number | null }> = ({ value }) => (
  <div className="h-1.5 w-full bg-ink-200">
    <div className="h-full bg-ink-950" style={{ width: `${pct(value)}%` }} />
  </div>
);

const FindingRow: React.FC<{ f: Finding }> = ({ f }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-ink-300">
      <button onClick={() => setOpen((o) => !o)} className="w-full text-left px-8 py-4 hover:bg-ink-50 flex items-center gap-4">
        <span className="font-mono text-sm font-medium w-40 shrink-0">{f.cveId || '—'}</span>
        <span className="flex-1 min-w-0">
          <span className="flex items-center gap-3">
            <span className="font-mono text-sm tabular-nums w-8">{f.cvssScore?.toFixed(1) ?? '—'}</span>
            <span className="w-24"><Bar value={f.cvssScore} /></span>
            <span className="font-mono text-xs uppercase tracking-wider text-ink-500">{f.severity}</span>
          </span>
        </span>
        <span className="font-mono text-xs text-ink-400 w-40 shrink-0 text-right truncate">{f.targetIp}</span>
        <span className="font-mono text-xs text-ink-400 w-16 shrink-0 text-right">{f.confidence}%</span>
      </button>
      {open && (
        <div className="px-8 pb-6 pt-1 text-sm space-y-3 bg-ink-50">
          {f.impact && <p><span className="font-mono text-xs tracking-wider text-ink-400">IMPACT </span>{f.impact}</p>}
          {f.evidence?.length ? (
            <div>
              <div className="font-mono text-xs tracking-wider text-ink-400 mb-1">EVIDENCE</div>
              <ul className="space-y-1">{f.evidence.map((ev, i) => <li key={i} className="text-ink-700 pl-3 border-l-2 border-ink-300">{ev}</li>)}</ul>
            </div>
          ) : null}
          {f.remediation && <p><span className="font-mono text-xs tracking-wider text-ink-400">FIX </span>{f.remediation}</p>}
          {f.references?.length ? (
            <a href={f.references[0]} target="_blank" rel="noreferrer" className="inline-block font-mono text-xs underline underline-offset-2 break-all">{f.references[0]}</a>
          ) : null}
        </div>
      )}
    </div>
  );
};

export const Results: React.FC<{ state: AssessmentState }> = ({ state }) => {
  const { status, risk, findings, critic, report, finalText } = state;
  const [showReport, setShowReport] = useState(true);
  const active = findings.filter((f) => f.status !== 'rejected');

  return (
    <section className="flex flex-col h-full min-w-0 overflow-y-auto">
      {/* Risk header */}
      <div className="px-8 py-6 border-b border-ink-300">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="font-mono text-xs tracking-[0.15em] text-ink-500 mb-2">COMPOSITE RISK</div>
            <div className="flex items-baseline gap-2">
              <span className="text-6xl font-semibold tabular-nums leading-none">{risk != null ? risk.toFixed(1) : '—'}</span>
              <span className="text-2xl text-ink-400">/ 10</span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono text-sm uppercase tracking-wider">{report?.riskLevel || (status === 'running' ? '…' : '—')}</div>
            {critic && <div className="font-mono text-xs text-ink-400 mt-1">critic {Math.round((critic.confidence || 0) * 100)}% · {active.length} kept</div>}
          </div>
        </div>
        <div className="mt-4"><Bar value={risk} /></div>
      </div>

      {/* Findings */}
      <div className="border-b border-ink-300">
        <div className="px-8 py-4 flex items-center justify-between">
          <h2 className="font-mono text-xs tracking-[0.15em] text-ink-500">FINDINGS</h2>
          <span className="font-mono text-xs text-ink-400">{active.length}</span>
        </div>
        {active.length === 0 ? (
          <p className="px-8 pb-6 text-sm text-ink-400">
            {status === 'running' ? 'Correlating services against NVD…' : status === 'done' ? 'No CVEs matched the discovered services.' : 'Findings appear here as the run progresses.'}
          </p>
        ) : (
          <div>{active.slice().sort((a, b) => (b.cvssScore ?? 0) - (a.cvssScore ?? 0)).map((f) => <FindingRow key={f.id} f={f} />)}</div>
        )}
      </div>

      {/* Report */}
      {report && (
        <div>
          <button onClick={() => setShowReport((s) => !s)} className="w-full px-8 py-4 flex items-center justify-between hover:bg-ink-50">
            <h2 className="font-mono text-xs tracking-[0.15em] text-ink-500">REPORT</h2>
            <span className="font-mono text-xs text-ink-400">{showReport ? '−' : '+'}</span>
          </button>
          {showReport && (
            <div className="px-8 pb-8 space-y-5 text-sm">
              {report.executiveSummary && <p className="leading-relaxed">{report.executiveSummary}</p>}
              {report.attackSurface && (
                <div>
                  <div className="font-mono text-xs tracking-wider text-ink-400 mb-1">ATTACK SURFACE</div>
                  <p className="text-ink-700">{report.attackSurface}</p>
                </div>
              )}
              {report.remediationRoadmap?.length ? (
                <div>
                  <div className="font-mono text-xs tracking-wider text-ink-400 mb-2">REMEDIATION</div>
                  <ol className="space-y-2">
                    {report.remediationRoadmap.map((r, i) => (
                      <li key={i} className="flex gap-3"><span className="font-mono text-xs text-ink-400 mt-0.5">{String(i + 1).padStart(2, '0')}</span><span>{r}</span></li>
                    ))}
                  </ol>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}

      {!report && finalText && status === 'done' && (
        <div className="px-8 py-6 text-sm whitespace-pre-wrap text-ink-700">{finalText}</div>
      )}
    </section>
  );
};
