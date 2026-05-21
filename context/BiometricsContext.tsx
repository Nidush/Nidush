import { UserState, WearableData } from '@/constants/data/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getBiometricBaselineSnapshot,
  hydrateBiometricBaseline,
  inferStateFromData,
} from '@/utils/biometricLogic';
import { generateBiometricsFromStress } from '@/utils/biometricSimulator';
import {
  HEALTH_CONNECT_SYNC_INTERVAL_MS,
  HealthConnectSyncResult,
  syncLatestHealthConnectReading,
} from '@/utils/healthConnectSync';
import { supabase } from '@/utils/supabase';
import { useSegments } from 'expo-router';
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { AppState } from 'react-native';
import { useNotifications } from './NotificationsContext';

interface BiometricsContextType {
  data: WearableData | null;
  currentState: UserState;
  addTestHeartRate: (heartRate: number) => Promise<void>;
  syncHealthConnectNow: () => Promise<HealthConnectSyncResult>;
}

const BiometricsContext = createContext<BiometricsContextType | undefined>(
  undefined,
);

const BIOMETRIC_BASELINE_STORAGE_KEY = '@biometric_baseline_v1';

const deriveBiometricsFromHeartRate = (
  heartRate: number,
  timestamp: number,
  source = 'health_connect',
): WearableData => {
  let hrv = 85;
  let eda = 2;
  let stressScore = 15;

  if (heartRate >= 105) {
    hrv = 25;
    eda = 15;
    stressScore = 88;
  } else if (heartRate >= 90) {
    hrv = 38;
    eda = 8;
    stressScore = 68;
  } else if (heartRate >= 72) {
    hrv = 65;
    eda = 3;
    stressScore = 35;
  }

  return {
    deviceId: 'health_connect',
    source,
    timestamp,
    heartRate,
    hrv,
    skinTemperature: 36.5,
    eda,
    stressScore,
    detectedState: inferStateFromData(heartRate, hrv, eda),
  };
};

