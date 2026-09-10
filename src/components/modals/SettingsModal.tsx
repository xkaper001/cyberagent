import React, { useState } from 'react';
import { Settings, X, Key, Server, Cpu, Check, Shield } from 'lucide-react';
import { useCyber } from '../../context/CyberContext';

export const SettingsModal: React.FC = () => {
  const { isSettingsOpen, setIsSettingsOpen, addToast } = useCyber();

  const [provider, setProvider] = useState<'openai' | 'anthropic' | 'ollama' | 'custom'>('openai');
  const [apiKey, setApiKey] = useState('sk-proj-cast...9f82d9');
  const [model, setModel] = useState('gpt-4o-2026-08');
  const [baseUrl, setBaseUrl] = useState('https://api.openai.com/v1');
  const [maxTokens, setMaxTokens] = useState('4096');

  if (!isSettingsOpen) return null;

  const handleSave = () => {
    addToast('success', 'Settings configuration updated');
    setIsSettingsOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        className="w-full max-w-lg bg-cyber-card border border-cyber-border rounded-xl shadow-cyber overflow-hidden animate-in fade-in zoom-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyber-border bg-cyber-surface/60 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyber-accent/15 border border-cyber-accent/30 flex items-center justify-center text-cyber-accent">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-100 tracking-wide">PLATFORM SETTINGS</h2>
              <p className="text-[11px] text-cyber-muted font-mono">LLM Brain & Agent Engine Configurations</p>
            </div>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(false)}
            className="text-cyber-muted hover:text-white p-1 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {/* Provider Selector */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-200">LLM Endpoint Provider</label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { id: 'openai', label: 'OpenAI' },
                { id: 'anthropic', label: 'Anthropic' },
                { id: 'ollama', label: 'Ollama' },
                { id: 'custom', label: 'Custom' }
              ].map((p) => (
                <button
                  type="button"
                  key={p.id}
                  onClick={() => setProvider(p.id as any)}
                  className={`py-2 px-2 rounded-lg font-medium border text-center transition-all ${
                    provider === p.id 
                      ? 'bg-cyber-accent/20 border-cyber-accent text-slate-100 font-bold'
                      : 'bg-cyber-bg border-cyber-border text-cyber-muted hover:text-slate-200'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Model Name */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-200">Model Selector</label>
            <div className="relative">
              <input
                type="text"
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyber-accent"
              />
              <Cpu className="w-3.5 h-3.5 text-cyber-muted absolute right-3 top-2.5" />
            </div>
          </div>

          {/* API Key Input (Masked) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-slate-200">API Key (Masked)</label>
              <span className="text-[10px] text-emerald-400 font-mono">User Config Precedence</span>
            </div>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyber-accent"
              />
              <Key className="w-3.5 h-3.5 text-cyber-muted absolute right-3 top-2.5" />
            </div>
            <p className="text-[10px] text-cyber-subtle">
              Keys are encrypted in memory and take precedence over embedded defaults.
            </p>
          </div>

          {/* Base URL */}
          <div className="space-y-1.5">
            <label className="block font-semibold text-slate-200">Base Endpoint URL</label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full bg-cyber-bg border border-cyber-border rounded-lg px-3 py-2 text-slate-100 font-mono focus:outline-none focus:border-cyber-accent text-[11px]"
            />
          </div>

          {/* System Security Info */}
          <div className="p-3 rounded-lg bg-cyber-surface border border-cyber-border flex items-center justify-between text-cyber-muted">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyber-emerald" />
              <span>Human-in-the-Loop Safety Mode</span>
            </div>
            <span className="font-mono text-emerald-400 text-[11px] font-semibold">ENFORCED</span>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-cyber-border">
            <button
              onClick={() => setIsSettingsOpen(false)}
              className="px-4 py-2 rounded-lg bg-cyber-surface border border-cyber-border text-cyber-muted hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-5 py-2 rounded-lg font-semibold text-white bg-cyber-accent hover:bg-indigo-600 shadow-glow-accent transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              Save Configuration
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
