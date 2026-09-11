import React, { useState } from 'react';
import { RunStatus } from '../lib/useAssessment';

const STATUS_LABEL: Record<RunStatus, string> = {
  idle: 'READY', running: 'RUNNING', 'awaiting-auth': 'AUTH REQUIRED',
  done: 'COMPLETE', error: 'ERROR',
};

export const TargetBar: React.FC<{
  status: RunStatus;
  onRun: (target: string) => void;
  onReset: () => void;
}> = ({ status, onRun, onReset }) => {
  const [value, setValue] = useState('scanme.nmap.org');
  const busy = status === 'running';

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const t = value.trim();
    if (t && !busy) onRun(t);
  };

  return (
    <header className="border-b border-ink-200 bg-white">
      <div className="flex items-center gap-6 px-8 h-20">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-6 h-6 bg-ink-950" />
          <span className="font-mono text-xs tracking-[0.2em] font-semibold">CYBERAGENTS</span>
        </div>

        <form onSubmit={submit} className="flex items-center gap-3 flex-1 min-w-0">
          <span className="font-mono text-xs text-ink-400 shrink-0">TARGET</span>
          <input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={busy}
            placeholder="host, domain, or IP"
            className="flex-1 min-w-0 h-11 px-4 border border-ink-300 font-mono text-sm outline-none focus:border-ink-950 disabled:bg-ink-50 disabled:text-ink-400"
          />
          <button
            type="submit"
            disabled={busy}
            className="h-11 px-7 bg-ink-950 text-white text-sm font-medium tracking-wide hover:bg-ink-800 disabled:bg-ink-300 shrink-0"
          >
            {busy ? 'SCANNING…' : 'RUN'}
          </button>
          {(status === 'done' || status === 'error') && (
            <button type="button" onClick={onReset}
              className="h-11 px-5 border border-ink-300 text-sm hover:border-ink-950 shrink-0">
              New
            </button>
          )}
        </form>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`w-2 h-2 rounded-full ${busy ? 'bg-ink-950 animate-breathe' : status === 'error' ? 'bg-ink-950' : 'bg-ink-300'}`} />
          <span className="font-mono text-xs tracking-wider text-ink-600">{STATUS_LABEL[status]}</span>
        </div>
      </div>
    </header>
  );
};
