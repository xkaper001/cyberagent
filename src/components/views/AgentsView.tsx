import React from 'react';
import { TOOLBOX } from '../../lib/agents';

const KIND_LABEL: Record<string, string> = {
  recon: 'RECON', scan: 'SCAN', intel: 'INTEL', advisory: 'ADVISORY', control: 'CONTROL',
};

export const AgentsView: React.FC = () => (
  <div className="h-full overflow-y-auto">
    <div className="px-10 py-8 border-b border-ink-300">
      <h1 className="text-2xl font-semibold">Autonomous Agent</h1>
      <p className="text-ink-500 mt-2 max-w-2xl leading-relaxed">
        A single LLM-driven agent runs each assessment. It is given the toolbox below and decides
        entirely on its own which tools to call and in what order — reasoning between each step,
        adapting to what it finds, and recording findings when the evidence supports them. There is
        no fixed pipeline and no manual per-tool trigger. Watch its live decisions and tool calls in
        the Console trace.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <span className="font-mono text-xs border border-ink-300 px-3 py-1">Authorized targets only</span>
        <span className="font-mono text-xs border border-ink-300 px-3 py-1">No real exploitation</span>
        <span className="font-mono text-xs border border-ink-300 px-3 py-1">Scope enforced per tool call</span>
      </div>
    </div>

    <div className="px-10 py-8">
      <h2 className="font-mono text-xs tracking-[0.15em] text-ink-500 mb-5">TOOLBOX</h2>
      <div className="grid grid-cols-2 gap-px bg-ink-300 border border-ink-300">
        {TOOLBOX.map((t) => (
          <div key={t.name} className="bg-white p-6">
            <div className="flex items-baseline justify-between gap-3">
              <span className="font-mono text-sm font-semibold">{t.name}</span>
              <span className="font-mono text-[10px] tracking-wider text-ink-500 border border-ink-300 px-2 py-0.5">
                {KIND_LABEL[t.kind]}
              </span>
            </div>
            <p className="text-sm text-ink-600 mt-2">{t.role}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);
