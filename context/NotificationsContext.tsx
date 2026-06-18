import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSessionUser, supabase } from '../utils/supabase';
import { Platform } from 'react-native';
import {
  clearStoredPushToken,
  getCurrentPushPermissionStatus,
  getExpoPushToken,
  getStoredPushToken,
  preparePushNotifications,
  presentLocalNotification,
  requestPushPermissions,
  storePushToken,
} from '../utils/pushNotifications';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'state_change' | 'creation' | 'system';
  timestamp: number;
  read: boolean;
}

type NotificationRow = {
  id: string;
  title: string;
  message: string;
  type: AppNotification['type'];
  created_at: string;
  read: boolean;
};

type NotificationInsertResult = {
  id: string;
  created_at: string;
};

type ErrorWithStatus = {
  message?: string;
  status?: number;
  code?: string;
};

interface NotificationsContextType {
  notifications: AppNotification[];
  unreadCount: number;
  addNotification: (title: string, message: string, type: AppNotification['type']) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  loadMore: () => void;
  refreshNotifications: () => Promise<void>;
  notificationsEnabled: boolean;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
}



const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);
const NOTIFICATIONS_ENABLED_KEY = 'nidush.notifications.enabled';

const mergeUniqueNotifications = (
  current: AppNotification[],
  incoming: AppNotification[],
) => {
  const byId = new Map<string, AppNotification>();

  [...current, ...incoming].forEach((notification) => {
    byId.set(notification.id, notification);
  });

  return Array.from(byId.values()).sort((a, b) => b.timestamp - a.timestamp);
};

const isRangeExhaustedError = (error: ErrorWithStatus) => {
  const message = String(error.message || '').toLowerCase();
  return (
    error.status === 416 ||
    error.code === 'PGRST103' ||
    message.includes('range') ||
    message.includes('satisfiable')
  );
};

