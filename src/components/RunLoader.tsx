import React, { useEffect, useState } from 'react';
import { TraceEntry } from '../lib/useAssessment';

const label = (entries: TraceEntry[]): string => {
  const active = [...entries].reverse().find((e) => e.status === 'running');
  if (active) {
    return active.kind === 'tool'
      ? `Running ${active.label}${active.sub ? ` — ${active.sub}` : ''}`
      : `${active.label} working`;
  }
  return entries.length ? 'Agent reasoning about the next step' : 'Contacting the agent';
};

export const RunLoader: React.FC<{ entries: TraceEntry[] }> = ({ entries }) => {
  const [secs, setSecs] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setSecs((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="border-b border-ink-300 bg-ink-50" role="status" aria-live="polite">
      <div className="h-0.5 bg-ink-200 overflow-hidden">
        <div className="h-full w-1/3 bg-ink-950 animate-sweep" />
      </div>
      <div className="flex items-center gap-3 px-8 py-2.5">
        <span className="w-2 h-2 rounded-full bg-ink-950 animate-breathe shrink-0" />
        <span className="font-mono text-xs tracking-[0.12em] text-ink-500 shrink-0">LLM WORKING</span>
        <span className="text-sm text-ink-600 truncate">{label(entries)}</span>
        <span className="font-mono text-xs text-ink-400 ml-auto shrink-0 tabular-nums">{secs}s</span>
      </div>
    </div>
  );
};
