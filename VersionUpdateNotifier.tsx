import React, { useState, useEffect, useRef } from 'react';
import { Zap, RefreshCw, X } from 'lucide-react';

interface VersionPayload {
  version: string;
  builtAt?: string;
}

const POLL_INTERVAL_MS = 4 * 60 * 1000; // 4 minutes

export function VersionUpdateNotifier() {
  const [hasUpdate, setHasUpdate] = useState(false);
  const [newVersion, setNewVersion] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const initialVersionRef = useRef<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const checkVersion = async () => {
      try {
        const response = await fetch(`/version.json?t=${Date.now()}`, {
          cache: 'no-store',
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        });

        if (!response.ok) return;

        const data: VersionPayload = await response.json();
        if (!data || !data.version) return;

        if (initialVersionRef.current === null) {
          // First poll records the loaded runtime version
          initialVersionRef.current = data.version;
        } else if (data.version !== initialVersionRef.current) {
          // Version has changed in new deployment
          if (isMounted) {
            setNewVersion(data.version);
            setHasUpdate(true);
            setDismissed(false);
          }
        }
      } catch (err) {
        // Silent failure in background poll
      }
    };

    // Initial check on mount
    checkVersion();

    // 4-minute interval polling
    const intervalId = setInterval(checkVersion, POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const handleUpdate = () => {
    try {
      // Force reload from server
      (window.location as any).reload(true);
    } catch {
      window.location.reload();
    }
  };

  if (!hasUpdate || dismissed) {
    return null;
  }

  return (
    <div 
      role="alert"
      aria-live="polite"
      className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] w-[94%] max-w-2xl transition-all duration-300 ease-out animate-bounce-in"
    >
      <div className="relative overflow-hidden rounded-2xl bg-[#070B18]/95 border border-amber-500/80 shadow-[0_12px_40px_rgba(0,0,0,0.9),0_0_25px_rgba(245,158,11,0.25)] backdrop-blur-xl px-4 py-3 sm:px-5 sm:py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-white">
        {/* Ambient Top Glow Line */}
        <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent" />
        
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-black flex-shrink-0 shadow-lg shadow-amber-500/30">
            <Zap className="w-5 h-5 fill-slate-950 text-slate-950 animate-pulse" />
          </div>
          <div>
            <div className="text-[11px] font-mono uppercase font-black text-amber-400 tracking-wider flex items-center gap-1.5">
              <span>⚡ YOUNGFIRE SYSTEM UPDATE AVAILABLE</span>
              {newVersion && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  v{newVersion}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-300 font-medium">
              Tap to refresh and load the latest sanctuary features
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
          <button
            onClick={handleUpdate}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer flex items-center gap-1.5 whitespace-nowrap"
          >
            <RefreshCw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '3s' }} />
            UPDATE NOW
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            title="Dismiss notice"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