export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabledState] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const pushTokenRef = useRef<string | null>(null);
  const isLoadingRef = useRef(false);
  const hasMoreRef = useRef(false);
  const pageRef = useRef(0);
  const PAGE_SIZE = 10;

  const setPageState = (nextPage: number) => {
    pageRef.current = nextPage;
    setPage(nextPage);
  };

  const setHasMoreState = (nextHasMore: boolean) => {
    hasMoreRef.current = nextHasMore;
    setHasMore(nextHasMore);
  };

  useEffect(() => {
    void preparePushNotifications().catch((error) => {
      console.error('Error preparing push notifications:', error);
    });

    const loadNotificationSetting = async () => {
      try {
        const stored = await AsyncStorage.getItem(NOTIFICATIONS_ENABLED_KEY);
        if (stored !== null) {
          setNotificationsEnabledState(stored === 'true');
        }
      } catch (error) {
        console.error('Error loading notifications preference:', error);
      }
    };

    loadNotificationSetting();
  }, []);

  const syncPushTokenForUser = useCallback(async (uid: string, token: string) => {
    const { error } = await supabase
      .from('user_push_tokens')
      .upsert({
        user_id: uid,
        expo_push_token: token,
        platform: Platform.OS,
        last_seen_at: new Date().toISOString(),
      }, { onConflict: 'expo_push_token' });

    if (error) {
      console.error('Error saving push token:', error);
      return false;
    }

    pushTokenRef.current = token;
    await storePushToken(token);
    return true;
  }, []);

  const removePushTokenForUser = useCallback(async (uid: string) => {
    const token = pushTokenRef.current ?? await getStoredPushToken();
    if (!token) return;

    const { error } = await supabase
      .from('user_push_tokens')
      .delete()
      .eq('user_id', uid)
      .eq('expo_push_token', token);

    if (error) {
      console.error('Error deleting push token:', error);
      return;
    }

    pushTokenRef.current = null;
    await clearStoredPushToken();
  }, []);

  const ensurePushRegistration = useCallback(async (uid: string, promptForPermission: boolean) => {
    if (Platform.OS === 'web') return false;

    try {
      const permission = promptForPermission
        ? await requestPushPermissions()
        : await getCurrentPushPermissionStatus().then((status) => ({ status }));

      if (permission.status !== 'granted') {
        return false;
      }

      const token = await getExpoPushToken();
      if (!token) return false;

      return syncPushTokenForUser(uid, token);
    } catch (error) {
      console.error('Error registering push notifications:', error);
      return false;
    }
  }, [syncPushTokenForUser]);

  const setNotificationsEnabled = useCallback(async (enabled: boolean) => {
    try {
      if (enabled && userId) {
        const didRegister = await ensurePushRegistration(userId, true);
        setNotificationsEnabledState(didRegister);
        await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(didRegister));
        return;
      }

      if (!enabled && userId) {
        await removePushTokenForUser(userId);
      }

      setNotificationsEnabledState(enabled);
      await AsyncStorage.setItem(NOTIFICATIONS_ENABLED_KEY, String(enabled));
    } catch (error) {
      console.error('Error saving notifications preference:', error);
    }
  }, [ensurePushRegistration, removePushTokenForUser, userId]);

  useEffect(() => {
    if (!userId || !notificationsEnabled || Platform.OS === 'web') return;

    void ensurePushRegistration(userId, false).then((didRegister) => {
      if (!didRegister) {
        console.warn('Push notifications are enabled locally but no valid push token is currently registered.');
      }
    });
  }, [ensurePushRegistration, notificationsEnabled, userId]);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getSessionUser();
      if (user) {
        setUserId(user.id);
        setHasMoreState(false);
        setPageState(0);
        loadNotifications(user.id);
      } else {
        setUserId(null);
        setNotifications([]);
        setHasMoreState(false);
        setPageState(0);
      }
    };
    fetchUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        setHasMoreState(false);
        setPageState(0);
        loadNotifications(session.user.id);
      } else {
        setUserId(null);
        setNotifications([]);
        setHasMoreState(false);
        setPageState(0);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const loadNotifications = useCallback(async (uid: string, isNextPage = false) => {
    if (isLoadingRef.current || (isNextPage && !hasMoreRef.current)) return;
    isLoadingRef.current = true;
    setIsLoading(true);

    try {
      const currentPage = isNextPage ? pageRef.current + 1 : 0;
      const start = currentPage * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;

      console.log(`[API] Notificações - Página ${currentPage}: A pedir itens ${start} a ${end}...`);
      
      const { data, error, count } = await supabase
        .from('notifications')
        .select('*', { count: 'exact' })

        .eq('user_id', uid)
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) {
        if (isNextPage && isRangeExhaustedError(error)) {
          setHasMoreState(false);
        } else {
          console.error('Failed to load notifications from Supabase:', error);
        }
        return;
      }
      
      const pageData = (data ?? []).slice(0, PAGE_SIZE);
      const mapped: AppNotification[] = (pageData as NotificationRow[]).map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: n.type,
        timestamp: new Date(n.created_at).getTime(),
        read: n.read,
      }));

      if (isNextPage) {
        setNotifications((prev) => mergeUniqueNotifications(prev, mapped));
      } else {
        setNotifications(mergeUniqueNotifications([], mapped));
      }

      setPageState(currentPage);
      if (count !== null) {
        setHasMoreState(start + mapped.length < count);
      } else {
        setHasMoreState((data ?? []).length > PAGE_SIZE);
      }
    } catch (e) {
      console.error('Error fetching notifications:', e);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, []);

  const loadMore = useCallback(() => {
    if (userId && hasMoreRef.current && !isLoadingRef.current) {
      void loadNotifications(userId, true);
    }
  }, [loadNotifications, userId]);

  const refreshNotifications = useCallback(async () => {
    if (userId) {
      setHasMoreState(false);
      setPageState(0);
      await loadNotifications(userId, false);
    }
  }, [loadNotifications, userId]);

  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          void refreshNotifications();
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [refreshNotifications, userId]);

  const ensurePublicUser = useCallback(async (uid: string) => {
    const user = await getSessionUser();
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
  }, []);



  const addNotification = useCallback(async (title: string, message: string, type: AppNotification['type']) => {
    if (!notificationsEnabled) return;
    if (!userId) return;

    void presentLocalNotification(title, message, { type, source: 'local-app' });

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
        prev.map((n) =>
          n.id === tempId
            ? {
                ...n,
                id: (data as NotificationInsertResult).id,
                timestamp: new Date((data as NotificationInsertResult).created_at).getTime(),
              }
            : n,
        )
      );

      void supabase.functions.invoke('send-push-notification', {
        body: {
          title,
          message,
          data: {
            type,
            notificationId: (data as NotificationInsertResult).id,
          },
        },
      });
    }
  }, [ensurePublicUser, notificationsEnabled, userId]);

  const markAsRead = useCallback(async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    if (!userId) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', id);

    if (error) console.error('Error marking notification as read in Supabase:', error);
  }, [userId]);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    if (!userId) return;

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);

    if (error) console.error('Error marking all notifications as read in Supabase:', error);
  }, [userId]);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    setHasMoreState(false);
    setPageState(0);
    if (!userId) return;

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('user_id', userId);

    if (error) console.error('Error clearing notifications from Supabase:', error);
  }, [userId]);

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
        notificationsEnabled,
        setNotificationsEnabled,
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
