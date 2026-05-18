import { UserState, WearableData } from '@/constants/data/types';
import { inferStateFromData } from '@/utils/biometricLogic';
import { supabase } from '@/utils/supabase';
import { Platform } from 'react-native';

export const HEALTH_CONNECT_SYNC_INTERVAL_MS = 60 * 1000;
export const HEALTH_CONNECT_BACKGROUND_INTERVAL_MINUTES = 15;

export const HEALTH_CONNECT_HEART_RATE_PERMISSIONS = [
  { accessType: 'read', recordType: 'HeartRate' },
  { accessType: 'read', recordType: 'RestingHeartRate' },
  { accessType: 'read', recordType: 'BackgroundAccessPermission' },
] as const;

const PREFERRED_HEART_RATE_SOURCES = [
  'com.xiaomi.wearable',
  'com.sec.android.app.shealth',
  'com.samsung.android.app.shealth',
  'com.fitbit.FitbitMobile',
  'com.google.android.apps.fitness',
  'com.huawei.health',
];

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
    dataOrigin?: string | { packageName?: string };
  };
};

type HealthConnectRestingHeartRateRecord = {
  time?: string;
  startTime?: string;
  endTime?: string;
  beatsPerMinute?: number;
  metadata?: {
    id?: string;
    dataOrigin?: string | { packageName?: string };
  };
};

type HealthConnectHeartRateSampleWithSource = HealthConnectHeartRateSample & {
  sourceRecordId: string | null;
  dataOrigin: string;
  recordType: 'HeartRate' | 'RestingHeartRate';
  rawRecord: HealthConnectHeartRateRecord | HealthConnectRestingHeartRateRecord;
};

export type HealthConnectSyncResult = {
  status: 'synced' | 'no_permission' | 'no_data' | 'unavailable' | 'error';
  latest?: WearableData;
  source?: string;
  error?: unknown;
};

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

const getDataOrigin = (
  dataOrigin?: string | { packageName?: string },
): string => {
  if (typeof dataOrigin === 'string' && dataOrigin.trim()) return dataOrigin;
  if (
    dataOrigin &&
    typeof dataOrigin === 'object' &&
    dataOrigin.packageName
  ) {
    return dataOrigin.packageName;
  }
  return 'health_connect';
};

const getTodayStart = () => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
};

export const hasHeartRateReadPermission = (
  grantedPermissions: { accessType?: string; recordType?: string }[],
) =>
  grantedPermissions.some(
    (permission) =>
      permission.accessType === 'read' &&
      (permission.recordType === 'HeartRate' ||
        permission.recordType === 'RestingHeartRate'),
  );

export const hasHealthConnectBackgroundPermission = (
  grantedPermissions: { accessType?: string; recordType?: string }[],
) =>
  grantedPermissions.some(
    (permission) =>
      permission.accessType === 'read' &&
      permission.recordType === 'BackgroundAccessPermission',
  );

