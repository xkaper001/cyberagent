import React, { useEffect, useState } from 'react';
import { Folder, FileText, RefreshCw, HardDrive, Download, ChevronRight, FileCode } from 'lucide-react';

interface WorkspaceFileBrowserProps {
  assessmentId: string;
}

interface FileItem {
  name: string;
  path: string;
  is_dir: boolean;
  size_bytes: number;
  modified: string;
}

export const WorkspaceFileBrowser: React.FC<WorkspaceFileBrowserProps> = ({ assessmentId }) => {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFiles = async (subpath: string = '') => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:8000/api/workspace/${assessmentId}/files?path=${encodeURIComponent(subpath)}`);
      if (!res.ok) throw new Error('Failed to fetch workspace files');
      const data = await res.json();
      setFiles(data.items || []);
      setCurrentPath(subpath);
    } catch (err: any) {
      setError(err.message || 'Error loading files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReadFile = async (filePath: string) => {
    setSelectedFile(filePath);
    try {
      const res = await fetch(`http://localhost:8000/api/workspace/${assessmentId}/files/content?path=${encodeURIComponent(filePath)}`);
      if (!res.ok) throw new Error('Failed to read file content');
      const data = await res.json();
      setFileContent(data.content);
    } catch (err: any) {
      setFileContent(`Error reading file: ${err.message}`);
    }
  };

  useEffect(() => {
    fetchFiles('');
  }, [assessmentId]);

  return (
    <div className="flex flex-col h-full bg-cyber-bg border border-cyber-border rounded-xl overflow-hidden font-mono text-xs shadow-xl">
      {/* Header */}
      <div className="px-4 py-2.5 bg-cyber-surface/90 border-b border-cyber-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-cyber-accent" />
          <span className="font-bold text-slate-200 text-xs">WORKSPACE FILE EXPLORER</span>
          <span className="text-[10px] text-cyber-muted font-normal">/workspace{currentPath}</span>
        </div>

        <button
          onClick={() => fetchFiles(currentPath)}
          className="p-1 rounded hover:bg-cyber-card text-cyber-muted hover:text-white transition-colors"
          title="Refresh Files"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-cyber-border overflow-hidden">
        {/* File Tree List */}
        <div className="p-3 overflow-y-auto space-y-1">
          {error && <div className="p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[11px]">{error}</div>}
          
          {files.length === 0 && !isLoading && (
            <div className="py-8 text-center text-cyber-muted text-[11px]">
              No files found in workspace. Run tools or terminal commands to generate artifacts.
            </div>
          )}

          {files.map((item) => (
            <div
              key={item.path}
              onClick={() => item.is_dir ? fetchFiles(item.path.replace('/workspace/', '')) : handleReadFile(item.path)}
              className={`p-2 rounded-lg flex items-center justify-between cursor-pointer transition-all ${
                selectedFile === item.path ? 'bg-cyber-accent/20 border border-cyber-accent/40 text-cyber-accent' : 'hover:bg-cyber-card/60 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2 overflow-hidden">
                {item.is_dir ? (
                  <Folder className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-cyan-400 shrink-0" />
                )}
                <span className="truncate font-semibold text-[11.5px]">{item.name}</span>
              </div>

              <div className="flex items-center gap-2 text-[10px] text-cyber-subtle">
                {!item.is_dir && <span>{(item.size_bytes / 1024).toFixed(1)} KB</span>}
                <ChevronRight className="w-3.5 h-3.5 text-cyber-muted" />
              </div>
            </div>
          ))}
        </div>

        {/* Content Preview */}
        <div className="p-3 bg-black/50 flex flex-col h-full overflow-hidden">
          <div className="pb-2 mb-2 border-b border-cyber-border/60 flex items-center justify-between text-[11px]">
            <span className="text-cyber-muted uppercase font-bold flex items-center gap-1.5">
              <FileCode className="w-3.5 h-3.5 text-cyber-accent" />
              File Content Viewer
            </span>
            {selectedFile && <span className="text-slate-300 font-mono text-[10px] truncate max-w-[180px]">{selectedFile}</span>}
          </div>

          <div className="flex-1 overflow-auto">
            {selectedFile ? (
              <pre className="p-3 rounded bg-cyber-bg border border-cyber-border/80 text-emerald-400/90 font-mono text-[11px] leading-relaxed whitespace-pre-wrap">
                <code>{fileContent || 'Loading content...'}</code>
              </pre>
            ) : (
              <div className="h-full flex items-center justify-center text-cyber-muted/60 text-[11px]">
                Select a file from the explorer to preview contents
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
