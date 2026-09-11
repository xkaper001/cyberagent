import { AssessmentState } from './useAssessment';

const KEY = 'cyberagents.runs.v1';
const CAP = 50;

export type RunRecord = AssessmentState & { id: string; startedAt: string };

export function loadRuns(): RunRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

export function saveRun(state: AssessmentState): RunRecord[] {
  if (!state.id) return loadRuns();
  const rec: RunRecord = { ...state, id: state.id, startedAt: state.startedAt || new Date().toISOString() };
  const runs = [rec, ...loadRuns().filter((r) => r.id !== rec.id)].slice(0, CAP);
  try { localStorage.setItem(KEY, JSON.stringify(runs)); } catch { /* quota / disabled */ }
  return runs;
}

export function clearRuns(): RunRecord[] {
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  return [];
}
