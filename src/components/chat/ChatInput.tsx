import React, { useState, useRef } from 'react';
import { 
  Send, 
  Paperclip, 
  Wrench, 
  Square, 
  Trash2, 
  Sparkles,
  Upload,
  FileText,
  X
} from 'lucide-react';
import { useCyber } from '../../context/CyberContext';

export const ChatInput: React.FC = () => {
  const { sendMessage, isGenerating, clearMessages, addToast } = useCyber();
  const [input, setInput] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);
  const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string }[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!input.trim() && attachedFiles.length === 0) return;
    let messageText = input;
    if (attachedFiles.length > 0) {
      messageText += `\n\n[Attached Artifacts: ${attachedFiles.map(f => f.name).join(', ')}]`;
    }
    sendMessage(messageText);
    setInput('');
    setAttachedFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files).map(f => ({
        name: f.name,
        size: `${(f.size / 1024).toFixed(1)} KB`
      }));
      setAttachedFiles(prev => [...prev, ...files]);
      addToast('info', `Attached ${files.length} file(s)`);
    }
  };

  return (
    <div 
      className="p-4 bg-cyber-bg/90 backdrop-blur border-t border-cyber-border shrink-0 select-none"
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleFileDrop}
    >
      <div className="max-w-4xl mx-auto space-y-2">
        {/* File Dropzone Overlay Feedback */}
        {isDragOver && (
          <div className="p-4 rounded-xl border-2 border-dashed border-cyber-accent bg-cyber-accent/10 text-center text-xs text-cyber-accent animate-pulse">
            <Upload className="w-5 h-5 mx-auto mb-1" />
            <span>Drop scan results, PCAP files, or log artifacts to analyze with Copilot</span>
          </div>
        )}

        {/* Attached Files List */}
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {attachedFiles.map((file, idx) => (
              <div key={idx} className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-cyber-surface border border-cyber-border text-xs text-slate-200 font-mono">
                <FileText className="w-3.5 h-3.5 text-cyber-accent" />
                <span>{file.name} ({file.size})</span>
                <button 
                  onClick={() => setAttachedFiles(prev => prev.filter((_, i) => i !== idx))}
                  className="text-cyber-muted hover:text-white ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Main Input Box Container */}
        <div className="relative rounded-xl border border-cyber-border bg-cyber-card shadow-cyber focus-within:border-cyber-accent/60 transition-all overflow-hidden">
          <textarea
            ref={textareaRef}
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask CyberAgents anything... (e.g. 'Analyze my lab target and focus on web security')"
            className="w-full p-3.5 bg-transparent text-slate-100 placeholder-cyber-muted text-xs sm:text-sm focus:outline-none resize-none leading-relaxed"
          />

          {/* Action Bar inside Input */}
          <div className="px-3 py-2 bg-cyber-surface/60 border-t border-cyber-border/40 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <label 
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyber-bg border border-cyber-border text-cyber-muted hover:text-slate-200 hover:border-cyber-border-light text-xs cursor-pointer transition-all"
                title="Attach Nmap XML, PCAP, or Log file"
              >
                <Paperclip className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Attach Artifact</span>
                <input 
                  type="file" 
                  className="hidden" 
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      const f = e.target.files[0];
                      setAttachedFiles(prev => [...prev, { name: f.name, size: `${(f.size / 1024).toFixed(1)} KB` }]);
                      addToast('info', `Attached ${f.name}`);
                    }
                  }} 
                />
              </label>

              <button
                onClick={() => addToast('info', 'Tools context selected: Nmap, CVE-DB, HTTP Fingerprint')}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyber-bg border border-cyber-border text-cyber-muted hover:text-slate-200 text-xs transition-all"
              >
                <Wrench className="w-3.5 h-3.5 text-cyber-accent" />
                <span className="hidden sm:inline text-[11px]">Tools</span>
              </button>

              <button
                onClick={clearMessages}
                className="p-1.5 text-cyber-muted hover:text-rose-400 rounded transition-colors"
                title="Clear Conversation"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Send / Stop Button */}
            <div>
              {isGenerating ? (
                <button
                  onClick={() => addToast('info', 'Generation stopped')}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/40 text-xs font-semibold hover:bg-rose-500/30 transition-all"
                >
                  <Square className="w-3 h-3 fill-current" />
                  <span>Stop</span>
                </button>
              ) : (
                <button
                  onClick={handleSend}
                  disabled={!input.trim() && attachedFiles.length === 0}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-cyber-accent to-indigo-600 shadow-glow-accent transition-all ${
                    !input.trim() && attachedFiles.length === 0 
                      ? 'opacity-50 cursor-not-allowed' 
                      : 'hover:opacity-95 active:scale-95'
                  }`}
                >
                  <span>Send</span>
                  <Send className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Input Footer Note */}
        <div className="flex items-center justify-between text-[10px] text-cyber-subtle px-1">
          <span>Enter to send, Shift+Enter for new line • Drag & drop scan logs anywhere</span>
          <span className="font-mono">Authorized Scoped Environment</span>
        </div>
      </div>
    </div>
  );
};
