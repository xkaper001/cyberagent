import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Terminal as TerminalIcon,
  RotateCcw,
  Copy,
  Check,
  Square,
  Info,
  CheckCircle2,
  XCircle,
  Play,
  AlertTriangle,
  Activity
} from 'lucide-react';

interface WorkspaceTerminalProps {
  assessmentId: string;
}

interface ToolCapability {
  installed: boolean;
  available: boolean;
  version: string | null;
}

interface CapabilityState {
  sandbox: string;
  display_status?: string;
  unavailable_reason?: string;
  is_linux_sandbox?: boolean;
  container: string;
  dev_host_shell?: string;
  mode: string;
  docker_active: boolean;
  python: boolean;
  curl: boolean;
  openssl: boolean;
  dig: boolean;
  nmap: boolean;
  tools?: Record<string, ToolCapability>;
  runtime?: {
    uname?: string;
    user_id?: string;
    pwd?: string;
    os_release?: string;
  };
}

// ─── ANSI → plain text strip (for copy/logs) ─────────────────────────────────
function stripAnsi(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/\x1b\[[0-9;?]*[A-Za-z]/g, '').replace(/\x1b\][^\x07]*\x07/g, '');
}

// ─── ANSI → styled spans renderer ─────────────────────────────────────────────
type AnsiSpan = { text: string; style: React.CSSProperties; className: string };

const ANSI_COLORS: Record<number, string> = {
  30: '#4a5568', 31: '#fc8181', 32: '#68d391', 33: '#f6e05e',
  34: '#63b3ed', 35: '#b794f4', 36: '#76e4f7', 37: '#e2e8f0',
  90: '#718096', 91: '#ff6b6b', 92: '#48bb78', 93: '#d69e2e',
  94: '#4299e1', 95: '#9f7aea', 96: '#0bc5ea', 97: '#ffffff',
};