export const BiometricsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [data, setData] = useState<WearableData | null>(null);
  const [currentState, setCurrentState] = useState<UserState>('RELAXED');
  const { addNotification } = useNotifications();

  const stressLevelRef = useRef(10);
  const trendRef = useRef<'UP' | 'DOWN'>('UP');
  const lastStateRef = useRef<UserState>('RELAXED');
  const lastHealthConnectSyncRef = useRef(0);
  const segments = useSegments();

  const persistBaselineSnapshot = async () => {
    try {
      const snapshot = getBiometricBaselineSnapshot();
      await AsyncStorage.setItem(
        BIOMETRIC_BASELINE_STORAGE_KEY,
        JSON.stringify(snapshot),
      );
    } catch (error) {
      console.warn('[Biometrics] Failed to persist baseline snapshot:', error);
    }
  };

  const restoreBaselineSnapshot = async () => {
    try {
      const stored = await AsyncStorage.getItem(BIOMETRIC_BASELINE_STORAGE_KEY);
      if (!stored) return;

      const parsed = JSON.parse(stored);
      hydrateBiometricBaseline(parsed);
    } catch (error) {
      console.warn('[Biometrics] Failed to restore baseline snapshot:', error);
    }
  };

  const notifyStateChange = (newState: UserState) => {
    if (newState !== lastStateRef.current) {
      addNotification(
        'Mood Update',
        `You're now feeling ${newState.toLowerCase()}`,
        'state_change'
      );
      lastStateRef.current = newState;
    }
  };

  const addTestHeartRate = async (heartRate: number) => {
    const now = Date.now();
    const safeHeartRate = Math.max(40, Math.min(180, Math.round(heartRate)));
    const testData = deriveBiometricsFromHeartRate(safeHeartRate, now);

    notifyStateChange(testData.detectedState);
    setCurrentState(testData.detectedState);
    setData(testData);
    await persistBaselineSnapshot();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const recordedAt = new Date(now).toISOString();
    const { error } = await supabase.from('biometric_readings').insert({
      user_id: user.id,
      device_id: 'manual_test',
      source: 'manual_test',
      source_record_id: `manual:${recordedAt}:${safeHeartRate}`,
      recorded_at: recordedAt,
      heart_rate: testData.heartRate,
      hrv: testData.hrv,
      skin_temperature: testData.skinTemperature,
      eda: testData.eda,
      stress_score: testData.stressScore,
      detected_state: testData.detectedState,
      raw_payload: {
        createdFrom: 'profile_test_button',
        heartRate: safeHeartRate,
      },
    });

    if (error) throw error;
  };

  const syncHealthConnectNow = async (): Promise<HealthConnectSyncResult> => {
    const result = await syncLatestHealthConnectReading();

    if (result.latest) {
      notifyStateChange(result.latest.detectedState);
      setCurrentState(result.latest.detectedState);
      setData(result.latest);
      await persistBaselineSnapshot();
    }

    return result;
  };

  useEffect(() => {
    const isOnboarding = segments.some(
      (segment) => segment === 'onboarding' || segment === 'profile-selection',
    );

    if (isOnboarding) return;

    let isMounted = true;
    const useSimulatedBiometrics = () => {
      if (trendRef.current === 'UP') {
        stressLevelRef.current += Math.floor(Math.random() * 5) + 1;
        if (stressLevelRef.current >= 85 || Math.random() < 0.12) {
          trendRef.current = 'DOWN';
        }
      } else {
        stressLevelRef.current -= Math.floor(Math.random() * 4) + 1;
        if (stressLevelRef.current <= 15 || Math.random() < 0.08) {
          trendRef.current = 'UP';
        }
      }

      stressLevelRef.current = Math.max(
        0,
        Math.min(100, stressLevelRef.current),
      );

      const newData = generateBiometricsFromStress(stressLevelRef.current);
      const newState = newData.detectedState;

      notifyStateChange(newState);

      setCurrentState(newState);
      setData(newData);
      void persistBaselineSnapshot();
    };

    const startFallbackSimulation = () => {
      useSimulatedBiometrics();
    };

    const syncHealthConnectHeartRate = async () => {
      lastHealthConnectSyncRef.current = Date.now();

      const result = await syncHealthConnectNow();
      if (!isMounted) return;

      if (
        result.status !== 'synced' &&
        result.status !== 'no_data' &&
        result.status !== 'no_permission'
      ) {
        startFallbackSimulation();
      }
    };

    let healthConnectInterval: ReturnType<typeof setInterval> | null = null;
    let appStateSubscription: ReturnType<typeof AppState.addEventListener> | null =
      null;

    const initializeBiometrics = async () => {
      await restoreBaselineSnapshot();
      if (!isMounted) return;

      await syncHealthConnectHeartRate();
      if (!isMounted) return;

      healthConnectInterval = setInterval(
        syncHealthConnectHeartRate,
        HEALTH_CONNECT_SYNC_INTERVAL_MS,
      );
      appStateSubscription = AppState.addEventListener(
        'change',
        (nextAppState) => {
          if (nextAppState !== 'active') return;

          const elapsed = Date.now() - lastHealthConnectSyncRef.current;
          if (elapsed >= HEALTH_CONNECT_SYNC_INTERVAL_MS) {
            syncHealthConnectHeartRate();
          }
        },
      );
    };

    void initializeBiometrics();

    return () => {
      isMounted = false;
      if (healthConnectInterval) clearInterval(healthConnectInterval);
      appStateSubscription?.remove();
    };
  }, [segments, addNotification]);

  return (
    <BiometricsContext.Provider
      value={{ data, currentState, addTestHeartRate, syncHealthConnectNow }}
    >
      {children}
    </BiometricsContext.Provider>
  );
};

export const useBiometrics = () => {
  const context = useContext(BiometricsContext);
  if (!context)
    throw new Error('useBiometrics must be used within a BiometricsProvider');
  return context;
};
