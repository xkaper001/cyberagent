import React, { useEffect, useRef, useState } from 'react';
import { TraceEntry } from '../lib/useAssessment';
import { Md } from './Md';

const Glyph: React.FC<{ status: TraceEntry['status'] }> = ({ status }) => {
  if (status === 'running') return <span className="w-2.5 h-2.5 rounded-full bg-ink-950 animate-breathe mt-1.5 shrink-0" />;
  if (status === 'blocked') return <span className="w-2.5 h-2.5 mt-1 shrink-0 flex items-center justify-center font-mono text-ink-950 text-sm leading-none">✕</span>;
  return <span className="w-2.5 h-2.5 rounded-full bg-ink-950 mt-1.5 shrink-0" />;
};

const Tag: React.FC<{ label: string; solid?: boolean }> = ({ label, solid }) => (
  <span className={`font-mono text-[10px] tracking-[0.12em] px-1.5 py-0.5 ${solid ? 'bg-ink-950 text-white' : 'border border-ink-300 text-ink-500'}`}>
    {label}
  </span>
);

const Io: React.FC<{ label: string; body: string }> = ({ label, body }) => (
  <div className="mt-2">
    <div className="font-mono text-[10px] tracking-[0.12em] text-ink-400">{label}</div>
    <pre className="font-mono text-xs text-ink-600 mt-1 whitespace-pre-wrap break-words bg-ink-50 border border-ink-200 px-2 py-1 max-h-64 overflow-y-auto">{body}</pre>
  </div>
);

const ToolEntry: React.FC<{ entry: TraceEntry }> = ({ entry: e }) => {
  const [open, setOpen] = useState(false);
  const expandable = Boolean(e.input || e.output);
  return (
    <div>
      <button
        type="button"
        disabled={!expandable}
        onClick={() => setOpen((v) => !v)}
        className={`w-full text-left ${expandable ? 'cursor-pointer' : 'cursor-default'}`}
        aria-expanded={open}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Tag label="TOOL CALL" solid />
            <span className="font-mono text-sm font-medium truncate">{e.label}</span>
            {e.status === 'blocked' && <span className="font-mono text-[10px] tracking-wider text-ink-500 border border-ink-300 px-1.5 py-0.5">BLOCKED</span>}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {e.meta && <span className="font-mono text-xs text-ink-400">{e.meta}</span>}
            {expandable && <span className="font-mono text-[10px] text-ink-400">{open ? 'HIDE I/O' : 'SHOW I/O'}</span>}
          </div>
        </div>
        {e.sub && <div className="font-mono text-xs text-ink-500 mt-1.5 break-words bg-ink-50 border border-ink-200 px-2 py-1">{e.sub}</div>}
      </button>
      {open && e.input && <Io label="INPUT" body={e.input} />}
      {open && e.output && <Io label="OUTPUT" body={e.output} />}
    </div>
  );
};

export const Trace: React.FC<{ entries: TraceEntry[]; running: boolean }> = ({ entries, running }) => {
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    requestAnimationFrame(() => { el.scrollTop = el.scrollHeight; });
  }, [entries]);

  return (
    <section className="flex flex-col h-full min-h-0 border-r border-ink-300 min-w-0">
      <div className="px-8 py-4 border-b border-ink-300 shrink-0">
        <h2 className="font-mono text-xs tracking-[0.15em] text-ink-500">AGENT TRACE</h2>
      </div>
      <div ref={scroller} className="flex-1 min-h-0 overflow-y-auto px-8 py-6">
        {entries.length === 0 && !running && (
          <p className="text-ink-400 text-sm">No activity yet. Enter a target and run an assessment.</p>
        )}
        <ol className="relative">
          {entries.map((e, i) => (
            <li key={e.key} className="relative pl-6 pb-6 animate-slideUp">
              {i < entries.length - 1 && <span className="absolute left-[4px] top-4 bottom-0 w-px bg-ink-200" />}
              <div className="absolute left-0 top-0"><Glyph status={e.status} /></div>

              {e.kind === 'note' ? (
                <div>
                  <Tag label="SUPERVISOR" />
                  <div className="text-sm font-medium mt-1.5">{e.label}</div>
                  {e.sub && <div className="text-sm text-ink-500 mt-0.5">{e.sub}</div>}
                </div>
              ) : e.kind === 'tool' ? (
                <ToolEntry entry={e} />
              ) : (
                <div>
                  <div className="flex items-center justify-between gap-3">
                    <Tag label="THINKING" />
                    {e.meta && <span className="font-mono text-xs text-ink-400 shrink-0">{e.meta}</span>}
                  </div>
                  <div className="mt-1.5"><Md text={e.sub || e.label} /></div>
                </div>
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
};
