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
  loadMore: () => void;
  refreshNotifications: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
}



const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const PAGE_SIZE = 10;


  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        loadNotifications(user.id);
      } else {
        setUserId(null);
        setNotifications([]);
      }
    };
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        loadNotifications(session.user.id);
      } else {
        setUserId(null);
        setNotifications([]);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadNotifications = async (uid: string, isNextPage = false) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const currentPage = isNextPage ? page + 1 : 0;
      const start = currentPage * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;

      console.log(`[API] Notificações - Página ${currentPage}: A pedir itens ${start} a ${end}...`);
      
      // Adicionar um pequeno atraso para a animação ser visível no vídeo de entrega
      await new Promise(resolve => setTimeout(resolve, 800));

      const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })

        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) {
        console.error('Failed to load notifications from Supabase:', error);
        setIsLoading(false);
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

      if (isNextPage) {
        setNotifications((prev) => [...prev, ...mapped]);
      } else {
        setNotifications(mapped);
      }

      setPage(currentPage);
      if (count !== null) {
        setHasMore(start + mapped.length < count);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMore = () => {
    if (userId && hasMore && !isLoading) {
      loadNotifications(userId, true);
    }
  };

  const refreshNotifications = async () => {
    if (userId) {
      await loadNotifications(userId, false);
    }
  };

  const ensurePublicUser = async (uid: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { error } = await supabase
      .from('users')
      .upsert({
        auth_uid: uid,
        email: user.email || '',
        first_name: user.user_metadata?.first_name || '',
        last_name: user.user_metadata?.last_name || '',
      }, { onConflict: 'auth_uid' });

    if (error) {
      console.error('Error ensuring public user before notification:', error);
      return false;
    }

    return true;
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

    const hasPublicUser = await ensurePublicUser(userId);
    if (!hasPublicUser) {
      setNotifications((prev) => prev.filter(n => n.id !== tempId));
      return;
    }

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
        loadMore,
        refreshNotifications,
        hasMore,
        isLoading,
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
