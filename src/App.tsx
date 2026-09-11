import React, { useEffect, useRef, useState } from 'react';
import { useAssessment } from './lib/useAssessment';
import { loadRuns, saveRun, clearRuns, RunRecord } from './lib/runsStore';
import { Sidebar, ViewId } from './components/Sidebar';
import { ConsoleView } from './components/views/ConsoleView';
import { AgentsView } from './components/views/AgentsView';
import { ReportsView } from './components/views/ReportsView';
import { HistoryView } from './components/views/HistoryView';
import { RunDetail } from './components/views/RunDetail';

export const App: React.FC = () => {
  const { state, run, confirmAuth, reset } = useAssessment();
  const [view, setView] = useState<ViewId>('console');
  const [runs, setRuns] = useState<RunRecord[]>(() => loadRuns());
  const [opened, setOpened] = useState<RunRecord | null>(null);
  const saved = useRef<Set<string>>(new Set());

  useEffect(() => {
    if ((state.status === 'done' || state.status === 'error') && state.id && !saved.current.has(state.id)) {
      saved.current.add(state.id);
      setRuns(saveRun(state));
    }
  }, [state.status, state.id]);

  const goTo = (v: ViewId) => { setOpened(null); setView(v); };
  const openRun = (r: RunRecord) => setOpened(r);

  const runFromConsole = (t: string) => { setOpened(null); run(t); };

  const body = () => {
    if (opened && (view === 'reports' || view === 'history')) {
      return <RunDetail run={opened} onBack={() => setOpened(null)} />;
    }
    switch (view) {
      case 'agents': return <AgentsView />;
      case 'reports': return <ReportsView runs={runs} onOpen={openRun} />;
      case 'history': return <HistoryView runs={runs} onOpen={openRun} onClear={() => { setRuns(clearRuns()); }} />;
      default:
        return <ConsoleView state={state} onRun={runFromConsole} onConfirm={confirmAuth} onReset={reset} />;
    }
  };

  return (
    <div className="flex h-full bg-white text-ink-950">
      <Sidebar view={view} onChange={goTo} runCount={runs.length} />
      <main className="flex-1 min-w-0">{body()}</main>
    </div>
  );
};

export default App;