function ansiToSpans(raw: string): AnsiSpan[] {
  const spans: AnsiSpan[] = [];
  let currentStyle: React.CSSProperties = {};
  let currentClass = '';
  // eslint-disable-next-line no-control-regex
  const parts = raw.split(/(\x1b\[[0-9;?]*[A-Za-z])/);

  for (const part of parts) {
    // eslint-disable-next-line no-control-regex
    if (/^\x1b\[/.test(part)) {
      const seq = part.slice(2, -1);
      const cmd = part.slice(-1);
      if (cmd === 'm') {
        const codes = seq.split(';').map(Number);
        for (const code of codes) {
          if (code === 0) { currentStyle = {}; currentClass = ''; }
          else if (code === 1) currentStyle = { ...currentStyle, fontWeight: 'bold' };
          else if (code === 2) currentStyle = { ...currentStyle, opacity: 0.6 };
          else if (code === 3) currentStyle = { ...currentStyle, fontStyle: 'italic' };
          else if (code === 4) currentStyle = { ...currentStyle, textDecoration: 'underline' };
          else if (ANSI_COLORS[code]) currentStyle = { ...currentStyle, color: ANSI_COLORS[code] };
          else if (code >= 40 && code <= 47) { /* bg colors — skip */ }
        }
      }
      // Ignore cursor movement / other sequences
    } else if (part) {
      spans.push({ text: part, style: { ...currentStyle }, className: currentClass });
    }
  }
  return spans;
}

function TerminalLine({ raw }: { raw: string }) {
  const spans = ansiToSpans(raw);
  if (spans.length === 0) return null;
  return (
    <span>
      {spans.map((s, i) => (
        <span key={i} style={s.style}>{s.text}</span>
      ))}
    </span>
  );
}

import { ToolManagerModal } from './ToolManagerModal';

export const WorkspaceTerminal: React.FC<WorkspaceTerminalProps> = ({ assessmentId }) => {
  const [outputChunks, setOutputChunks] = useState<string[]>([]);
  const [inputVal, setInputVal] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);
  const [isConnected, setIsConnected] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showEnvPanel, setShowEnvPanel] = useState(true);
  const [isToolModalOpen, setIsToolModalOpen] = useState(false);
  const [capabilities, setCapabilities] = useState<CapabilityState | null>(null);
  const [capLoading, setCapLoading] = useState(true);
  const [capError, setCapError] = useState<string | null>(null);

  const socketRef = useRef<WebSocket | null>(null);
  const terminalEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // ── Fetch real capabilities from backend ─────────────────────────────────
  const fetchCapabilities = useCallback(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000';
    fetch(`${apiBase}/api/capabilities`)
      .then((res) => res.json())
      .then((data) => {
        setCapabilities(data as CapabilityState);
        setCapLoading(false);
      })
      .catch((err) => {
        setCapError('Backend unreachable');
        setCapLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchCapabilities();
  }, [fetchCapabilities]);


  // ── WebSocket connection ─────────────────────────────────────────────────
  useEffect(() => {
    const apiBase = import.meta.env.VITE_API_BASE_URL?.replace('/api', '') || 'http://localhost:8000';
    const wsBase = apiBase.replace(/^http/, 'ws');
    const wsUrl = `${wsBase}/api/workspace/${assessmentId || 'default_assessment'}/terminal`;

    const ws = new WebSocket(wsUrl);
    socketRef.current = ws;

    ws.onopen = () => setIsConnected(true);

    ws.onmessage = (event) => {
      setOutputChunks((prev) => [...prev, event.data as string]);
    };

    ws.onclose = () => {
      setIsConnected(false);
      setOutputChunks((prev) => [...prev, '\r\n[Disconnected from Sandbox Terminal]\r\n']);
    };

    ws.onerror = () => setIsConnected(false);

    return () => ws.close();
  }, [assessmentId]);

  // ── Auto-scroll ──────────────────────────────────────────────────────────
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [outputChunks]);

  // ── Command submit ────────────────────────────────────────────────────────
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) return;
    if (inputVal.trim()) {
      setCommandHistory((prev) => [...prev, inputVal]);
      setHistoryIndex(-1);
    }
    socketRef.current.send(inputVal + '\r\n');
    setInputVal('');
  };

  const handleStopProcess = () => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({ type: 'stop' }));
      socketRef.current.send('\x03');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const nextIdx = Math.min(historyIndex + 1, commandHistory.length - 1);
        setHistoryIndex(nextIdx);
        setInputVal(commandHistory[commandHistory.length - 1 - nextIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIdx = historyIndex - 1;
        setHistoryIndex(nextIdx);
        setInputVal(commandHistory[commandHistory.length - 1 - nextIdx]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setInputVal('');
      }
    } else if (e.ctrlKey && e.key === 'c') {
      handleStopProcess();
    }
  };

  const handleCopyLogs = () => {
    const fullLog = stripAnsi(outputChunks.join(''));
    navigator.clipboard.writeText(fullLog);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => setOutputChunks([]);

  // ── Tool indicator helper ────────────────────────────────────────────────
  const ToolPill = ({ name, available }: { name: string; available: boolean }) => (
    <span className={`flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded border ${
      available
        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
        : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
    }`}>
      {available
        ? <CheckCircle2 className="w-2.5 h-2.5 shrink-0" />
        : <XCircle className="w-2.5 h-2.5 shrink-0" />}
      {name}
    </span>
  );

  return (
    <div className="flex flex-col h-full bg-[#0d1117] text-slate-100 font-mono text-xs border border-cyber-border rounded-xl overflow-hidden shadow-2xl">
      {/* ── Toolbar ─────────────────────────────────────────────────────── */}
      <div className="px-3 py-2 bg-cyber-surface/90 border-b border-cyber-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <TerminalIcon className="w-3.5 h-3.5 text-cyber-accent" />
          <span className="font-bold text-slate-200 text-[11px] tracking-wider">CYBERAGENTS SANDBOX TERMINAL</span>
        </div>

        <div className="flex items-center gap-3">
          {/* Connection status — only show LIVE if actually connected */}
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className={isConnected ? 'text-emerald-400' : 'text-rose-400'}>
              {isConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </span>
          </div>

          {/* Execution mode badge */}
          {capabilities && !capLoading && (
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-cyber-card border border-cyber-border text-cyber-muted">
              {capabilities.mode}
            </span>
          )}

          {/* Manage Tools Button */}
          <button
            onClick={() => setIsToolModalOpen(true)}
            className="px-2 py-1 rounded bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 text-[10px] font-medium flex items-center gap-1 transition-colors"
            title="Manage Sandbox Tools"
          >
            <span>Manage Tools</span>
          </button>

          <button onClick={() => setShowEnvPanel(!showEnvPanel)} title="Toggle Environment Info"
            className="p-1 rounded hover:bg-cyber-bg text-cyber-muted hover:text-white transition-colors">
            <Info className="w-3.5 h-3.5" />
          </button>
          <button onClick={handleCopyLogs} title="Copy logs (ANSI stripped)"
            className="p-1 rounded hover:bg-cyber-bg text-cyber-muted hover:text-white transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleClear} title="Clear display"
            className="p-1 rounded hover:bg-cyber-bg text-cyber-muted hover:text-white transition-colors">
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <ToolManagerModal
        isOpen={isToolModalOpen}
        onClose={() => setIsToolModalOpen(false)}
        assessmentId={assessmentId}
        onRefreshCapabilities={fetchCapabilities}
      />


      {/* ── Environment Inspection Panel ─────────────────────────────────── */}
      {showEnvPanel && (
        <div className="px-3 py-2 bg-[#161b22] border-b border-cyber-border/60 shrink-0">
          {capLoading ? (
            <div className="flex items-center gap-2 text-[10px] text-cyber-muted">
              <Activity className="w-3 h-3 animate-spin" />
              Detecting sandbox capabilities...
            </div>
          ) : capError ? (
            <div className="flex items-center gap-1.5 text-[10px] text-rose-400">
              <AlertTriangle className="w-3 h-3" />
              {capError} — capabilities unavailable
            </div>
          ) : capabilities ? (
            <div className="space-y-1.5">
              <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400">
                <span>
                  <span className="text-cyber-muted">Status:</span>{' '}
                  <span className={`font-bold ${capabilities.is_linux_sandbox ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {capabilities.display_status || (capabilities.is_linux_sandbox ? '● LIVE LINUX SANDBOX' : '○ SANDBOX UNAVAILABLE')}
                  </span>
                </span>
                <span><span className="text-cyber-muted">Container:</span> <span className="text-cyber-accent font-bold">{capabilities.container}</span></span>
                <span><span className="text-cyber-muted">Execution Mode:</span> <span className="text-slate-200">{capabilities.mode}</span></span>
                <span><span className="text-cyber-muted">Docker Engine:</span> <span className={capabilities.docker_active ? 'text-emerald-400 font-bold' : 'text-amber-400'}>{capabilities.docker_active ? 'Active (Linux Container)' : 'Unavailable'}</span></span>
                {capabilities.runtime?.os_release && (
                  <span><span className="text-cyber-muted">OS Release:</span> <span className="text-emerald-300 font-mono">{capabilities.runtime.os_release}</span></span>
                )}
                {capabilities.runtime?.uname && (
                  <span className="truncate max-w-[300px]"><span className="text-cyber-muted">Kernel:</span> <span className="text-slate-300">{capabilities.runtime.uname}</span></span>
                )}
                {capabilities.runtime?.user_id && (
                  <span><span className="text-cyber-muted">Container User:</span> <span className="text-slate-300">{capabilities.runtime.user_id}</span></span>
                )}
              </div>

              {!capabilities.is_linux_sandbox && (
                <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] text-amber-300 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                    <span>
                      {capabilities.unavailable_reason || 'Docker / Linux container runtime is unavailable. Start Docker Desktop to enable Real Linux Sandbox.'}
                    </span>
                  </div>
                  <button
                    onClick={fetchCapabilities}
                    className="px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-200 text-[10px] font-medium transition-colors"
                  >
                    Retry Detection
                  </button>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-cyber-border/30">
                <span className="text-[9px] text-cyber-muted uppercase font-bold mr-1">Tools:</span>
                {capabilities.tools ? (
                  Object.entries(capabilities.tools).map(([name, info]) => (
                    <ToolPill key={name} name={name} available={(info as ToolCapability).installed} />
                  ))
                ) : (
                  <>
                    <ToolPill name="python" available={capabilities.python} />
                    <ToolPill name="curl" available={capabilities.curl} />
                    <ToolPill name="openssl" available={capabilities.openssl} />
                    <ToolPill name="dig" available={capabilities.dig} />
                    <ToolPill name="nmap" available={capabilities.nmap} />
                  </>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* ── Terminal Output — ANSI-aware rendering ───────────────────────── */}
      <div
        className="flex-1 px-4 py-3 overflow-y-auto font-mono text-[11.5px] leading-snug bg-[#0d1117] cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <pre className="whitespace-pre-wrap break-all">
          {outputChunks.map((chunk, i) => (
            <TerminalLine key={i} raw={chunk} />
          ))}
        </pre>
        <div ref={terminalEndRef} />
      </div>

      {/* ── Input Row ────────────────────────────────────────────────────── */}
      <form
        onSubmit={handleSend}
        className="px-3 py-2 bg-[#161b22] border-t border-cyber-border/60 flex items-center gap-2 shrink-0"
      >
        <span className="text-cyber-accent font-bold text-[11px] select-none shrink-0">$</span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={isConnected ? 'Type a command...' : 'Connecting to sandbox...'}
          disabled={!isConnected}
          className="flex-1 bg-transparent border-none outline-none text-slate-100 font-mono text-[11px] placeholder:text-cyber-muted/40 focus:ring-0 disabled:opacity-40"
          autoFocus
        />

        <button type="button" onClick={handleStopProcess} disabled={!isConnected}
          className="p-1.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 disabled:opacity-30 transition-colors shrink-0"
          title="Interrupt / Ctrl+C">
          <Square className="w-3 h-3 fill-current" />
        </button>

        <button type="submit" disabled={!isConnected || !inputVal.trim()}
          className="p-1.5 rounded bg-cyber-accent/20 hover:bg-cyber-accent/30 text-cyber-accent disabled:opacity-30 transition-colors shrink-0"
          title="Execute">
          <Play className="w-3 h-3 fill-current" />
        </button>
      </form>
    </div>
  );
};
