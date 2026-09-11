import React from 'react';
import { PIPELINE } from '../../lib/agents';

export const AgentsView: React.FC = () => (
  <div className="h-full overflow-y-auto">
    <div className="px-10 py-8 border-b border-ink-200">
      <h1 className="text-2xl font-semibold">Agent Pipeline</h1>
      <p className="text-ink-500 mt-2 max-w-2xl">
        Nine specialized agents run in sequence on every assessment. Each hands its state to the next —
        recon and scanning gather real tool output, research and vulnerability map it to NVD, and the
        critic, risk, and report agents turn it into a verified result. There is no manual per-agent
        trigger; running an assessment in the Console executes the whole chain.
      </p>
    </div>

    <ol className="px-10 py-8 max-w-4xl">
      {PIPELINE.map((a, i) => (
        <li key={a.type} className="relative pl-12 pb-8 last:pb-0">
          {i < PIPELINE.length - 1 && <span className="absolute left-[15px] top-9 bottom-0 w-px bg-ink-200" />}
          <div className="absolute left-0 top-0 w-8 h-8 border border-ink-950 flex items-center justify-center font-mono text-xs font-semibold">
            {a.order}
          </div>
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-base font-semibold">{a.name} Agent</h2>
            <span className="font-mono text-[10px] tracking-wider text-ink-500 border border-ink-300 px-2 py-0.5">
              {a.live ? 'LIVE' : 'STUB'}
            </span>
          </div>
          <p className="text-sm text-ink-600 mt-1">{a.role}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {a.tools.map((t) => (
              <span key={t} className="font-mono text-xs text-ink-500 bg-ink-100 px-2 py-0.5">{t}</span>
            ))}
          </div>
        </li>
      ))}
    </ol>
  </div>
);
