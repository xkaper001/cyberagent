import React from 'react';
import { useAssessment } from './lib/useAssessment';
import { TargetBar } from './components/TargetBar';
import { Trace } from './components/Trace';
import { Results } from './components/Results';

export const App: React.FC = () => {
  const { state, run, confirmAuth, reset } = useAssessment();
  const running = state.status === 'running';

  return (
    <div className="flex flex-col h-full bg-white text-ink-950">
      <TargetBar status={state.status} onRun={run} onReset={reset} />

      {state.status === 'awaiting-auth' && (
        <div className="border-b border-ink-950 bg-ink-950 text-white px-8 py-4 flex items-center justify-between gap-6">
          <div className="text-sm">
            <span className="font-mono text-xs tracking-wider text-ink-400">AUTHORIZATION</span>{' '}
            Confirm you are authorized to test{' '}
            <span className="font-mono font-medium">{state.auth?.target}</span>
            {state.auth?.ip && <span className="text-ink-400"> ({state.auth.ip})</span>}. No tool runs until you confirm.
          </div>
          <button onClick={confirmAuth} className="h-10 px-6 bg-white text-ink-950 text-sm font-medium hover:bg-ink-200 shrink-0">
            Confirm &amp; Run
          </button>
        </div>
      )}

      {state.status === 'error' && (
        <div className="border-b border-ink-200 px-8 py-3 text-sm font-mono">
          <span className="text-ink-400">ERROR </span>{state.error}
        </div>
      )}

      <main className="flex-1 grid grid-cols-[minmax(0,5fr)_minmax(0,7fr)] min-h-0">
        <Trace entries={state.trace} running={running} />
        <Results state={state} />
      </main>
    </div>
  );
};

export default App;
