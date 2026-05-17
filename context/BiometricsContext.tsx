import { UserState, WearableData } from '@/constants/data/types';
import { inferStateFromData } from '@/utils/biometricLogic';
import { generateBiometricsFromStress } from '@/utils/biometricSimulator';
import { supabase } from '@/utils/supabase';
import { useSegments } from 'expo-router';
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { Platform } from 'react-native';
import { useNotifications } from './NotificationsContext';

interface BiometricsContextType {
  data: WearableData | null;
  currentState: UserState;
  addTestHeartRate: (heartRate: number) => Promise<void>;
}

const BiometricsContext = createContext<BiometricsContextType | undefined>(
  undefined,
);

const HEALTH_CONNECT_SYNC_INTERVAL_MS = 30 * 60 * 1000;
const SIMULATED_SYNC_INTERVAL_MS = 30000;

type HealthConnectHeartRateSample = {
  beatsPerMinute: number;
  time: string;
};

type HealthConnectHeartRateRecord = {
  startTime?: string;
  endTime?: string;
  samples?: HealthConnectHeartRateSample[];
  metadata?: {
    id?: string;
    dataOrigin?: string;
  };
};

const deriveBiometricsFromHeartRate = (
  heartRate: number,
  timestamp: number,
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
  const segments = useSegments();

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

  useEffect(() => {
    const isOnboarding = segments.some(
      (segment) => segment === 'onboarding' || segment === 'profile-selection',
    );

    if (isOnboarding) return;

    let isMounted = true;
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;

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
    };

    const startFallbackSimulation = () => {
      if (fallbackInterval) return;
      useSimulatedBiometrics();
      fallbackInterval = setInterval(
        useSimulatedBiometrics,
        SIMULATED_SYNC_INTERVAL_MS,
      );
    };

    const syncHealthConnectHeartRate = async () => {
      if (Platform.OS !== 'android') {
        startFallbackSimulation();
        return;
      }

      try {
        const {
          initialize,
          getGrantedPermissions,
          readRecords,
        } = require('react-native-health-connect');

        const initialized = await initialize();
        if (!initialized) {
          startFallbackSimulation();
          return;
        }

        const grantedPermissions = await getGrantedPermissions();
        const canReadHeartRate = grantedPermissions.some(
          (permission: { accessType?: string; recordType?: string }) =>
            permission.accessType === 'read' &&
            permission.recordType === 'HeartRate',
        );

        if (!canReadHeartRate) {
          startFallbackSimulation();
          return;
        }

        const endTime = new Date();
        const startTime = new Date(
          endTime.getTime() - HEALTH_CONNECT_SYNC_INTERVAL_MS,
        );

        const result = await readRecords('HeartRate', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
          },
          ascendingOrder: false,
        });

        const samples = ((result?.records || result?.result || []) as HealthConnectHeartRateRecord[])
          .flatMap((record) =>
            (record.samples || []).map((sample) => ({
              ...sample,
              sourceRecordId: record.metadata?.id || null,
              dataOrigin: record.metadata?.dataOrigin || 'health_connect',
              rawRecord: record,
            })),
          )
          .filter((sample) => Number.isFinite(sample.beatsPerMinute))
          .sort(
            (a, b) =>
              new Date(b.time).getTime() - new Date(a.time).getTime(),
          );

        if (!samples.length) {
          startFallbackSimulation();
          return;
        }

        if (fallbackInterval) {
          clearInterval(fallbackInterval);
          fallbackInterval = null;
        }

        const {
          data: { user },
        } = await supabase.auth.getUser();

        const latest = samples[0];
        const latestData = deriveBiometricsFromHeartRate(
          latest.beatsPerMinute,
          new Date(latest.time).getTime(),
        );

        if (user) {
          const rows = samples.map((sample) => {
            const sampleData = deriveBiometricsFromHeartRate(
              sample.beatsPerMinute,
              new Date(sample.time).getTime(),
            );

            return {
              user_id: user.id,
              device_id: 'health_connect',
              source: sample.dataOrigin,
              source_record_id: sample.sourceRecordId || `${sample.time}:${sample.beatsPerMinute}`,
              recorded_at: sample.time,
              heart_rate: sampleData.heartRate,
              hrv: sampleData.hrv,
              skin_temperature: sampleData.skinTemperature,
              eda: sampleData.eda,
              stress_score: sampleData.stressScore,
              detected_state: sampleData.detectedState,
              raw_payload: sample.rawRecord,
            };
          });

          const { error } = await supabase
            .from('biometric_readings')
            .upsert(rows, {
              onConflict: 'user_id,source,recorded_at,source_record_id',
            });

          if (error) {
            console.error('Failed to save biometric readings:', error);
          }
        }

        if (!isMounted) return;

        notifyStateChange(latestData.detectedState);
        setCurrentState(latestData.detectedState);
        setData(latestData);
      } catch (error) {
        console.warn('Health Connect heart rate sync failed:', error);
        startFallbackSimulation();
      }
    };

    syncHealthConnectHeartRate();
    const healthConnectInterval = setInterval(
      syncHealthConnectHeartRate,
      HEALTH_CONNECT_SYNC_INTERVAL_MS,
    );

    return () => {
      isMounted = false;
      clearInterval(healthConnectInterval);
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [segments, addNotification]);

  return (
    <BiometricsContext.Provider value={{ data, currentState, addTestHeartRate }}>
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
