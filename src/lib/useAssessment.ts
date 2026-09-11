import { useCallback, useRef, useState } from 'react';

const BASE = (import.meta as any).env?.VITE_API_BASE_URL || '/api';

export type RunStatus = 'idle' | 'running' | 'awaiting-auth' | 'done' | 'error';

export interface TraceEntry {
  key: string;
  kind: 'agent' | 'tool' | 'note';
  label: string;
  sub?: string;
  status: 'running' | 'done' | 'blocked';
  meta?: string;
}

export interface Finding {
  id: string;
  cveId?: string | null;
  title: string;
  severity: string;
  cvssScore?: number | null;
  confidence: number;
  targetIp: string;
  status: string;
  evidence?: string[];
  impact?: string;
  remediation?: string;
  references?: string[];
}

export interface Report {
  riskLevel?: string;
  attackSurface?: string;
  executiveSummary?: string;
  remediationRoadmap?: string[];
  findingsSummary?: Record<string, number>;
}

export interface AssessmentState {
  status: RunStatus;
  target: string;
  trace: TraceEntry[];
  findings: Finding[];
  critic?: { status: string; confidence: number; summary: string };
  risk?: number;
  report?: Report | null;
  finalText?: string;
  auth?: { target: string; ip: string };
  error?: string;
}

const empty = (target: string): AssessmentState => ({
  status: 'running', target, trace: [], findings: [],
});

export function useAssessment() {
  const [state, setState] = useState<AssessmentState>({ status: 'idle', target: '', trace: [], findings: [] });
  const ids = useRef<{ conv?: string; asm?: string }>({});

  const upsert = (prev: TraceEntry[], e: TraceEntry): TraceEntry[] => {
    const i = prev.findIndex((x) => x.key === e.key);
    if (i === -1) return [...prev, e];
    const next = [...prev];
    next[i] = { ...next[i], ...e };
    return next;
  };

  const stream = useCallback(async (message: string, target: string) => {
    setState(empty(target));
    let acc: string[] = [];
    try {
      const resp = await fetch(`${BASE}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/event-stream' },
        body: JSON.stringify({ message, conversation_id: ids.current.conv, assessment_id: ids.current.asm }),
      });
      if (!resp.ok || !resp.body) throw new Error(`HTTP ${resp.status}`);

      const reader = resp.body.getReader();
      const dec = new TextDecoder('utf-8');
      let buf = '';
      let sawAuth = false;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split('\n');
        buf = lines.pop() || '';
        for (const line of lines) {
          const t = line.trim();
          if (!t.startsWith('data:')) continue;
          const raw = t.slice(5).trim();
          if (!raw || raw === '[DONE]') continue;
          let e: any;
          try { e = JSON.parse(raw); } catch { continue; }

          switch (e.event) {
            case 'message_start':
              ids.current.conv = e.conversation_id;
              ids.current.asm = e.assessment_id;
              break;
            case 'supervisor_decision':
              setState((s) => ({ ...s, trace: upsert(s.trace, { key: `note-${s.trace.length}`, kind: 'note', label: e.decision, sub: e.reason, status: 'done' }) }));
              break;
            case 'agent_step': {
              const st = e.step;
              setState((s) => ({ ...s, trace: upsert(s.trace, {
                key: st.id, kind: 'agent', label: st.agentName, sub: st.summary,
                status: st.status === 'completed' ? 'done' : 'running', meta: st.duration,
              }) }));
              break;
            }
            case 'tool_started':
              setState((s) => ({ ...s, trace: upsert(s.trace, { key: e.tool_id, kind: 'tool', label: e.tool, sub: e.target, status: 'running' }) }));
              break;
            case 'tool_completed':
              setState((s) => ({ ...s, trace: upsert(s.trace, {
                key: e.tool_id, kind: 'tool', label: e.tool, sub: e.target,
                status: e.status === 'blocked' ? 'blocked' : 'done', meta: e.duration,
              }) }));
              break;
            case 'finding_created':
              setState((s) => (s.findings.some((f) => f.id === e.finding.id) ? s : { ...s, findings: [...s.findings, e.finding] }));
              break;
            case 'critic_result':
              setState((s) => ({ ...s, critic: { status: e.status, confidence: e.confidence, summary: e.summary } }));
              break;
            case 'authorization_requested':
              sawAuth = true;
              setState((s) => ({ ...s, status: 'awaiting-auth', auth: { target: e.target, ip: e.target_ip } }));
              break;
            case 'message_delta':
              acc.push(e.delta || '');
              break;
            case 'message_complete':
              setState((s) => ({
                ...s,
                status: sawAuth ? s.status : 'done',
                findings: e.findings?.length ? e.findings : s.findings,
                report: e.report ?? s.report,
                risk: e.riskScore ?? s.risk,
                finalText: e.content || acc.join(''),
              }));
              break;
          }
        }
      }
    } catch (err: any) {
      setState((s) => ({ ...s, status: 'error', error: err?.message || String(err) }));
    }
  }, []);

  const run = useCallback((target: string) => {
    ids.current = {};
    stream(`Run a full security assessment and scan of ${target}. I am authorized to test this target.`, target);
  }, [stream]);

  const confirmAuth = useCallback(() => {
    const target = state.auth?.target || state.target;
    setState((s) => ({ ...s, status: 'running' }));
    stream(`Yes, I confirm I am authorized to perform security testing against ${target}. Proceed with the scan.`, target);
  }, [state.auth, state.target, stream]);

  const reset = useCallback(() => { ids.current = {}; setState({ status: 'idle', target: '', trace: [], findings: [] }); }, []);

  return { state, run, confirmAuth, reset };
}
