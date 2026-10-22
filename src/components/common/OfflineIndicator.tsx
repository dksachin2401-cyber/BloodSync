import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-xl bg-amber-500 text-white px-3.5 py-2 text-xs font-bold shadow-xl border border-amber-400 animate-in slide-in-from-bottom">
      <WifiOff className="w-4 h-4 shrink-0" />
      <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
      <span>Offline Mode — Cached data is being used.</span>
    </div>
  );
};
