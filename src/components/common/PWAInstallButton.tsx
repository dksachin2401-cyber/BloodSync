import React, { useState } from 'react';
import { Download, Smartphone, Share, PlusSquare, X, Monitor } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  className?: string;
  variant?: 'navbar' | 'compact' | 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  className = '',
  variant = 'navbar',
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [showDesktopGuide, setShowDesktopGuide] = useState(false);
  const [installing, setInstalling] = useState(false);

  // If already running as an installed PWA on home screen, hide
  if (isInstalled) {
    return null;
  }

  const handleInstallClick = async () => {
    setInstalling(true);
    try {
      await install();
    } finally {
      setInstalling(false);
    }
  };

  // Chromium / Android / Desktop PWA flow
  if (isInstallable) {
    if (variant === 'banner') {
      return (
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-white shadow-sm flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center">
              <Smartphone className="w-4 h-4 text-red-400" />
            </div>
            <div>
              <div className="font-semibold text-xs text-white">Emergency Transfusion Network Mobile Client</div>
              <div className="text-[11px] text-slate-400">
                Install as a standalone application for offline access, real-time dispatch tracking, and priority alerts.
              </div>
            </div>
          </div>
          <button
            onClick={handleInstallClick}
            disabled={installing}
            className="px-3.5 py-2 rounded-lg bg-red-700 hover:bg-red-800 text-white font-medium text-xs shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            {installing ? 'Installing...' : 'Install Official App'}
          </button>
        </div>
      );
    }

    return (
      <button
        onClick={handleInstallClick}
        disabled={installing}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-red-700 hover:bg-red-800 text-white shadow-xs transition-colors cursor-pointer ${className}`}
        title="Install BloodGrid client on mobile home screen or desktop"
      >
        <Download className="w-3.5 h-3.5" />
        <span>{installing ? 'Installing...' : 'Install App'}</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-neutral-300 dark:border-neutral-700 bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-200 hover:bg-neutral-50 dark:hover:bg-neutral-700 transition-colors cursor-pointer ${className}`}
          title="Add to Home Screen (iOS Safari)"
        >
          <Smartphone className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
          <span>Add to iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-xl bg-white dark:bg-neutral-900 p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-4">
                <div className="flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-red-700" />
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    Install on iOS / iPadOS
                  </h3>
                </div>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 text-xs leading-relaxed">
                <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <div className="w-6 h-6 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 flex items-center justify-center shrink-0 font-bold text-xs">
                    1
                  </div>
                  <div>
                    Tap the <strong className="text-neutral-900 dark:text-white">Share</strong> button (<Share className="w-3.5 h-3.5 inline mx-0.5 text-blue-500" />) in your Safari toolbar.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <div className="w-6 h-6 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 flex items-center justify-center shrink-0 font-bold text-xs">
                    2
                  </div>
                  <div>
                    Scroll down and select <strong className="text-neutral-900 dark:text-white">Add to Home Screen</strong> (<PlusSquare className="w-3.5 h-3.5 inline mx-0.5 text-neutral-500" />).
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                  <div className="w-6 h-6 rounded bg-neutral-200 dark:bg-neutral-700 text-neutral-800 dark:text-neutral-200 flex items-center justify-center shrink-0 font-bold text-xs">
                    3
                  </div>
                  <div>
                    Tap <strong className="text-neutral-900 dark:text-white">Add</strong> in the top right to complete installation.
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full py-2 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                Close Instructions
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  // Fallback for browsers that don't trigger beforeinstallprompt yet (or desktop Safari/Firefox)
  return (
    <>
      <button
        onClick={() => setShowDesktopGuide(true)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border border-neutral-300 dark:border-neutral-700 hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 transition-colors cursor-pointer ${className}`}
        title="Application Installation Instructions"
      >
        <Smartphone className="w-3.5 h-3.5 text-neutral-600 dark:text-neutral-300" />
        <span>Install App</span>
      </button>

      {showDesktopGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-xl bg-white dark:bg-neutral-900 p-6 shadow-2xl border border-neutral-200 dark:border-neutral-800 text-neutral-800 dark:text-neutral-200">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-neutral-800 mb-4">
              <div className="flex items-center gap-2">
                <Monitor className="w-4 h-4 text-red-700" />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  Client Installation Instructions
                </h3>
              </div>
              <button
                onClick={() => setShowDesktopGuide(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs leading-relaxed">
              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                <strong className="block text-neutral-900 dark:text-white mb-1 font-semibold">Desktop (Chrome / Edge / Brave):</strong>
                Click the installation icon in your browser address bar on the right, or go to Menu (⋮) &gt; Save and share &gt; Install Page as App.
              </div>
              <div className="p-3 rounded-lg bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700">
                <strong className="block text-neutral-900 dark:text-white mb-1 font-semibold">Mobile Devices:</strong>
                Open the browser options menu (⋮ or Share) and tap &quot;Add to Home Screen&quot;.
              </div>
            </div>

            <button
              onClick={() => setShowDesktopGuide(false)}
              className="mt-5 w-full py-2 rounded-lg bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 text-xs font-semibold hover:opacity-90 transition-opacity cursor-pointer"
            >
              Acknowledged
            </button>
          </div>
        </div>
      )}
    </>
  );
};
