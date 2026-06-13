import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { logger } from './logger';

export const LEGAL_POLICY_VERSION = '2026-05-29';
export const ONBOARDING_CONSENTS_KEY = '@nidush_onboarding_consents_v1';
export const HEALTH_DATA_CONSENT_KEY = '@nidush_health_data_consent_v1';
export const HEALTH_CONNECT_ENABLED_KEY = '@nidush_health_connect_enabled_v1';

export type ConsentType =
  | 'privacy_policy'
  | 'terms_of_service'
  | 'health_data'
  | 'spotify_data';

export const recordUserConsent = async (
  consentType: ConsentType,
  source: string,
  policyVersion: string = LEGAL_POLICY_VERSION,
) => {
  const { error } = await supabase.rpc('save_user_consent', {
    p_consent_type: consentType,
    p_policy_version: policyVersion,
    p_source: source,
  });

  if (error) {
    throw error;
  }
};

export const recordLegalPolicyConsents = async (source: string) => {
  await Promise.all([
    recordUserConsent('privacy_policy', source),
    recordUserConsent('terms_of_service', source),
  ]);
};

export const setStoredHealthConsent = async (accepted: boolean) => {
  if (accepted) {
    await AsyncStorage.setItem(HEALTH_DATA_CONSENT_KEY, 'accepted');
    return;
  }

  await AsyncStorage.removeItem(HEALTH_DATA_CONSENT_KEY);
};

export const hasStoredHealthConsent = async () => {
  const stored = await AsyncStorage.getItem(HEALTH_DATA_CONSENT_KEY);
  return stored === 'accepted';
};

export const setHealthConnectEnabled = async (enabled: boolean) => {
  if (enabled) {
    await AsyncStorage.setItem(HEALTH_CONNECT_ENABLED_KEY, 'enabled');
    return;
  }

  await AsyncStorage.removeItem(HEALTH_CONNECT_ENABLED_KEY);
};

export const hasHealthConnectEnabled = async () => {
  const stored = await AsyncStorage.getItem(HEALTH_CONNECT_ENABLED_KEY);
  return stored === 'enabled';
};

export const persistStoredOnboardingConsents = async () => {
  try {
    const stored = await AsyncStorage.getItem(ONBOARDING_CONSENTS_KEY);
    if (!stored) return;

    const parsed = JSON.parse(stored) as {
      health?: boolean;
      spotify?: boolean;
      app?: boolean;
    };

    const writes: Promise<unknown>[] = [];

    if (parsed.app) {
      writes.push(recordLegalPolicyConsents('onboarding_app_consent'));
    }

    if (parsed.health) {
      await setStoredHealthConsent(true);
      writes.push(recordUserConsent('health_data', 'onboarding_health_consent'));
    }

    if (parsed.spotify) {
      writes.push(recordUserConsent('spotify_data', 'onboarding_spotify_consent'));
    }

    if (writes.length > 0) {
      await Promise.all(writes);
    }
  } catch (error) {
    logger.warn('Could not persist stored onboarding consents.', error);
  }
};
