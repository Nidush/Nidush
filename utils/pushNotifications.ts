import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const PUSH_TOKEN_STORAGE_KEY = 'nidush.push.token';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const getProjectId = () =>
  Constants.easConfig?.projectId ??
  Constants.expoConfig?.extra?.eas?.projectId ??
  null;

export const preparePushNotifications = async () => {
  if (Platform.OS !== 'android') return;

  await Notifications.setNotificationChannelAsync('default', {
    name: 'Default',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#548F53',
    sound: 'default',
  });
};

export const getCurrentPushPermissionStatus = async () => {
  const settings = await Notifications.getPermissionsAsync();
  return settings.status;
};

export const requestPushPermissions = async () => {
  const existing = await Notifications.getPermissionsAsync();
  if (existing.status === 'granted') return existing;

  return Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: true,
      allowSound: true,
    },
  });
};

export const getExpoPushToken = async () => {
  if (Platform.OS === 'web') return null;

  const projectId = getProjectId();
  if (!projectId) {
    throw new Error('Missing Expo projectId for push notifications.');
  }

  const tokenResponse = await Notifications.getExpoPushTokenAsync({ projectId });
  return tokenResponse.data ?? null;
};

export const getStoredPushToken = async () => AsyncStorage.getItem(PUSH_TOKEN_STORAGE_KEY);

export const storePushToken = async (token: string) => {
  await AsyncStorage.setItem(PUSH_TOKEN_STORAGE_KEY, token);
};

export const clearStoredPushToken = async () => {
  await AsyncStorage.removeItem(PUSH_TOKEN_STORAGE_KEY);
};

export const presentLocalNotification = async (title: string, body: string, data?: Record<string, unknown>) => {
  if (Platform.OS === 'web') return;

  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: 'default',
    },
    trigger: null,
  });
};
