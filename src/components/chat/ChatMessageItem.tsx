import React, { useState } from 'react';
import { 
  ShieldAlert, 
  User, 
  Copy, 
  Check, 
  RotateCcw, 
  ThumbsUp, 
  ThumbsDown, 
  Bug, 
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { Message, Finding } from '../../types/cyber';
import { AgentActivityTimeline } from './AgentActivityTimeline';
import { useCyber } from '../../context/CyberContext';

interface ChatMessageItemProps {
  message: Message;
}

export const ChatMessageItem: React.FC<ChatMessageItemProps> = ({ message }) => {
  const { setSelectedFinding, setCurrentView, addToast, sendMessage, confirmAuthorization } = useCyber();
  const [copied, setCopied] = useState(false);
  const isAssistant = message.role === 'assistant';

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    addToast('info', 'Message copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  // Helper to render basic markdown & code blocks
  type ContentPart = { type: 'text'; content: string } | { type: 'code'; lang: string; code: string };

  const renderFormattedContent = (content: string) => {
    // Split by code blocks ```
    const codeBlockRegex = /```([a-z]*)\n([\s\S]*?)```/g;
    const parts: ContentPart[] = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Text before code block
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: content.substring(lastIndex, match.index) });
      }
      // Code block
      parts.push({ type: 'code', lang: match[1] || 'bash', code: match[2].trim() });
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push({ type: 'text', content: content.substring(lastIndex) });
    }

    return (
      <div className="space-y-3 leading-relaxed">
        {parts.map((part, idx) => {
          if (part.type === 'code') {
            return <CodeBlock key={idx} lang={part.lang} code={part.code} />;
          }

          const lines = part.content.split('\n');
          return (
            <div key={idx} className="space-y-1.5">
              {lines.map((line, lIdx) => {
                if (line.startsWith('### ')) {
                  return <h3 key={lIdx} className="text-sm font-bold text-slate-100 mt-2 mb-1">{line.replace('### ', '')}</h3>;
                }
                if (line.startsWith('#### ')) {
                  return <h4 key={lIdx} className="text-xs font-bold text-slate-200 mt-2 mb-1">{line.replace('#### ', '')}</h4>;
                }
                if (line.startsWith('- ') || line.startsWith('* ')) {
                  return (
                    <div key={lIdx} className="flex items-start gap-2 text-slate-300 ml-2">
                      <span className="text-cyber-accent text-[10px] mt-1">•</span>
                      <span>{line.replace(/^[-*]\s+/, '')}</span>
                    </div>
                  );
                }
                if (line.trim() === '') return <div key={lIdx} className="h-1" />;
                return <p key={lIdx} className="text-slate-200">{line}</p>;
              })}
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className={`py-5 px-4 sm:px-6 transition-colors ${
      isAssistant ? 'bg-cyber-bg/40' : 'bg-cyber-surface/40'
    }`}>
      <div className="max-w-4xl mx-auto flex items-start gap-4">
        {/* Avatar */}
        <div className={`w-8 h-8 rounded-xl border flex items-center justify-center shrink-0 shadow-sm ${
          isAssistant 
            ? 'bg-cyber-accent/15 border-cyber-accent/40 text-cyber-accent shadow-glow-accent' 
            : 'bg-cyber-surface border-cyber-border text-slate-200'
        }`}>
          {isAssistant ? <ShieldAlert className="w-4 h-4" /> : <User className="w-4 h-4" />}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 space-y-3 text-xs sm:text-sm">
          {/* Header Role & Timestamp */}
          <div className="flex items-center justify-between text-[11px] text-cyber-muted">
            <span className="font-semibold text-slate-300">
              {isAssistant ? 'CyberAgents Copilot' : 'Security Operator'}
            </span>
            <span className="font-mono text-[10px]">{message.timestamp}</span>
          </div>

          {/* Agent Activity Timeline (if attached) */}
          {message.agentActivity && (
            <AgentActivityTimeline activity={message.agentActivity} />
          )}

          {/* Text & Formatted Content */}
          <div className="text-slate-200">
            {renderFormattedContent(message.content)}
          </div>

          {/* Target Authorization Prompt Action Card */}
          {message.content.includes("explicitly authorized to perform security testing") && (
            <div className="my-3 p-4 rounded-xl bg-cyber-surface/90 border border-cyber-accent/40 shadow-glow-accent space-y-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-100">
                <ShieldAlert className="w-4 h-4 text-cyber-accent" />
                <span>Target Security Testing Authorization Required</span>
              </div>
              <p className="text-xs text-cyber-muted leading-relaxed">
                Confirming authorization registers this target for active security tool execution in your isolated Linux Docker sandbox.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  onClick={() => confirmAuthorization()}
                  className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-glow-accent transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>I'm Authorized</span>
                </button>
                <button
                  onClick={() => sendMessage("Let me change the target.")}
                  className="px-3.5 py-2 rounded-lg bg-cyber-card border border-cyber-border hover:bg-cyber-surface text-slate-300 font-medium text-xs transition-all active:scale-95"
                >
                  <span>Change Target</span>
                </button>
              </div>
            </div>
          )}

          {/* Discovered Inline Finding Cards */}
          {message.findings && message.findings.length > 0 && (
            <div className="pt-2 space-y-2">
              <div className="text-[10px] font-semibold text-cyber-subtle uppercase tracking-wider">
                Discovered Security Findings ({message.findings.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {message.findings.map((f) => (
                  <div 
                    key={f.id}
                    className="p-3 rounded-xl bg-cyber-card border border-cyber-border hover:border-cyber-accent/40 transition-all space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        f.severity === 'critical' ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30' :
                        f.severity === 'high' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' :
                        'bg-cyan-500/20 text-cyan-400'
                      }`}>
                        {f.severity}
                      </span>
                      <span className="text-[10px] text-cyber-muted font-mono">{f.confidence}% Confidence</span>
                    </div>

                    <h5 className="font-semibold text-slate-100 text-xs leading-snug">{f.title}</h5>

                    <p className="text-[11px] text-cyber-muted line-clamp-2 leading-relaxed">
                      {f.impact}
                    </p>

                    <div className="pt-1 flex items-center justify-between border-t border-cyber-border/60">
                      <span className="text-[10px] text-cyber-subtle font-mono">{f.cveId || f.asset}</span>
                      <button
                        onClick={() => {
                          setSelectedFinding(f);
                          setCurrentView('findings');
                        }}
                        className="text-[11px] text-cyber-accent hover:underline flex items-center gap-1 font-medium"
                      >
                        Investigate <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* References & Citations */}
          {message.references && message.references.length > 0 && (
            <div className="pt-2 text-[11px]">
              <span className="text-[10px] font-semibold text-cyber-subtle uppercase tracking-wider block mb-1">
                Intelligence References
              </span>
              <div className="flex flex-wrap gap-2">
                {message.references.map((ref, rIdx) => (
                  <span key={rIdx} className="px-2 py-1 rounded bg-cyber-surface border border-cyber-border text-cyber-muted font-mono flex items-center gap-1">
                    <ExternalLink className="w-3 h-3 text-cyber-accent" />
                    {ref}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Action Bar */}
          {isAssistant && (
            <div className="pt-2 flex items-center gap-3 text-cyber-muted text-xs">
              <button 
                onClick={() => handleCopy(message.content)}
                className="flex items-center gap-1 px-2 py-1 rounded hover:bg-cyber-surface hover:text-slate-200 transition-colors"
                title="Copy response"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="text-[11px]">{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button className="p-1 rounded hover:bg-cyber-surface hover:text-slate-200" title="Good response">
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button className="p-1 rounded hover:bg-cyber-surface hover:text-slate-200" title="Poor response">
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-component for code blocks with syntax copy
const CodeBlock: React.FC<{ lang: string; code: string }> = ({ lang, code }) => {
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-2.5 rounded-xl border border-cyber-border bg-cyber-bg overflow-hidden font-mono text-xs">
      <div className="px-4 py-1.5 bg-cyber-surface/90 border-b border-cyber-border flex items-center justify-between text-cyber-muted text-[11px]">
        <span>{lang || 'bash'}</span>
        <button
          onClick={copyCode}
          className="flex items-center gap-1 text-cyber-muted hover:text-white transition-colors"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          <span>{copied ? 'Copied!' : 'Copy Code'}</span>
        </button>
      </div>
      <pre className="p-4 overflow-x-auto text-slate-200 text-[11.5px] leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};
