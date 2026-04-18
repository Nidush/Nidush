import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../utils/supabase';

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

export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        loadNotifications(user.id);
      }
    };
    fetchUser();
  }, []);

  const loadNotifications = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', uid)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load notifications from Supabase:', error);
        return;
      }
      
      const mapped: AppNotification[] = data.map((n: any) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        timestamp: new Date(n.created_at).getTime(),
        read: n.read,
      }));
      setNotifications(mapped);
    } catch (e) {
      console.error('Error fetching notifications:', e);
    }
  };

  const addNotification = async (title: string, message: string, type: AppNotification['type']) => {
    if (!userId) return;

    // We can optimistically add it locally based on a temporary ID, or just insert and reload.
    // Optimistic UI update:
    const tempId = Date.now().toString();
    const newNotification: AppNotification = {
      id: tempId,
      title,
      message,
      type,
      timestamp: Date.now(),
      read: false,
    };

    setNotifications((prev) => [newNotification, ...prev]);

    const { error, data } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        title,
        message,
        type,
        read: false
      })
      .select('id, created_at')
      .single();

    if (error) {
      console.error('Error adding notification to Supabase:', error);
      // Revert if error
      setNotifications((prev) => prev.filter(n => n.id !== tempId));
    } else if (data) {
      // Fix temporary ID with actual DB UUID
      setNotifications((prev) => 
        prev.map(n => n.id === tempId ? { ...n, id: data.id, timestamp: new Date(data.created_at).getTime() } : n)
      );
    }
  };

  const markAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (!userId) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (error) console.error('Error marking notification as read in Supabase:', error);
  };

  const markAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (!userId) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) console.error('Error marking all notifications as read in Supabase:', error);
  };

  const clearAll = async () => {
    setNotifications([]);
    if (!userId) return;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) console.error('Error clearing notifications from Supabase:', error);
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
