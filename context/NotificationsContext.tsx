import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'state_change' | 'creation' | 'system';
  timestamp: number;
  read: boolean;
}

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (title: string, message: string, type: AppNotification['type']) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

const NOTIFICATIONS_STORAGE_KEY = '@nidush_notifications';

export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    const loadNotifications = async () => {
      try {
        const storedValue = await AsyncStorage.getItem(NOTIFICATIONS_STORAGE_KEY);
        if (storedValue) {
          setNotifications(JSON.parse(storedValue));
        }
      } catch (e) {
        console.error('Failed to load notifications from storage', e);
      }
    };
    loadNotifications();
  }, []);

  const saveNotifications = async (newNotifications: AppNotification[]) => {
    try {
      await AsyncStorage.setItem(NOTIFICATIONS_STORAGE_KEY, JSON.stringify(newNotifications));
    } catch (e) {
      console.error('Failed to save notifications to storage', e);
    }
  };

  const addNotification = (title: string, message: string, type: AppNotification['type']) => {
    const newNotification: AppNotification = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title,
      message,
      type,
      timestamp: Date.now(),
      read: false,
    };
    setNotifications((prev) => {
      const updated = [newNotification, ...prev];
      saveNotifications(updated);
      return updated;
    });
  };

  const markAsRead = (id: string) => {
    setNotifications((prev) => {
      const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
      saveNotifications(updated);
      return updated;
    });
  };

  const markAllAsRead = () => {
    setNotifications((prev) => {
      const updated = prev.map((n) => ({ ...n, read: true }));
      saveNotifications(updated);
      return updated;
    });
  };

  const clearAll = () => {
    setNotifications([]);
    saveNotifications([]);
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        unreadCount,
        addNotification,
        markAsRead,
        markAllAsRead,
        clearAll,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
};
