import React, { useState } from 'react';
import { Terminal, Check, Copy, ChevronDown, ChevronUp, Clock, Code, FileText } from 'lucide-react';
import { ToolExecutionCardState } from '../../types/cyber';

interface ToolExecutionCardProps {
  tool: ToolExecutionCardState;
}

export const ToolExecutionCard: React.FC<ToolExecutionCardProps> = ({ tool }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'parsed' | 'raw'>('parsed');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const rawText = tool.stdoutRaw || (typeof tool.output === 'string' ? tool.output : JSON.stringify(tool.output, null, 2));

  return (
    <div className="rounded-xl border border-cyber-border bg-cyber-bg overflow-hidden font-mono text-xs shadow-sm">
      {/* Header */}
      <div className="px-3 py-2 bg-cyber-surface/90 border-b border-cyber-border flex items-center justify-between text-cyber-muted text-[11px]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-cyber-accent" />
          <span className="font-bold text-slate-100">{tool.toolName}</span>
          {tool.profile && (
            <span className="bg-cyber-bg px-1.5 py-0.5 rounded text-[10px] text-cyber-accent border border-cyber-border">
              {tool.profile}
            </span>
          )}
          <span className="text-[10px] text-cyber-subtle">({tool.agent})</span>
        </div>

        <div className="flex items-center gap-2">
          {tool.exitCode !== undefined && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded border ${
              tool.exitCode === 0 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
            }`}>
              exit: {tool.exitCode}
            </span>
          )}
          {tool.duration && (
            <span className="text-[10px] text-cyber-muted flex items-center gap-1">
              <Clock className="w-3 h-3 text-cyber-accent" />
              {tool.duration}
            </span>
          )}
          <span className={`px-2 py-0.5 rounded text-[9.5px] uppercase font-bold ${
            tool.status === 'success' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
            tool.status === 'running' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 animate-pulse' :
            tool.status === 'queued' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
            'bg-rose-500/20 text-rose-400 border border-rose-500/30'
          }`}>
            {tool.status}
          </span>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-0.5 rounded hover:bg-cyber-card text-cyber-subtle hover:text-white"
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Body */}
      {isExpanded && (
        <div className="p-3 space-y-2 text-[11px] leading-relaxed bg-cyber-card/40">
          <div className="flex items-center justify-between text-[10.5px]">
            <span className="text-cyber-subtle font-semibold uppercase">Target: <code className="text-slate-200">{tool.target || tool.input?.target || 'Authorized Scope'}</code></span>
            
            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 bg-cyber-surface p-0.5 rounded border border-cyber-border/60">
              <button
                onClick={() => setActiveTab('parsed')}
                className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 font-medium transition-colors ${
                  activeTab === 'parsed' ? 'bg-cyber-accent/20 text-cyber-accent font-bold' : 'text-cyber-muted hover:text-white'
                }`}
              >
                <Code className="w-3 h-3" />
                Parsed Results
              </button>
              <button
                onClick={() => setActiveTab('raw')}
                className={`px-2 py-0.5 rounded text-[10px] flex items-center gap-1 font-medium transition-colors ${
                  activeTab === 'raw' ? 'bg-cyber-accent/20 text-cyber-accent font-bold' : 'text-cyber-muted hover:text-white'
                }`}
              >
                <FileText className="w-3 h-3" />
                Raw Output
              </button>
            </div>
          </div>

          {activeTab === 'parsed' ? (
            <div>
              <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-cyber-subtle mb-1">
                <span>Structured Parsed Result</span>
                {tool.status !== 'failed' && tool.exitCode === 0 && (
                  <button
                    onClick={() => handleCopy(JSON.stringify(tool.output, null, 2))}
                    className="flex items-center gap-1 text-cyber-accent hover:underline lowercase font-normal"
                  >
                    {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copied ? 'copied' : 'copy'}</span>
                  </button>
                )}
              </div>
              {tool.status === 'failed' || (tool.exitCode !== undefined && tool.exitCode !== 0) ? (
                <div className="p-3 rounded bg-rose-950/30 border border-rose-500/30 text-rose-300 font-mono text-[11px] space-y-2">
                  <div className="flex items-center justify-between font-bold text-rose-400 border-b border-rose-500/20 pb-1">
                    <span>Execution Failed (Exit Code: {tool.exitCode ?? 1})</span>
                    <span className="text-[10px] bg-rose-500/20 px-1.5 py-0.5 rounded text-rose-300">FAILED</span>
                  </div>
                  <p className="text-[10.5px] text-slate-300">No parsed result because execution failed.</p>
                  {(tool.stderrRaw || tool.stderr || tool.error) && (
                    <div className="mt-2">
                      <span className="text-[10px] uppercase font-semibold text-rose-400 block mb-0.5">Error Trace / Stderr:</span>
                      <pre className="p-2 rounded bg-black/60 border border-rose-500/20 text-rose-200 text-[10px] overflow-x-auto max-h-40 font-mono">
                        <code>{tool.stderrRaw || tool.stderr || JSON.stringify(tool.error, null, 2)}</code>
                      </pre>
                    </div>
                  )}
                </div>
              ) : (
                <pre className="p-2.5 rounded bg-cyber-bg border border-cyber-border text-emerald-400/90 overflow-x-auto text-[10.5px] max-h-56">
                  <code>{typeof tool.output === 'object' ? JSON.stringify(tool.output, null, 2) : String(tool.output || 'Executing tool inside isolated worker...')}</code>
                </pre>
              )}
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between text-[10px] uppercase font-semibold text-cyber-subtle mb-1">
                <span>Worker Container Stdout/Stderr</span>
                <button
                  onClick={() => handleCopy(rawText)}
                  className="flex items-center gap-1 text-cyber-accent hover:underline lowercase font-normal"
                >
                  {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'copied' : 'copy'}</span>
                </button>
              </div>
              <pre className="p-2.5 rounded bg-black/80 border border-cyber-border text-slate-300 font-mono text-[10px] leading-tight overflow-x-auto max-h-56">
                <code>{rawText || 'No raw output returned.'}</code>
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
