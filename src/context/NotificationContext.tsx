import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { NotificationItem } from '../types';
import { api } from '../services/api';
import { useAuth } from './AuthContext';

interface NotificationContextType {
  notifications: NotificationItem[];
  unreadCount: number;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
  latestUrgentAlert: NotificationItem | null;
  dismissUrgentAlert: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, currentRole } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [latestUrgentAlert, setLatestUrgentAlert] = useState<NotificationItem | null>(null);

  const refreshNotifications = useCallback(async () => {
    try {
      const data = await api.getNotifications(currentUser.id, currentRole);
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);

      // Check for unread critical or urgent alerts
      const criticalUnread = data.notifications.find(
        (n) => !n.read && (n.urgency === 'critical' || n.urgency === 'urgent')
      );
      if (criticalUnread) {
        setLatestUrgentAlert(criticalUnread);
      }
    } catch {
      // In case server is starting up, ignore silent fetch errors
    }
  }, [currentUser.id, currentRole]);

  useEffect(() => {
    refreshNotifications();
    const interval = setInterval(refreshNotifications, 8000); // Poll every 8s for live response updates
    return () => clearInterval(interval);
  }, [refreshNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      if (latestUrgentAlert?.id === id) {
        setLatestUrgentAlert(null);
      }
    } catch (err) {
      console.warn('Failed to mark notification read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.markAllNotificationsRead(currentUser.id, currentRole);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
      setLatestUrgentAlert(null);
    } catch (err) {
      console.warn('Failed to mark all read:', err);
    }
  };

  const dismissUrgentAlert = () => {
    if (latestUrgentAlert) {
      markAsRead(latestUrgentAlert.id);
      setLatestUrgentAlert(null);
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        refreshNotifications,
        latestUrgentAlert,
        dismissUrgentAlert,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
