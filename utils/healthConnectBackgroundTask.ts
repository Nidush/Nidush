import { Platform } from 'react-native';
import {
  HEALTH_CONNECT_BACKGROUND_INTERVAL_MINUTES,
  syncLatestHealthConnectReading,
} from './healthConnectSync';

const HEALTH_CONNECT_BACKGROUND_TASK = 'nidush-health-connect-background-sync';

// Dynamically require to avoid crashes when the native modules are not linked/present (e.g. in Expo Go, tests, or web)
let TaskManager: any = null;
let BackgroundTask: any = null;

if (Platform.OS === 'android') {
  try {
    TaskManager = require('expo-task-manager');
    BackgroundTask = require('expo-background-task');
  } catch (error) {
    console.warn('[HealthConnect] Failed to dynamically load expo-task-manager or expo-background-task:', error);
  }
}

if (TaskManager && typeof TaskManager.defineTask === 'function') {
  try {
    TaskManager.defineTask(HEALTH_CONNECT_BACKGROUND_TASK, async () => {
      const result = await syncLatestHealthConnectReading();

      if (result.status === 'error' || result.status === 'unavailable') {
        return BackgroundTask?.BackgroundTaskResult?.Failed ?? 3; // 3 corresponds to Failed status
      }

      return BackgroundTask?.BackgroundTaskResult?.Success ?? 1; // 1 corresponds to Success status
    });
  } catch (error) {
    console.error('[HealthConnect] Failed to define background task:', error);
  }
}

export const registerHealthConnectBackgroundSync = async () => {
  if (Platform.OS !== 'android') return;

  if (!BackgroundTask || !TaskManager) {
    console.warn('[HealthConnect] Background sync unavailable: TaskManager or BackgroundTask modules not loaded.');
    return;
  }

  try {
    const status = await BackgroundTask.getStatusAsync();
    if (status !== BackgroundTask.BackgroundTaskStatus.Available) {
      console.warn('[HealthConnect] background sync unavailable via BackgroundTask status:', status);
      return;
    }

    await BackgroundTask.registerTaskAsync(HEALTH_CONNECT_BACKGROUND_TASK, {
      minimumInterval: HEALTH_CONNECT_BACKGROUND_INTERVAL_MINUTES,
    });

    console.log('[HealthConnect] background sync registered');
  } catch (error) {
    console.warn('[HealthConnect] background sync registration failed:', error);
  }
};