export const syncLatestHealthConnectReading =
  async (): Promise<HealthConnectSyncResult> => {
    if (Platform.OS !== 'android') {
      return { status: 'unavailable' };
    }

    try {
      const {
        initialize,
        getGrantedPermissions,
        readRecords,
      } = require('react-native-health-connect');

      const initialized = await initialize();
      console.log('[HealthConnect] initialized:', initialized);
      if (!initialized) return { status: 'unavailable' };

      const grantedPermissions = await getGrantedPermissions();
      const canReadHeartRate = grantedPermissions.some(
        (permission: { accessType?: string; recordType?: string }) =>
          permission.accessType === 'read' &&
          permission.recordType === 'HeartRate',
      );
      const canReadRestingHeartRate = grantedPermissions.some(
        (permission: { accessType?: string; recordType?: string }) =>
          permission.accessType === 'read' &&
          permission.recordType === 'RestingHeartRate',
      );

      console.log('[HealthConnect] permissions:', grantedPermissions);

      if (!canReadHeartRate && !canReadRestingHeartRate) {
        console.warn('[HealthConnect] missing heart rate read permission');
        return { status: 'no_permission' };
      }

      const endTime = new Date();
      const startTime = getTodayStart();

      const readHeartRateRecords = (dataOriginFilter?: string[]) =>
        readRecords('HeartRate', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
          },
          ...(dataOriginFilter ? { dataOriginFilter } : {}),
          ascendingOrder: false,
          pageSize: 1,
        });

      const readRestingHeartRateRecords = (dataOriginFilter?: string[]) =>
        readRecords('RestingHeartRate', {
          timeRangeFilter: {
            operator: 'between',
            startTime: startTime.toISOString(),
            endTime: endTime.toISOString(),
          },
          ...(dataOriginFilter ? { dataOriginFilter } : {}),
          ascendingOrder: false,
          pageSize: 1,
        });

      let heartRateRecords: HealthConnectHeartRateRecord[] = [];
      if (canReadHeartRate) {
        let heartRateResult = await readHeartRateRecords(
          PREFERRED_HEART_RATE_SOURCES,
        );
        heartRateRecords = ((heartRateResult?.records || heartRateResult?.result || []) as HealthConnectHeartRateRecord[]);

        if (!heartRateRecords.length) {
          heartRateResult = await readHeartRateRecords();
          heartRateRecords = ((heartRateResult?.records || heartRateResult?.result || []) as HealthConnectHeartRateRecord[]);
        }
      }

      let restingHeartRateRecords: HealthConnectRestingHeartRateRecord[] = [];
      if (!heartRateRecords.length && canReadRestingHeartRate) {
        let restingHeartRateResult = await readRestingHeartRateRecords(
          PREFERRED_HEART_RATE_SOURCES,
        );
        restingHeartRateRecords = ((restingHeartRateResult?.records || restingHeartRateResult?.result || []) as HealthConnectRestingHeartRateRecord[]);

        if (!restingHeartRateRecords.length) {
          restingHeartRateResult = await readRestingHeartRateRecords();
          restingHeartRateRecords = ((restingHeartRateResult?.records || restingHeartRateResult?.result || []) as HealthConnectRestingHeartRateRecord[]);
        }
      }

      const heartRateRecordSamples: HealthConnectHeartRateSampleWithSource[] =
        heartRateRecords.flatMap((record) =>
          (record.samples || []).map((sample) => ({
            ...sample,
            sourceRecordId: record.metadata?.id || null,
            dataOrigin: getDataOrigin(record.metadata?.dataOrigin),
            recordType: 'HeartRate' as const,
            rawRecord: record,
          })),
        );
      const restingHeartRateSamples: HealthConnectHeartRateSampleWithSource[] =
        restingHeartRateRecords.map((record) => ({
          beatsPerMinute: record.beatsPerMinute ?? NaN,
          time: record.time || record.endTime || record.startTime || endTime.toISOString(),
          sourceRecordId: record.metadata?.id || null,
          dataOrigin: getDataOrigin(record.metadata?.dataOrigin),
          recordType: 'RestingHeartRate' as const,
          rawRecord: record,
        }));
      const heartRateSamples = heartRateRecordSamples
        .concat(restingHeartRateSamples)
        .filter((sample) => Number.isFinite(sample.beatsPerMinute))
        .sort(
          (a, b) =>
            new Date(b.time).getTime() - new Date(a.time).getTime(),
        ) as HealthConnectHeartRateSampleWithSource[];

      console.log('[HealthConnect] heart rate records/samples:', {
        heartRateRecords: heartRateRecords.length,
        restingHeartRateRecords: restingHeartRateRecords.length,
        samples: heartRateSamples.length,
        windowStart: startTime.toISOString(),
        windowEnd: endTime.toISOString(),
      });

      if (!heartRateSamples.length) return { status: 'no_data' };

      const {
        data: { user },
      } = await supabase.auth.getUser();

      const preferredSamples = heartRateSamples.filter((sample) =>
        PREFERRED_HEART_RATE_SOURCES.some((source) =>
          sample.dataOrigin.toLowerCase().includes(source.toLowerCase()),
        ),
      );
      const latest = (preferredSamples[0] ?? heartRateSamples[0]);
      const latestData = deriveBiometricsFromHeartRate(
        latest.beatsPerMinute,
        new Date(latest.time).getTime(),
        latest.dataOrigin,
      );

      if (user) {
        const { error: userError } = await supabase.from('users').upsert(
          {
            auth_uid: user.id,
            email: user.email || '',
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
          },
          { onConflict: 'auth_uid' },
        );

        if (userError) {
          console.error('Failed to ensure biometric user profile:', userError);
          return { status: 'error', error: userError };
        }

        console.log('[HealthConnect] saving latest heart rate:', {
          bpm: latestData.heartRate,
          recorded_at: latest.time,
          source: latest.dataOrigin,
          record_type: latest.recordType,
          source_record_id: latest.sourceRecordId,
        });

        const { error } = await supabase
          .from('biometric_readings')
          .upsert({
            user_id: user.id,
            device_id: 'health_connect',
            source: latest.dataOrigin,
            source_record_id: latest.sourceRecordId || `${latest.time}:${latest.beatsPerMinute}`,
            recorded_at: latest.time,
            heart_rate: latestData.heartRate,
            hrv: latestData.hrv,
            skin_temperature: latestData.skinTemperature,
            eda: latestData.eda,
            stress_score: latestData.stressScore,
            detected_state: latestData.detectedState,
            raw_payload: latest.rawRecord,
          }, {
            onConflict: 'user_id,source,recorded_at,source_record_id',
          });

        if (error) {
          console.error('Failed to save biometric readings:', error);
          return { status: 'error', error };
        }

        console.log('[HealthConnect] saved latest heart rate');
      }

      return {
        status: 'synced',
        latest: latestData,
        source: latest.dataOrigin,
      };
    } catch (error) {
      console.warn('Health Connect heart rate sync failed:', error);
      return { status: 'error', error };
    }
  };
