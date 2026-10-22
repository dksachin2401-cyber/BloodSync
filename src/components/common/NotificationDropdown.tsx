import React, { useRef, useEffect } from 'react';
import { Bell, CheckCheck, Clock, AlertCircle, X, ChevronRight } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';

interface NotificationDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRequest?: (requestId: string) => void;
}

export const NotificationDropdown: React.FC<NotificationDropdownProps> = ({
  isOpen,
  onClose,
  onSelectRequest,
}) => {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-96 max-w-[calc(100vw-2rem)] rounded-2xl bg-white dark:bg-neutral-900 shadow-2xl border border-neutral-200 dark:border-neutral-800 z-50 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-800/40">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-red-600 dark:text-red-400" />
          <h3 className="font-bold text-sm text-neutral-900 dark:text-white">Emergency Notifications</h3>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-600 text-white">
              {unreadCount} new
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllAsRead()}
              className="text-xs text-neutral-500 hover:text-red-600 dark:hover:text-red-400 font-semibold flex items-center gap-1 px-2 py-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800"
            >
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 rounded"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* List */}
      <div className="max-h-[60vh] overflow-y-auto divide-y divide-neutral-100 dark:divide-neutral-800/60">
        {notifications.length === 0 ? (
          <div className="p-8 text-center text-neutral-400 text-xs">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
            No notifications yet
          </div>
        ) : (
          notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (!n.read) markAsRead(n.id);
                if (n.linkRequestId && onSelectRequest) {
                  onSelectRequest(n.linkRequestId);
                  onClose();
                }
              }}
              className={`p-3.5 transition-colors cursor-pointer hover:bg-neutral-50 dark:hover:bg-neutral-800/50 ${
                !n.read ? 'bg-red-50/40 dark:bg-red-950/20' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      !n.read ? 'bg-red-600 animate-pulse' : 'bg-transparent'
                    }`}
                  />
                  <h4 className="font-bold text-xs text-neutral-900 dark:text-neutral-100">
                    {n.title}
                  </h4>
                </div>
                <span className="text-[10px] text-neutral-400 flex items-center gap-1 shrink-0 font-mono">
                  <Clock className="w-3 h-3" />
                  {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 pl-3.5 leading-relaxed">
                {n.message}
              </p>
              {n.linkRequestId && (
                <div className="mt-2 pl-3.5 flex items-center gap-1 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:underline">
                  View Emergency Case #{n.linkRequestId.replace('req-', '')} <ChevronRight className="w-3 h-3" />
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
