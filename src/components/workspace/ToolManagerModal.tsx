import React, { useState, useEffect } from 'react';
import { Shield, CheckCircle2, Package, Wrench, Download, AlertTriangle, RefreshCw, X, Loader2, Info } from 'lucide-react';

interface ToolItem {
  package_name: string;
  display_name: string;
  description: string;
  category: string;
  executable: string;
  is_core: boolean;
  requires_approval: boolean;
  installed: boolean;
  available: boolean;
  version?: string | null;
}

interface ToolManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessmentId: string;
  onRefreshCapabilities?: () => void;
}

export const ToolManagerModal: React.FC<ToolManagerModalProps> = ({
  isOpen,
  onClose,
  assessmentId,
  onRefreshCapabilities,
}) => {
  const [tools, setTools] = useState<ToolItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [installingPkg, setInstallingPkg] = useState<string | null>(null);
  const [installStep, setInstallStep] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetting, setResetting] = useState(false);

  const fetchTools = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/workspace/${assessmentId}/tools`);
      if (res.ok) {
        const data = await res.json();
        setTools(data.tools || []);
      } else {
        setErrorMsg('Failed to load sandbox tools catalog.');
      }
    } catch (e: any) {
      setErrorMsg(`Error fetching catalog: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchTools();
    }
  }, [isOpen, assessmentId]);

  const handleInstall = async (pkgName: string) => {
    setInstallingPkg(pkgName);
    setInstallStep('Preparing container installation...');
    setErrorMsg(null);

    try {
      setInstallStep(`Installing ${pkgName} inside Linux sandbox...`);
      const res = await fetch(`/api/workspace/${assessmentId}/packages/install`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ package: pkgName }),
      });

      setInstallStep('Verifying executable & capability registration...');
      const data = await res.json();

      if (res.ok && data.installed) {
        setInstallStep('✓ Verification succeeded!');
        await new Promise((r) => setTimeout(r, 600));
        await fetchTools();
        if (onRefreshCapabilities) onRefreshCapabilities();
      } else {
        setErrorMsg(data.error || data.detail || 'Package installation failed.');
      }
    } catch (e: any) {
      setErrorMsg(`Installation failed: ${e.message}`);
    } finally {
      setInstallingPkg(null);
      setInstallStep('');
    }
  };

  const handleResetSandbox = async () => {
    setResetting(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/workspace/${assessmentId}/reset`, { method: 'POST' });
      if (res.ok) {
        setShowResetConfirm(false);
        await fetchTools();
        if (onRefreshCapabilities) onRefreshCapabilities();
      } else {
        setErrorMsg('Failed to reset sandbox container.');
      }
    } catch (e: any) {
      setErrorMsg(`Reset failed: ${e.message}`);
    } finally {
      setResetting(false);
    }
  };

  if (!isOpen) return null;

  const coreTools = tools.filter((t) => t.is_core);
  const installedUserTools = tools.filter((t) => !t.is_core && t.installed);
  const availableTools = tools.filter((t) => !t.is_core && !t.installed);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl w-full max-w-3xl max-h-[85vh] flex flex-col text-slate-100 overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-semibold text-lg text-slate-100">Sandbox Tool Manager</h2>
              <p className="text-xs text-slate-400">Persistent Linux Sandbox Package & Capability Catalog</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-sm">
          {errorMsg && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Core Preinstalled Tools Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <h3 className="font-medium text-slate-200 uppercase tracking-wider text-xs">
                  Core Preinstalled Tools (Always Available)
                </h3>
              </div>
              <span className="text-[10px] text-emerald-400/90 font-mono bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                7 / 7 Core Tools Active
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {coreTools.map((t) => (
                <div
                  key={t.package_name}
                  className="p-3 rounded-lg bg-slate-800/40 border border-slate-700/40 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-medium text-slate-200 text-xs font-mono">{t.display_name}</div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[200px]">{t.description}</div>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono bg-slate-900 px-1.5 py-0.5 rounded border border-slate-700">
                    {t.version || 'Active'}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* User Installed Tools Section */}
          {installedUserTools.length > 0 && (
            <section className="space-y-3">
              <h3 className="font-medium text-slate-200 uppercase tracking-wider text-xs flex items-center gap-2">
                <Package className="w-4 h-4 text-cyan-400" />
                Installed by User / Agent
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {installedUserTools.map((t) => (
                  <div
                    key={t.package_name}
                    className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/30 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                      <div>
                        <div className="font-medium text-slate-200 text-xs font-mono">{t.display_name}</div>
                        <div className="text-[11px] text-slate-400">{t.description}</div>
                      </div>
                    </div>
                    <span className="text-[10px] text-cyan-300 font-mono bg-cyan-900/40 px-1.5 py-0.5 rounded border border-cyan-700/50">
                      {t.version || 'Installed'}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Available On-Demand Catalog Section */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-slate-200 uppercase tracking-wider text-xs flex items-center gap-2">
                <Download className="w-4 h-4 text-amber-400" />
                Available On-Demand Tools (Install inside Sandbox)
              </h3>
              <span className="text-[11px] text-slate-400">Controlled Package Catalog</span>
            </div>

            <div className="space-y-2">
              {availableTools.map((t) => {
                const isInstallingThis = installingPkg === t.package_name;
                return (
                  <div
                    key={t.package_name}
                    className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/60 flex items-center justify-between gap-4"
                  >
                    <div className="space-y-0.5 flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-slate-200 text-xs font-mono">{t.display_name}</span>
                        <span className="text-[10px] bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">
                          {t.category}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate">{t.description}</p>
                    </div>

                    <button
                      onClick={() => handleInstall(t.package_name)}
                      disabled={installingPkg !== null}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-xs font-medium text-white flex items-center gap-1.5 transition-colors shrink-0"
                    >
                      {isInstallingThis ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Installing...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-3.5 h-3.5" />
                          <span>Install</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {installStep && (
              <div className="p-2.5 bg-slate-950 border border-emerald-500/40 rounded-lg text-emerald-400 text-xs flex items-center gap-2 font-mono">
                <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0 text-emerald-400" />
                <span>{installStep}</span>
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <button
            onClick={() => setShowResetConfirm(true)}
            className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-300 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset Sandbox</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-slate-900 border border-red-500/50 rounded-xl p-6 max-w-md space-y-4 shadow-2xl text-slate-100">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-semibold text-lg">Reset Sandbox Container?</h3>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <p>This action will restore the Linux sandbox container to base state:</p>
              <ul className="list-disc pl-5 space-y-1 text-red-300">
                <li>Remove user-installed tools (`jq`, `git`, etc.)</li>
                <li>Clear temporary sandbox `/workspace` files</li>
                <li>Reset process and tool execution state</li>
              </ul>
              <p className="text-slate-400 pt-1">
                Assessments, findings, reports, and conversation history will remain preserved.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={resetting}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleResetSandbox}
                disabled={resetting}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-xs font-medium text-white flex items-center gap-2"
              >
                {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Confirm Reset</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
