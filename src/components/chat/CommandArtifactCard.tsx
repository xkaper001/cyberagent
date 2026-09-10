import React, { useState } from 'react';
import { Terminal, Play, Copy, Check, ShieldCheck, Loader2, Square, FileText } from 'lucide-react';
import { executeTool } from '../../api/tools';
import { useCyber } from '../../context/CyberContext';

interface CommandArtifactCardProps {
  toolName: string;
  commandSnippet: string;
  inputData: Record<string, any>;
}

export const CommandArtifactCard: React.FC<CommandArtifactCardProps> = ({ toolName, commandSnippet, inputData }) => {
  const { addToast } = useCyber();
  const [copied, setCopied] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(commandSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRunControlledTool = async () => {
    setIsRunning(true);
    setError(null);
    try {
      addToast('info', `Executing controlled tool '${toolName}' in sandbox...`);
      const res = await executeTool(toolName, inputData);
      setExecutionResult(res);
      addToast('success', `Tool '${toolName}' executed successfully in sandbox.`);
    } catch (err: any) {
      setError(err.message || 'Tool execution failed');
      addToast('error', `Tool execution failed: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="my-2.5 rounded-xl border border-cyber-border bg-cyber-bg overflow-hidden font-mono text-xs shadow-sm">
      {/* Header */}
      <div className="px-4 py-2 bg-cyber-surface/90 border-b border-cyber-border flex items-center justify-between text-cyber-muted text-[11px]">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-cyber-accent" />
          <span className="font-bold text-slate-100 uppercase tracking-wider">Allowlisted Sandbox Execution</span>
          <span className="text-[10px] text-cyber-muted">({toolName})</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-0.5 rounded bg-cyber-card border border-cyber-border text-cyber-subtle hover:text-white transition-colors"
          >
            {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
            <span>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          {isRunning ? (
            <button
              onClick={() => setIsRunning(false)}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 font-bold hover:bg-rose-500/30 transition-colors text-[11px]"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
              <span>Stop</span>
            </button>
          ) : (
            <button
              onClick={handleRunControlledTool}
              disabled={isRunning}
              className="flex items-center gap-1.5 px-3 py-1 rounded bg-cyber-accent text-cyber-bg font-bold hover:bg-cyber-accent-hover transition-colors disabled:opacity-50 shadow-glow-accent text-[11px]"
            >
              {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 fill-current" />}
              <span>{isRunning ? 'Executing...' : 'Run Tool'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Snippet */}
      <pre className="p-3.5 text-slate-200 overflow-x-auto text-[11px] leading-relaxed">
        <code>{commandSnippet}</code>
      </pre>

      {/* Controlled Execution Output */}
      {executionResult && (
        <div className="p-3 bg-cyber-card/80 border-t border-cyber-border space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between">
            <div className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>Sandbox Tool Execution Result</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] text-cyber-accent">
              <FileText className="w-3 h-3" />
              <span>Evidence Created: E-001</span>
            </div>
          </div>
          <pre className="p-2.5 rounded bg-cyber-bg border border-cyber-border text-emerald-400 overflow-x-auto text-[10.5px]">
            <code>{JSON.stringify(executionResult, null, 2)}</code>
          </pre>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-500/10 border-t border-rose-500/30 text-rose-400 text-[11px]">
          <strong>Execution Error:</strong> {error}
        </div>
      )}
    </div>
  );
};
