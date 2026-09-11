import React from 'react';
import { Terminal, Boxes, FileText, History } from 'lucide-react';

export type ViewId = 'console' | 'agents' | 'reports' | 'history';

const NAV: { id: ViewId; label: string; Icon: React.FC<any> }[] = [
  { id: 'console', label: 'Console', Icon: Terminal },
  { id: 'agents', label: 'Agents', Icon: Boxes },
  { id: 'reports', label: 'Reports', Icon: FileText },
  { id: 'history', label: 'History', Icon: History },
];

export const Sidebar: React.FC<{
  view: ViewId;
  onChange: (v: ViewId) => void;
  runCount: number;
}> = ({ view, onChange, runCount }) => (
  <nav className="w-56 shrink-0 border-r border-ink-200 bg-ink-50 flex flex-col">
    <div className="h-20 flex items-center gap-2 px-6 border-b border-ink-200">
      <div className="w-6 h-6 bg-ink-950" />
      <span className="font-mono text-xs tracking-[0.2em] font-semibold">CYBERAGENTS</span>
    </div>
    <ul className="flex-1 py-4">
      {NAV.map(({ id, label, Icon }) => {
        const active = view === id;
        return (
          <li key={id}>
            <button
              onClick={() => onChange(id)}
              className={`w-full flex items-center gap-3 px-6 h-12 text-sm transition-colors ${
                active ? 'bg-ink-950 text-white font-medium' : 'text-ink-600 hover:bg-ink-100'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={active ? 2.2 : 1.8} />
              <span className="flex-1 text-left">{label}</span>
              {id === 'history' && runCount > 0 && (
                <span className={`font-mono text-xs ${active ? 'text-ink-300' : 'text-ink-400'}`}>{runCount}</span>
              )}
            </button>
          </li>
        );
      })}
    </ul>
    <div className="px-6 py-4 border-t border-ink-200">
      <div className="font-mono text-[10px] tracking-wider text-ink-400 leading-relaxed">
        AUTONOMOUS<br />ASSESSMENT ENGINE
      </div>
    </div>
  </nav>
);
