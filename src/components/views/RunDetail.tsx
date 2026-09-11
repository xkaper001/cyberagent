import React from 'react';
import { RunRecord } from '../../lib/runsStore';
import { Trace } from '../Trace';
import { Results } from '../Results';
import { ArrowLeft } from 'lucide-react';

export const RunDetail: React.FC<{ run: RunRecord; onBack: () => void }> = ({ run, onBack }) => (
  <div className="flex flex-col h-full min-w-0">
    <div className="h-20 flex items-center gap-4 px-8 border-b border-ink-300">
      <button onClick={onBack} className="w-9 h-9 border border-ink-300 flex items-center justify-center hover:border-ink-950 shrink-0">
        <ArrowLeft className="w-4 h-4" />
      </button>
      <div className="min-w-0">
        <div className="font-mono text-sm font-medium truncate">{run.target}</div>
        <div className="font-mono text-xs text-ink-400">{new Date(run.startedAt).toLocaleString()}</div>
      </div>
    </div>
    <div className="flex-1 grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] min-h-0">
      <Trace entries={run.trace} running={false} />
      <Results state={run} />
    </div>
  </div>
);
