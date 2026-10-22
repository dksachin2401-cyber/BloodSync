import React from 'react';
import { AlertCircle, X, ArrowRight, Radio } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

interface EmergencyAlertBannerProps {
  onViewRequest?: (requestId: string) => void;
}

export const EmergencyAlertBanner: React.FC<EmergencyAlertBannerProps> = ({ onViewRequest }) => {
  const { latestUrgentAlert, dismissUrgentAlert } = useNotifications();

  if (!latestUrgentAlert) return null;

  return (
    <aside aria-label="Emergency Dispatch Banner" className="bg-neutral-950 text-neutral-100 border-b border-red-950/80 px-4 py-2 relative z-50 shadow-md">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-950/80 border border-red-700/60 text-red-400 text-[10px] font-extrabold tracking-wider uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
            <span>Crisis Dispatch</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-neutral-200">
              {latestUrgentAlert.title}
            </span>
            <span className="text-neutral-400 hidden md:inline text-xs">
              — {latestUrgentAlert.message}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {latestUrgentAlert.linkRequestId && onViewRequest && (
            <button
              onClick={() => {
                if (latestUrgentAlert.linkRequestId) {
                  onViewRequest(latestUrgentAlert.linkRequestId);
                }
              }}
              className="inline-flex items-center gap-1.5 font-bold text-xs bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded-lg transition-colors shadow-sm cursor-pointer"
            >
              Coordinate Units <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={dismissUrgentAlert}
            className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors cursor-pointer"
            title="Dismiss Alert"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
