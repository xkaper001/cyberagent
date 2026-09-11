import React, { useEffect, useRef } from 'react';
import { TraceEntry } from '../lib/useAssessment';

const Glyph: React.FC<{ status: TraceEntry['status'] }> = ({ status }) => {
  if (status === 'running') return <span className="w-2.5 h-2.5 rounded-full bg-ink-950 animate-breathe mt-1.5 shrink-0" />;
  if (status === 'blocked') return <span className="w-2.5 h-2.5 mt-1.5 shrink-0 flex items-center justify-center font-mono text-ink-950 text-sm leading-none">✕</span>;
  return <span className="w-2.5 h-2.5 rounded-full bg-ink-950 mt-1.5 shrink-0" />;
};

export const Trace: React.FC<{ entries: TraceEntry[]; running: boolean }> = ({ entries, running }) => {
  const end = useRef<HTMLDivElement>(null);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [entries.length]);

  return (
    <section className="flex flex-col h-full border-r border-ink-200 min-w-0">
      <div className="px-8 py-4 border-b border-ink-200">
        <h2 className="font-mono text-xs tracking-[0.15em] text-ink-500">AGENT TRACE</h2>
      </div>
      <div className="flex-1 overflow-y-auto px-8 py-6">
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
                  <div className="text-xs font-mono tracking-wider text-ink-400 mb-0.5">SUPERVISOR</div>
                  <div className="text-sm font-medium">{e.label}</div>
                  {e.sub && <div className="text-sm text-ink-500 mt-0.5">{e.sub}</div>}
                </div>
              ) : (
                <div>
                  <div className="flex items-baseline justify-between gap-3">
                    <span className={e.kind === 'tool' ? 'font-mono text-sm font-medium' : 'text-sm font-semibold'}>
                      {e.kind === 'tool' ? `$ ${e.label}` : e.label}
                    </span>
                    {e.meta && <span className="font-mono text-xs text-ink-400 shrink-0">{e.meta}</span>}
                  </div>
                  {e.sub && <div className="text-sm text-ink-500 mt-0.5 break-words">{e.sub}</div>}
                </div>
              )}
            </li>
          ))}
        </ol>
        <div ref={end} />
      </div>
    </section>
  );
};
