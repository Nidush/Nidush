import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { AppState, Image, Modal, ScrollView, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pickImage } from '../utils/imagePicker';
import { supabase, uploadImage } from '../utils/supabase';
import {
  DeviceRecord,
  isRealHomeDevice,
  SmartDeviceStatus,
  sortDevicesByFreshness,
  subscribeToHomeDeviceChanges,
} from '../utils/devices';


import {
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    useFonts,
} from '@expo-google-fonts/nunito';
import { useSpotify } from '../context/SpotifyContext';
import { useNotifications } from '../context/NotificationsContext';
import { useBiometrics } from '../context/BiometricsContext';
import { LegalContent } from '../components/legal/LegalContent';
import {
  hasHeartRateReadPermission,
} from '../utils/healthConnectSync';
import { LEGAL_POLICY_VERSION, setHealthConnectEnabled } from '../utils/legal';
import { captureException, trackEvent } from '../utils/observability';

export default function Profile() {
  const router = useRouter();
  const { isAuthenticated, login, logout, userProfile } = useSpotify();
  const {
    data: biometricData,
  } = useBiometrics();
  const {
    unreadCount,
    markAllAsRead,
    refreshNotifications,
    notificationsEnabled,
    setNotificationsEnabled,
  } = useNotifications();
  const [userName, setUserName] = useState('A carregar...');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isProfileHeaderLoading, setIsProfileHeaderLoading] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPrivacyModalVisible, setIsPrivacyModalVisible] = useState(false);
  const [isAccountModalVisible, setIsAccountModalVisible] = useState(false);
  const [isNotificationsModalVisible, setIsNotificationsModalVisible] = useState(false);
  const [isDeviceScanModalVisible, setIsDeviceScanModalVisible] = useState(false);
  const [isDeleteAccountModalVisible, setIsDeleteAccountModalVisible] = useState(false);
  const [isExportingData, setIsExportingData] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [dataExportJson, setDataExportJson] = useState('');
  const [deleteAccountConfirmation, setDeleteAccountConfirmation] = useState('');
  const [deleteAccountError, setDeleteAccountError] = useState<string | null>(null);
  const [deviceScanModalTitle, setDeviceScanModalTitle] = useState('Smart device scan');
  const [deviceScanModalMessage, setDeviceScanModalMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [userHomeId, setUserHomeId] = useState<number | string | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);
  const [accountDetails, setAccountDetails] = useState({
    homeName: 'Not connected',
    role: 'Resident',
    memberSince: 'Unknown',
    accountCode: '',
    activitiesCount: 0,
    shortcutsCount: 0,
  });
  const [healthConnectStatus, setHealthConnectStatus] = useState<'connected' | 'disconnected' | 'checking'>('checking');

const HOBBIES_OPTIONS = ['Cooking', 'Workout', 'Meditation', 'Audiobooks'];

  const getWearableSourceLabel = (source?: string) => {
    if (!source || source === 'health_connect') return 'Health Connect';
    if (source.includes('samsung')) return 'Samsung Health';
    if (source.includes('fitbit')) return 'Fitbit';
    if (source.includes('google')) return 'Google Fit';
    if (source.includes('huawei')) return 'Huawei Health';
    return source.replace(/^com\./, '').replace(/\./g, ' ');
  };

  const latestHeartRateLabel = biometricData?.heartRate
    ? `${biometricData.heartRate} bpm`
    : 'No reading yet';
  const latestWearableSource = getWearableSourceLabel(biometricData?.source);
  const latestWearableTime = biometricData?.timestamp
    ? new Date(biometricData.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : null;
  const parseHobbies = (value: unknown) => {
    if (!value) return [];

    const raw = Array.isArray(value) ? value.join(',') : String(value);
    return Array.from(
      new Set(
        raw
          .replace(/[\[\]"]/g, '')
          .split(',')
          .map((s: string) => s.trim())
          .filter(Boolean),
      ),
    );
  };

  type ConnectedDevice = {
    id?: number;
    name: string;
    type: string | null;
    source?: string | null;
    status?: string | null;
    external_id?: string | null;
    last_seen?: string | null;
    home_id?: number | string | null;
  };

  type DeviceDiscoveryResult = {
    discovered?: number;
  };

  type DeviceDiscoveryRequestRow = {
    status?: string | null;
    error_message?: string | null;
    result?: DeviceDiscoveryResult | null;
  };

  const [discoveredDevices, setDiscoveredDevices] = useState<ConnectedDevice[]>([]);
  const [isRefreshingDevices, setIsRefreshingDevices] = useState(false);
  const [isRequestingDiscovery, setIsRequestingDiscovery] = useState(false);
  const [hardwareError, setHardwareError] = useState<string | null>(null);
  const openDeviceScanModal = (title: string, message: string) => {
    setDeviceScanModalTitle(title);
    setDeviceScanModalMessage(message);
    setIsDeviceScanModalVisible(true);
  };
  const isDeviceCurrentlyConnected = (device: Partial<DeviceRecord>) => {
    const connectivity = String(device.connectivity_status ?? '').toLowerCase();
    const status = String(device.status ?? '').toLowerCase();

    if (connectivity === 'offline' || status === 'offline') return false;
    if (connectivity === 'online') return true;

    return ['connected', 'on', 'online', 'playing'].includes(status);
  };

  const getCurrentUserHomeId = async (userId: string) => {
    const { data, error } = await supabase
      .from('user_homes')
      .select('home_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Erro a obter casa do utilizador para devices:', error);
      captureException(error, {
        area: 'devices',
        screen: 'profile',
        action: 'load-user-home-id',
      });
      return null;
    }

    return data?.home_id ?? null;
  };

  const buildExternalId = (name: string, source: string) => {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    return `${source}:${slug || 'device'}`;
  };

  const loadConnectedDevices = useCallback(async (userId: string, homeId: number | string | null) => {
    const buildQuery = (selectClause: string) => {
      let query = supabase
        .from('devices')
        .select(selectClause)
        .order('last_seen', { ascending: false });

      if (homeId) {
        query = query.eq('home_id', Number(homeId));
      } else {
        query = query.eq('user_id', userId);
      }

      return query;
    };

    let { data, error } = await buildQuery(
      'id, name, type, source, status, external_id, last_seen, home_id, connectivity_status, discovery_method',
    );

    if (error?.code === '42703') {
      const fallbackResult = await buildQuery(
        'id, name, type, source, status, external_id, last_seen, home_id',
      );
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) {
      console.error('Erro a carregar devices da BD:', error);
      setHardwareError('Could not load smart home devices.');
      captureException(error, {
        area: 'devices',
        screen: 'profile',
        action: 'load-connected-devices',
        metadata: { userId, homeId },
      });
      return [];
    }

    const rawDevices = ((data ?? []) as unknown) as DeviceRecord[];
    const devices = sortDevicesByFreshness(
      rawDevices
        .filter((device) => isRealHomeDevice(device))
        .filter((device) => isDeviceCurrentlyConnected(device)),
    ) as ConnectedDevice[];
    setHardwareError(null);
    setDiscoveredDevices(devices);
    return devices;
  }, []);

  const refreshConnectedDevices = async (userId: string, homeId: number | string | null) => {
    setIsRefreshingDevices(true);
    try {
      const resolvedHomeId = homeId ?? (await getCurrentUserHomeId(userId));
      await loadConnectedDevices(userId, resolvedHomeId);
    } finally {
      setIsRefreshingDevices(false);
    }
  };

  const requestAutomaticDiscovery = async () => {
    setIsRequestingDiscovery(true);
    trackEvent('requested-device-discovery', {
      area: 'devices',
      screen: 'profile',
      action: 'request-scan',
    });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Session not found.');

      const resolvedHomeId = userHomeId ?? (await getCurrentUserHomeId(user.id));
      if (!resolvedHomeId) throw new Error('No home connected to this user.');

      const { data, error } = await supabase.functions.invoke('request-device-discovery', {
        body: {},
      });

      if (error) throw error;

      console.log('[Profile][DeviceDiscovery] Request response:', data);

      const requestId = Number(data?.request?.id);
      if (!requestId) {
        console.log('[Profile][DeviceDiscovery] No request id returned. Refreshing current devices.');
        await refreshConnectedDevices(user.id, resolvedHomeId);
        trackEvent('device-discovery-reused-existing-sync', {
          area: 'devices',
          screen: 'profile',
          action: 'request-scan',
          userId: user.id,
          metadata: { homeId: resolvedHomeId },
        });
        return;
      }

      const startedAt = Date.now();
      let latestStatus = String(data?.request?.status ?? 'pending').toLowerCase();
      console.log(
        `[Profile][DeviceDiscovery] Waiting for request ${requestId} on home ${resolvedHomeId}. Initial status: ${latestStatus}`,
      );

      while (Date.now() - startedAt < 45000) {
        const { data: requestRow, error: requestError } = await supabase
          .from('device_discovery_requests')
          .select('status, error_message, result')
          .eq('id', requestId)
          .eq('home_id', Number(resolvedHomeId))
          .maybeSingle();

        if (requestError) throw requestError;

        latestStatus = String(requestRow?.status ?? latestStatus).toLowerCase();
        console.log(
          `[Profile][DeviceDiscovery] Poll request ${requestId}: status=${latestStatus}`,
          requestRow,
        );

        if (latestStatus === 'completed') {
          console.log(`[Profile][DeviceDiscovery] Request ${requestId} completed. Refreshing devices.`);
          const refreshedDevices = await loadConnectedDevices(user.id, resolvedHomeId);
          const typedRequestRow = requestRow as DeviceDiscoveryRequestRow | null;
          const discoveredCount = Number(
            typedRequestRow?.result?.discovered ?? refreshedDevices.length ?? 0,
          );

          if (discoveredCount === 0 || refreshedDevices.length === 0) {
            trackEvent('device-discovery-completed-no-devices', {
              area: 'devices',
              screen: 'profile',
              action: 'poll-scan',
              userId: user.id,
              metadata: { requestId, homeId: resolvedHomeId },
            });
            openDeviceScanModal(
              'No devices found',
              'We scanned your home network but did not find any compatible smart devices this time. Make sure the devices are turned on and connected to the same Wi-Fi, then try again.',
            );
          }
          return;
        }

        if (latestStatus === 'failed') {
          const failureMessage = requestRow?.error_message
            ? String(requestRow.error_message)
            : 'The smart device scan failed.';
          captureException(new Error(failureMessage), {
            area: 'devices',
            screen: 'profile',
            action: 'poll-scan',
            userId: user.id,
            metadata: { requestId, homeId: resolvedHomeId, status: latestStatus },
          });
          openDeviceScanModal(
            'Scan failed',
            `${failureMessage} Please wait a moment and try again.`,
          );
          throw new Error(failureMessage);
        }

        await new Promise((resolve) => setTimeout(resolve, 2500));
      }

      console.log(
        `[Profile][DeviceDiscovery] Request ${requestId} is still running after 45s. Refreshing current devices.`,
      );
      await refreshConnectedDevices(user.id, resolvedHomeId);
      setHardwareError('The scan is still running. Pull to refresh again in a few seconds.');
      trackEvent('device-discovery-timeout-refresh', {
        area: 'devices',
        screen: 'profile',
        action: 'poll-scan',
        userId: user.id,
        metadata: { requestId, homeId: resolvedHomeId },
      });
      openDeviceScanModal(
        'Scan still running',
        'We started the smart device scan, but it is taking longer than expected. Please wait a few seconds and tap refresh again.',
      );
    } catch (error: unknown) {
      console.error('Failed to request automatic discovery:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Could not scan smart devices.';
      setHardwareError(errorMessage);
      captureException(error, {
        area: 'devices',
        screen: 'profile',
        action: 'request-scan',
      });
    } finally {
      setIsRequestingDiscovery(false);
    }
  };

  // Função para sincronizar dispositivos com o Supabase
  const syncDeviceToDB = useCallback(async (name: string, type: string, source: string, externalId?: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Sessão não encontrada.');

    const now = new Date().toISOString();
    const normalizedExternalId = externalId || buildExternalId(name, source);
    const homeId = await getCurrentUserHomeId(user.id);
    const payload = {
      name,
      type,
      source,
      status: 'connected',
      connectivity_status: 'online',
      discovery_method: source === 'health_connect' ? 'health' : 'manual',
      sync_source: source === 'health_connect' ? 'health_connect' : source,
      user_id: user.id,
      home_id: homeId,
      external_id: normalizedExternalId,
      last_seen: now,
    };
    const legacyPayload = {
      name,
      type,
      source,
      status: 'connected',
      user_id: user.id,
      home_id: homeId,
      external_id: normalizedExternalId,
      last_seen: now,
    };

    const { data: existing, error: existingError } = await supabase
      .from('devices')
      .select('id')
      .eq('user_id', user.id)
      .eq('source', source)
      .eq('external_id', normalizedExternalId)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (existingError) throw existingError;

    const request = existing
      ? supabase
          .from('devices')
          .update(payload)
          .eq('id', existing.id)
          .select('id, name, type, source, status, external_id, last_seen, home_id')
          .single()
      : supabase
          .from('devices')
          .insert(payload)
          .select('id, name, type, source, status, external_id, last_seen, home_id')
          .single();

    let { data, error } = await request;

    if (error?.code === '42703') {
      const fallbackRequest = existing
        ? supabase
            .from('devices')
            .update(legacyPayload)
            .eq('id', existing.id)
            .select('id, name, type, source, status, external_id, last_seen, home_id')
            .single()
        : supabase
            .from('devices')
            .insert(legacyPayload)
            .select('id, name, type, source, status, external_id, last_seen, home_id')
            .single();

      const fallbackResult = await fallbackRequest;
      data = fallbackResult.data;
      error = fallbackResult.error;
    }

    if (error) throw error;
    return data;
  }, []);

  useEffect(() => {
    let activeHomeChannel: ReturnType<typeof subscribeToHomeDeviceChanges> | null = null;

    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setAvatarUrl(user.user_metadata?.avatar_url || null);
          const first = user.user_metadata?.first_name || '';
          const last = user.user_metadata?.last_name || '';

          if (first || last) {
            setUserName(`${first} ${last}`.trim());
          } else if (user.email) {
            setUserName(user.email.split('@')[0]);
          } else {
            setUserName('Utilizador');
          }

          const userEmail = user.email || '';
          setUserEmail(userEmail);
          setIsProfileHeaderLoading(false);

          let [
            userDataResult,
            homeAssociationResult,
          ] = await Promise.all([
            supabase
              .from('users')
              .select('hobbies, created_at')
              .eq('auth_uid', user.id)
              .maybeSingle(),
            supabase
              .from('user_homes')
              .select('home_id, role, created_at')
              .eq('user_id', user.id)
              .order('created_at', { ascending: true })
              .limit(1)
              .maybeSingle(),
          ]);

          let userData = userDataResult.data;
          let userDataError = userDataResult.error;

          if ((!userData || userDataError) && userEmail) {
            const fallback = await supabase
              .from('users')
              .select('hobbies, created_at')
              .eq('email', userEmail)
              .maybeSingle();

            userData = fallback.data;
            userDataError = fallback.error;
          }

          if (userDataError) {
            console.error('Erro a carregar hobbies:', userDataError);
          }

          setSelectedHobbies(parseHobbies(userData?.hobbies));

          let finalHomeId = null;
          const homeAssociation = homeAssociationResult.data;

          if (homeAssociation) {
            finalHomeId = homeAssociation.home_id;
            setUserHomeId(finalHomeId);
          }

          const [
            homeDataResult,
            activitiesCountResult,
            shortcutsCountResult,
            connectedDevices,
          ] = await Promise.all([
            finalHomeId
              ? supabase.from('homes').select('name, join_code').eq('id', finalHomeId).maybeSingle()
              : Promise.resolve({ data: null }),
            supabase
              .from('activities')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', user.id),
            supabase
              .from('shortcuts')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', user.id),
            loadConnectedDevices(user.id, finalHomeId),
          ]);

          let homeData = homeDataResult.data;
          if ('error' in homeDataResult && homeDataResult.error?.code === '42703' && finalHomeId) {
            const legacyHomeResult = await supabase
              .from('homes')
              .select('name, join_code')
              .eq('id', finalHomeId)
              .maybeSingle();
            homeData = legacyHomeResult.data as typeof homeData;
          }
          const homeName = homeData?.name || 'Not connected';
          const resolvedJoinCode = homeData?.join_code || null;
          if (resolvedJoinCode) {
            setJoinCode(resolvedJoinCode);
          }

          setAccountDetails({
            homeName,
            role: homeAssociation?.role || 'Resident',
            memberSince: formatProfileDate(user.created_at || userData?.created_at),
            accountCode: user.id.slice(0, 8).toUpperCase(),
            activitiesCount: activitiesCountResult.count ?? 0,
            shortcutsCount: shortcutsCountResult.count ?? 0,
          });
          if (!resolvedJoinCode) {
            setJoinCode(null);
          }

          setDiscoveredDevices(connectedDevices);

          if (finalHomeId) {
            activeHomeChannel = subscribeToHomeDeviceChanges(Number(finalHomeId), async () => {
              await loadConnectedDevices(user.id, finalHomeId);
            });
          }
        } else {
          setUserName('Visitante');
          setIsProfileHeaderLoading(false);
        }
      } catch (error) {
        console.error('Erro a carregar perfil:', error);
        setUserName('Utilizador');
        setIsProfileHeaderLoading(false);
      } finally {
        setIsLoading(false);
      }
    };

    const checkHealthConnect = async () => {
      try {
        const {
          getGrantedPermissions,
          getSdkStatus,
          SdkAvailabilityStatus,
        } = await import('react-native-health-connect');
        const status = await getSdkStatus();
        if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
          setHealthConnectStatus('disconnected');
          return;
        }

        const grantedPermissions = await getGrantedPermissions();
        const canReadHeartRate = hasHeartRateReadPermission(
          grantedPermissions,
        );

        if (!canReadHeartRate) {
          await setHealthConnectEnabled(false);
          setHealthConnectStatus('disconnected');
          return;
        }

        await setHealthConnectEnabled(true);
        setHealthConnectStatus('connected');
        await syncDeviceToDB('Health Connect', 'heart', 'health_connect', 'android_hc');
      } catch {
        await setHealthConnectEnabled(false);
        setHealthConnectStatus('disconnected');
      }
    };

    fetchUser();
    checkHealthConnect();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        checkHealthConnect();
      }
    });

    return () => {
      subscription.remove();
      if (activeHomeChannel) {
        supabase.removeChannel(activeHomeChannel);
      }
    };
  }, [loadConnectedDevices, syncDeviceToDB]);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const handleImagePick = async () => {
    const base64OrUri = await pickImage();
    if (!base64OrUri) return;

    setAvatarUrl(typeof base64OrUri === 'string' ? base64OrUri : null);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.replace('/login');
      return;
    }

    const avatarPath = `${user.id}/${Date.now()}.jpg`;
    const publicUrl = await uploadImage(base64OrUri, 'avatars', avatarPath);
    if (publicUrl) {
      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      const { error: dbError } = await supabase
        .from('users')
        .update({ avatar_url: publicUrl })
        .eq('auth_uid', user.id);

      if (dbError) {
        console.error("Erro a atualizar tabela users:", dbError);
      }

      setAvatarUrl(publicUrl);
    } else {
      console.warn('Profile image upload did not complete.');
    }
  };

  const toggleHobby = (hobby: string) => {
    setSelectedHobbies(prev =>
      prev.includes(hobby) ? prev.filter(h => h !== hobby) : [...prev, hobby]
    );
  };

  const saveHobbies = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const uniqueHobbies = Array.from(new Set(selectedHobbies)).join(',');

      const { data, error } = await supabase
        .from('users')
        .upsert(
          {
            auth_uid: user.id,
            email: user.email || '',
            first_name: user.user_metadata?.first_name || '',
            last_name: user.user_metadata?.last_name || '',
            hobbies: uniqueHobbies,
          },
          { onConflict: 'auth_uid' },
        )
        .select('hobbies')
        .single();

      if (error) {
        console.error("Erro ao guardar hobbies:", error);
      } else {
        setSelectedHobbies(parseHobbies(data?.hobbies));
        setIsModalVisible(false);
      }

    }
  };

  const handleExportData = async () => {
    setIsExportingData(true);
    try {
      const { data, error } = await supabase.rpc('export_my_data');

      if (error) {
        throw error;
      }

      setDataExportJson(JSON.stringify(data ?? {}, null, 2));
    } catch (error) {
      console.error('Erro ao exportar dados do utilizador:', error);
      setDataExportJson(
        JSON.stringify(
          {
            error: 'Could not generate your data export right now.',
          },
          null,
          2,
        ),
      );
    } finally {
      setIsExportingData(false);
    }
  };

  const openDeleteAccountModal = () => {
    setDeleteAccountError(null);
    setDeleteAccountConfirmation('');
    setIsDeleteAccountModalVisible(true);
  };

  const handleDeleteAccount = async () => {
    if (deleteAccountConfirmation.trim().toUpperCase() !== 'DELETE') {
      setDeleteAccountError('Type DELETE to confirm account deletion.');
      return;
    }

    setIsDeletingAccount(true);
    setDeleteAccountError(null);

    try {
      const { data, error } = await supabase.functions.invoke('delete-account', {
        body: {},
      });

      if (error) {
        throw error;
      }

      if (data?.error) {
        throw new Error(String(data.error));
      }

      await supabase.auth.signOut({ scope: 'local' });
      setIsDeleteAccountModalVisible(false);
      setIsPrivacyModalVisible(false);
      router.replace('/login');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not delete your account right now.';
      setDeleteAccountError(message);
      captureException(error, {
        area: 'privacy',
        screen: 'profile',
        action: 'delete-account',
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };



  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView
      className="flex-1 bg-[#F5F7F0]"
      edges={['top']}
      accessibilityLanguage="en-US"
    >
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4">
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          testID="back-button"
          accessible
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Navigates back to the main screen"
        >
          <MaterialIcons name="chevron-left" size={32} color="#4A5D4E" />
        </TouchableOpacity>

        <Text
          maxFontSizeMultiplier={1.2}
          className="text-2xl text-[#4A5D4E]"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
          accessibilityRole="header"
        >
          Profile
        </Text>

        <View className="w-8" />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center my-6">
          <TouchableOpacity
            onPress={handleImagePick}
            activeOpacity={0.8}
            style={{ position: 'relative' }}
            testID="avatar-picker-button"
          >
            {isProfileHeaderLoading ? (
              <View className="w-32 h-32 rounded-full bg-[#E8EDDF]" />
            ) : (
              <Image
                source={avatarUrl ? { uri: avatarUrl } : require('@/assets/avatars/profile.png')}
                className="w-32 h-32 rounded-full"
                accessible
                accessibilityRole="image"
                accessibilityLabel={`Profile picture of ${userName}`}
              />
            )}
            <View className="absolute bottom-0 right-0 bg-[#5B8C51] p-2 rounded-full border-2 border-[#F5F7F0]">
              <MaterialIcons name="edit" size={20} color="white" />
            </View>
          </TouchableOpacity>
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-3xl text-[#3A4D3F] mt-4"
            style={{ fontFamily: 'Nunito_700Bold' }}
            accessibilityRole="header"
          >
            {userName}
          </Text>
        </View>

        {/* Hobbies */}
        <View
          className="bg-[#F5F7F0] rounded-[24px] p-5 mb-4 border border-[#D1D9C5]"
          testID="hobbies-container"
        >
          <View className="flex-row justify-between items-center mb-4">
            <Text
              maxFontSizeMultiplier={1.2}
              className="text-lg text-[#4A5D4E]"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
              accessibilityRole="header"
            >
              Hobby Preferences
            </Text>

            <TouchableOpacity
              onPress={() => setIsModalVisible(true)}
              testID="edit-hobbies-button"
              accessible
              accessibilityRole="button"
              accessibilityLabel="Edit hobby preferences"
              accessibilityHint="Opens the hobby preferences editor"
            >
              <Text
                maxFontSizeMultiplier={1.2}
                className="text-[#5B8C51] underline"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                Edit
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {selectedHobbies.length > 0 ? (
              selectedHobbies.map((hobby) => (
                <View
                  key={hobby}
                  className="bg-[#C8E0C4] px-4 py-1.5 rounded-full"
                  accessible={false}
                >
                  <Text
                    maxFontSizeMultiplier={1.2}
                    className="text-[#4A5D4E] text-sm"
                    style={{ fontFamily: 'Nunito_600SemiBold' }}
                  >
                    {hobby}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-gray-400 italic">No hobbies selected</Text>
            )}
          </View>
        </View>

        {/* Smart Home & Hardware Devices */}
        <View className="bg-[#F5F7F0] rounded-[24px] p-5 mb-4 border border-[#D1D9C5]">
          <View className="flex-row justify-between items-center mb-4">
            <View className="flex-1 pr-4">
              <Text
                maxFontSizeMultiplier={1.2}
                className="text-lg text-[#4A5D4E]"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                Connected Hardware
              </Text>
              <Text
                className="text-xs text-[#71806F] mt-1"
                style={{ fontFamily: 'Nunito_400Regular' }}
              >
                Real home devices synced from your local network agent.
              </Text>
            </View>
            {isRefreshingDevices && (
              <Text className="text-[#5B8C51] text-xs" style={{ fontFamily: 'Nunito_700Bold' }}>
                Refreshing...
              </Text>
            )}
          </View>

          {hardwareError && (
            <Text className="text-red-500 text-xs mb-3">{hardwareError}</Text>
          )}

          <View className="gap-y-3">
            {discoveredDevices.length > 0 ? (
              discoveredDevices.map((device, index) => (
                <View
                  key={device.id ?? device.external_id ?? index}
                  className="flex-row items-center bg-white/50 p-3 rounded-2xl border border-[#E8EDDF]"
                >
                  <View className="bg-[#5B8C51] p-2 rounded-full">
                    <MaterialIcons
                      name={
                        device.type === 'tv'
                          ? 'tv'
                          : device.type === 'speaker'
                            ? 'speaker'
                            : device.type === 'light'
                              ? 'lightbulb'
                              : 'devices'
                      }
                      size={20}
                      color="white"
                    />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-[#4A5D4E] font-bold">{device.name}</Text>
                    <Text className="text-gray-500 text-xs">
                      {device.status === 'connected' || device.status === 'On'
                        ? 'Online on your home network'
                        : 'Offline or waiting for the next sync'}
                    </Text>
                  </View>
                  <View className="ml-auto items-end">
                    <View
                      className={`w-2.5 h-2.5 rounded-full ${
                        device.status === 'connected' || device.status === 'On'
                          ? 'bg-green-500'
                          : 'bg-gray-300'
                      }`}
                    />
                    <Text className="text-[10px] text-gray-400 mt-1">
                      {device.source || 'network'}
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <Text className="text-gray-400 italic text-center">
                No real smart home devices synced yet.
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={requestAutomaticDiscovery}
            disabled={isRequestingDiscovery}
            testID="scan-smart-devices-button"
            className={`mt-4 py-3 items-center bg-[#5B8C51] rounded-full ${isRequestingDiscovery ? 'opacity-50' : ''}`}
          >
            <Text className="text-white font-bold">
              {isRequestingDiscovery ? 'Requesting Scan...' : 'Scan Smart Devices'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              const { data: { user } } = await supabase.auth.getUser();
              if (!user) return;
              await refreshConnectedDevices(user.id, userHomeId);
            }}
            disabled={isRefreshingDevices}
            testID="refresh-devices-button"
            className={`mt-3 py-2 items-center ${isRefreshingDevices ? 'opacity-50' : ''}`}
          >
            <Text className="text-[#5B8C51] font-bold">
              {isRefreshingDevices ? 'Refreshing Devices...' : 'Refresh Synced Devices'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Wearables */}
        <View className="bg-[#F5F7F0] rounded-[24px] p-5 mb-4 border border-[#D1D9C5]">
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-lg text-[#4A5D4E] mb-4"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
            accessibilityRole="header"
          >
            Associated Wearables
          </Text>

          <DeviceItem
            name="Smartwatch via Health Connect"
            status={
              healthConnectStatus === 'checking'
                ? 'Checking...'
                : healthConnectStatus === 'connected'
                  ? `${latestHeartRateLabel} · ${latestWearableSource}${latestWearableTime ? ` · ${latestWearableTime}` : ''}`
                  : 'Not Connected'
            }
            connected={healthConnectStatus === 'connected'}
            icon="watch"
            testID="device-health-connect"
          />

          <TouchableOpacity
            className="bg-[#5B8C51] py-3.5 rounded-full items-center mt-4 shadow-sm"
            testID="add-device-button"
            accessible
            accessibilityRole="button"
            accessibilityLabel="Add new device"
            accessibilityHint="Starts the process to connect a new wearable device"
            onPress={async () => {
              try {
                const {
                  getSdkStatus,
                  initialize,
                  openHealthConnectDataManagement,
                  SdkAvailabilityStatus,
                  openHealthConnectSettings,
                } = await import('react-native-health-connect');
                const status = await getSdkStatus();
                if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
                  console.warn('Health Connect is not available or needs to be installed.');
                  return;
                }

                const initialized = await initialize();
                if (initialized) {
                  if (healthConnectStatus !== 'connected') {
                    openHealthConnectSettings();
                    console.info('Opened Health Connect settings for permission review.');
                    return;
                  }

                  try {
                    openHealthConnectDataManagement();
                  } catch {
                    openHealthConnectSettings();
                  }
                }
              } catch {
                console.warn('Could not open Health Connect settings.');
              }
            }}
          >
            <Text
              maxFontSizeMultiplier={1.2}
              className="text-white text-xl"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              {healthConnectStatus === 'connected' ? 'Manage Apps & Data' : 'Open Health Connect'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Menu Principal */}
        <View className="bg-[#F5F7F0] rounded-[24px] px-2 mb-4 border border-[#D1D9C5]">
          <MenuItem
            icon="account-circle"
            label="Account Information"
            testID="menu-account"
            onPress={() => setIsAccountModalVisible(true)}
          />
          <MenuItem
            icon="notifications-none"
            label="Notifications"
            testID="menu-notifications"
            badge={unreadCount}
            onPress={() => setIsNotificationsModalVisible(true)}
          />
          <MenuItem
            icon="admin-panel-settings"
            label="Privacy & Data"
            border={false}
            testID="menu-privacy"
            onPress={() => setIsPrivacyModalVisible(true)}
          />
        </View>

        {/* Spotify Connection */}
        <View className="bg-[#F5F7F0] rounded-[24px] px-2 mb-4 border border-[#D1D9C5]">
          <TouchableOpacity
            className="flex-row justify-between items-center py-5 px-4"
            onPress={isAuthenticated ? logout : login}
          >
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="spotify" size={28} color={isAuthenticated ? "#1DB954" : "#4A5D4E"} />
              <View className="ml-4">
                <Text
                  maxFontSizeMultiplier={1.2}
                  className="text-lg text-[#4A5D4E]"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  Spotify
                </Text>
                <Text className={`text-xs ${isAuthenticated ? (userProfile ? 'text-[#1DB954]' : 'text-orange-500') : 'text-gray-400'}`}>
                  {isLoading
                    ? 'Checking connection...'
                    : isAuthenticated
                      ? (userProfile ? `Connected as ${userProfile?.display_name}` : 'Login expired or incomplete')
                      : 'Not connected'}
                </Text>
              </View>
            </View>
            <Text
              className={`text-sm ${isAuthenticated ? (userProfile ? 'text-red-500' : 'text-blue-500') : 'text-[#5B8C51]'}`}
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              {isLoading ? '' : isAuthenticated ? (userProfile ? 'Disconnect' : 'Connect Now') : 'Connect'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Menu Secundário */}
        <View className="bg-[#F5F7F0] rounded-[24px] px-2 mb-6 border border-[#D1D9C5]">
          <MenuItem
            icon="group"
            label="Residents"
            border={false}
            testID="menu-residents"
            onPress={() => router.push('/profile-selection')}
          />
        </View>

        {/* Botão Logout */}
        <View className="items-center">
          <TouchableOpacity
            className="bg-[#5B8C51] px-12 py-3.5 rounded-full shadow-sm"
            onPress={handleLogout}
            testID="logout-button"
            accessible
            accessibilityRole="button"
            accessibilityLabel="Log out"
            accessibilityHint="Logs out of the current account"
          >
            <Text
              maxFontSizeMultiplier={1.2}
              className="text-white text-xl"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Hobbies Preference Modal */}
      <Modal
        visible={isDeviceScanModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeviceScanModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white w-full rounded-[32px] p-7 shadow-xl">
            <View className="w-14 h-14 rounded-full bg-[#E8EDDF] items-center justify-center self-center mb-4">
              <MaterialIcons name="devices" size={28} color="#5B8C51" />
            </View>

            <Text
              className="text-2xl text-[#3A4D3F] mb-3 text-center"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              {deviceScanModalTitle}
            </Text>

            <Text
              className="text-[#71806F] text-base text-center leading-6"
              style={{ fontFamily: 'Nunito_400Regular' }}
            >
              {deviceScanModalMessage}
            </Text>

            <TouchableOpacity
              onPress={() => setIsDeviceScanModalVisible(false)}
              className="bg-[#5B8C51] mt-7 py-4 rounded-full items-center shadow-md"
            >
              <Text
                className="text-white text-lg"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                Understood
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white w-full rounded-[32px] p-8 shadow-xl">
            <Text
              className="text-2xl text-[#3A4D3F] mb-6 text-center"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              Select your Hobbies
            </Text>

            <View className="flex-row flex-wrap justify-between gap-y-4">
              {HOBBIES_OPTIONS.map((hobby) => {
                const isSelected = selectedHobbies.includes(hobby);
                return (
                  <TouchableOpacity
                    key={hobby}
                    onPress={() => toggleHobby(hobby)}
                    className={`w-[48%] py-4 rounded-2xl border-2 items-center ${isSelected ? 'bg-[#5B8C51] border-[#5B8C51]' : 'bg-white border-[#D1D9C5]'
                      }`}
                  >
                    <Text
                      className={`text-lg ${isSelected ? 'text-white' : 'text-[#4A5D4E]'}`}
                      style={{ fontFamily: isSelected ? 'Nunito_700Bold' : 'Nunito_600SemiBold' }}
                    >
                      {hobby}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={saveHobbies}
              className="bg-[#5B8C51] mt-8 py-4 rounded-full items-center shadow-md"
            >
              <Text
                className="text-white text-xl"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                Save Preferences
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              className="mt-4 py-2 items-center"
            >
              <Text className="text-gray-400 text-lg">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Notifications Control Modal */}
      <Modal
        visible={isNotificationsModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsNotificationsModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white w-full rounded-t-[40px] p-8 shadow-2xl">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text
                  className="text-2xl text-[#3A4D3F]"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Notifications
                </Text>
                <Text
                  className="text-[#71806F] mt-1"
                  style={{ fontFamily: 'Nunito_400Regular' }}
                >
                  Control what appears in Nidush.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsNotificationsModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close notifications settings"
              >
                <MaterialIcons name="close" size={28} color="#4A5D4E" />
              </TouchableOpacity>
            </View>

            <View className="bg-[#F5F7F0] rounded-3xl p-4 mb-4 border border-[#D1D9C5]">
              <View className="flex-row justify-between items-center">
                <View className="flex-1 pr-4">
                  <Text
                    className="text-lg text-[#4A5D4E]"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    In-app alerts
                  </Text>
                  <Text
                    className="text-[#71806F] mt-1"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  >
                    {notificationsEnabled
                      ? 'Activity, state and system alerts are being saved.'
                      : 'New alerts are paused on this device.'}
                  </Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={setNotificationsEnabled}
                  thumbColor={notificationsEnabled ? '#5B8C51' : '#F4F4F4'}
                  trackColor={{ false: '#D1D9C5', true: '#BFD9B9' }}
                  accessibilityLabel="Toggle in-app notifications"
                />
              </View>
            </View>

            <View className="bg-[#F5F7F0] rounded-3xl p-4 mb-5 border border-[#D1D9C5]">
              <Text
                className="text-lg text-[#4A5D4E]"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                {unreadCount > 0
                  ? `${unreadCount} unread notification${unreadCount === 1 ? '' : 's'}`
                  : 'No unread notifications'}
              </Text>
              <Text
                className="text-[#71806F] mt-1"
                style={{ fontFamily: 'Nunito_400Regular' }}
              >
                Keep alerts on to receive activity, state, and system updates in Nidush.
              </Text>
            </View>

            <View className="gap-y-3 mb-8">
              <TouchableOpacity
                onPress={() => {
                  setIsNotificationsModalVisible(false);
                  router.push('/notifications');
                }}
                className="bg-[#5B8C51] py-4 rounded-full items-center shadow-md"
                accessibilityRole="button"
                accessibilityLabel="Open notification center"
              >
                <Text
                  className="text-white text-lg"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Open notifications
                </Text>
              </TouchableOpacity>

              {unreadCount > 0 && (
                <TouchableOpacity
                  onPress={async () => {
                    await markAllAsRead();
                    await refreshNotifications();
                  }}
                  className="bg-[#E8EDDF] py-3 rounded-full items-center"
                  accessibilityRole="button"
                  accessibilityLabel="Mark all notifications as read"
                >
                  <Text
                    className="text-[#4A5D4E]"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    Mark all as read
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Privacy & Data Modal */}
      <Modal
        visible={isPrivacyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPrivacyModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white w-full rounded-t-[40px] px-8 pt-8 pb-12 shadow-2xl h-[86%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text
                className="text-2xl text-[#3A4D3F]"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                Privacy & Terms
              </Text>
              <TouchableOpacity onPress={() => setIsPrivacyModalVisible(false)}>
                <MaterialIcons name="close" size={28} color="#4A5D4E" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mb-3">
              <View className="bg-[#F5F7F0] border border-[#D1D9C5] rounded-[24px] p-4 mb-5">
                <Text
                  className="text-lg text-[#3A4D3F]"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Data Portability
                </Text>
                <Text
                  className="text-[#71806F] mt-2 leading-6"
                  style={{ fontFamily: 'Nunito_400Regular' }}
                >
                  Generate a structured JSON export of your profile, preferences, activities, devices, notifications, and consent history.
                </Text>
                <Text
                  className="text-[#71806F] mt-2 text-xs"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  Policy version: {LEGAL_POLICY_VERSION}
                </Text>

                <TouchableOpacity
                  onPress={handleExportData}
                  disabled={isExportingData}
                  className={`mt-4 py-3 rounded-full items-center ${isExportingData ? 'bg-[#A7B5A4]' : 'bg-[#5B8C51]'}`}
                >
                  <Text
                    className="text-white text-base"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    {isExportingData ? 'Generating export...' : 'Generate data export'}
                  </Text>
                </TouchableOpacity>

                {dataExportJson ? (
                  <View className="mt-4 bg-[#1F2D2F] rounded-[20px] p-4">
                    <Text
                      selectable
                      className="text-[#E8F0E4] text-xs leading-5"
                      style={{ fontFamily: 'Nunito_400Regular' }}
                    >
                      {dataExportJson}
                    </Text>
                  </View>
                ) : null}
              </View>

              <View className="bg-[#FFF4F1] border border-[#E6B8AC] rounded-[24px] p-4 mb-5">
                <Text
                  className="text-lg text-[#8A3D2B]"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Delete account
                </Text>
                <Text
                  className="text-[#8A5B50] mt-2 leading-6"
                  style={{ fontFamily: 'Nunito_400Regular' }}
                >
                  Permanently remove your profile, preferences, activities, routines, devices, notifications, consents, and active session from Nidush.
                </Text>
                <Text
                  className="text-[#8A5B50] mt-2 text-xs"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  If you are the only admin in a shared home, Nidush will transfer admin access to the oldest remaining member when possible.
                </Text>

                <TouchableOpacity
                  onPress={openDeleteAccountModal}
                  className="mt-4 py-3 rounded-full items-center bg-[#C95F44]"
                  testID="open-delete-account-button"
                >
                  <Text
                    className="text-white text-base"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    Delete my account
                  </Text>
                </TouchableOpacity>
              </View>

              <LegalContent />
            </ScrollView>

            <TouchableOpacity
              onPress={() => setIsPrivacyModalVisible(false)}
              className="bg-[#5B8C51] py-4 rounded-full items-center shadow-md mb-4"
            >
              <Text
                className="text-white text-xl"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal
        visible={isDeleteAccountModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsDeleteAccountModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white w-full rounded-[32px] p-7 shadow-xl">
            <View className="w-14 h-14 rounded-full bg-[#FFF4F1] items-center justify-center self-center mb-4">
              <MaterialIcons name="delete-forever" size={28} color="#C95F44" />
            </View>

            <Text
              className="text-2xl text-[#3A2E2A] mb-3 text-center"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              Confirm account deletion
            </Text>

            <Text
              className="text-[#7A665E] text-base text-center leading-6"
              style={{ fontFamily: 'Nunito_400Regular' }}
            >
              This action is permanent. Type DELETE to confirm that Nidush should erase your account and personal app data.
            </Text>

            <TextInput
              value={deleteAccountConfirmation}
              onChangeText={(value) => {
                setDeleteAccountConfirmation(value);
                if (deleteAccountError) setDeleteAccountError(null);
              }}
              autoCapitalize="characters"
              autoCorrect={false}
              placeholder="Type DELETE"
              placeholderTextColor="#A28F87"
              className="mt-5 border border-[#E6B8AC] rounded-2xl px-4 py-3 text-[#3A2E2A]"
              testID="delete-account-confirm-input"
            />

            {deleteAccountError ? (
              <Text
                className="text-[#C95F44] mt-3 text-sm"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                {deleteAccountError}
              </Text>
            ) : null}

            <TouchableOpacity
              onPress={handleDeleteAccount}
              disabled={isDeletingAccount}
              className={`mt-6 py-4 rounded-full items-center shadow-md ${isDeletingAccount ? 'bg-[#D9A79A]' : 'bg-[#C95F44]'}`}
              testID="confirm-delete-account-button"
            >
              <Text
                className="text-white text-lg"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                {isDeletingAccount ? 'Deleting account...' : 'Permanently delete'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsDeleteAccountModalVisible(false)}
              disabled={isDeletingAccount}
              className="mt-4 py-2 items-center"
            >
              <Text className="text-gray-400 text-lg">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Account Information Modal */}
      <Modal
        visible={isAccountModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsAccountModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white w-full rounded-t-[40px] p-8 shadow-2xl h-[82%]">
            <View className="flex-row justify-between items-center mb-6">
              <View>
                <Text
                  className="text-2xl text-[#3A4D3F]"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Account Information
                </Text>
                <Text
                  className="text-[#71806F] mt-1"
                  style={{ fontFamily: 'Nunito_400Regular' }}
                >
                  Your profile, home and activity summary.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsAccountModalVisible(false)}
                accessibilityRole="button"
                accessibilityLabel="Close account information"
              >
                <MaterialIcons name="close" size={28} color="#4A5D4E" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mb-5">
              <View className="flex-row justify-between mb-5">
                <AccountStat label="Activities" value={accountDetails.activitiesCount} />
                <AccountStat label="Shortcuts" value={accountDetails.shortcutsCount} />
                <AccountStat label="Devices" value={discoveredDevices.length} />
              </View>

              <View className="bg-[#F5F7F0] rounded-3xl p-4 mb-4 border border-[#D1D9C5]">
                <AccountInfoRow label="Full name" value={userName} />
                <AccountInfoRow label="Email address" value={userEmail || 'Not available'} />
                <AccountInfoRow label="Member since" value={accountDetails.memberSince} />
                <AccountInfoRow label="Account code" value={accountDetails.accountCode || 'Not available'} isLast />
              </View>

              <View className="bg-[#F5F7F0] rounded-3xl p-4 mb-4 border border-[#D1D9C5]">
                <AccountInfoRow label="Home" value={accountDetails.homeName} />
                <AccountInfoRow label="Join code" value={joinCode || 'Not available'} />
                <AccountInfoRow label="Role" value={accountDetails.role} isLast />
              </View>

              <View className="bg-[#F5F7F0] rounded-3xl p-4 mb-4 border border-[#D1D9C5]">
                <AccountInfoRow
                  label="Hobbies"
                  value={selectedHobbies.length > 0 ? selectedHobbies.join(', ') : 'Not selected'}
                />
                <AccountInfoRow
                  label="Spotify"
                  value={isAuthenticated ? 'Connected' : 'Not connected'}
                />
                <AccountInfoRow
                  label="Health Connect"
                  value={
                    healthConnectStatus === 'checking'
                      ? 'Checking...'
                      : healthConnectStatus === 'connected'
                        ? 'Connected'
                        : 'Not connected'
                  }
                />
                <AccountInfoRow
                  label="Notifications"
                  value={notificationsEnabled ? 'Enabled' : 'Paused'}
                  isLast
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setIsAccountModalVisible(false)}
              className="bg-[#5B8C51] py-4 rounded-full items-center shadow-md"
            >
              <Text
                className="text-white text-xl"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>

  );
}

function formatProfileDate(value?: string | null) {
  if (!value) return 'Unknown';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Unknown';

  return date.toLocaleDateString([], {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function AccountStat({ label, value }: { label: string; value: number }) {
  return (
    <View className="flex-1 bg-[#F5F7F0] rounded-2xl py-4 mx-1 items-center border border-[#D1D9C5]">
      <Text
        className="text-2xl text-[#4A5D4E]"
        style={{ fontFamily: 'Nunito_700Bold' }}
      >
        {value}
      </Text>
      <Text
        className="text-xs text-[#71806F] mt-1"
        style={{ fontFamily: 'Nunito_600SemiBold' }}
      >
        {label}
      </Text>
    </View>
  );
}

function AccountInfoRow({
  label,
  value,
  isLast = false,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View className={`py-3 ${isLast ? '' : 'border-b border-[#D1D9C5]'}`}>
      <Text
        className="text-sm text-[#71806F] mb-1"
        style={{ fontFamily: 'Nunito_600SemiBold' }}
      >
        {label}
      </Text>
      <Text
        className="text-lg text-[#4A5D4E]"
        style={{ fontFamily: 'Nunito_700Bold' }}
      >
        {value}
      </Text>
    </View>
  );
}

type DeviceItemProps = {
  name: string;
  status: SmartDeviceStatus | string;
  connected: boolean;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  testID?: string;
};

function DeviceItem({ name, status, connected, icon, testID }: DeviceItemProps) {
  return (
    <View
      className="flex-row items-center mb-4"
      testID={testID}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${name}, ${status}`}
    >
      <View className="bg-[#E8EDDF] p-2 rounded-xl">
        <MaterialIcons name={icon} size={28} color="#4A5D4E" />
      </View>

      <View className="ml-4">
        <Text
          maxFontSizeMultiplier={1.2}
          className="text-base text-[#4A5D4E]"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
        >
          {name}
        </Text>
        <View className="flex-row items-center mt-0.5">
          <View
            className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-[#5B8C51]' : 'bg-gray-400'}`}
            accessible={false}
          />
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-xs text-gray-500 ml-1.5"
            style={{ fontFamily: 'Nunito_400Regular' }}
          >
            {status}
          </Text>
        </View>
      </View>
    </View>
  );
}

type MenuItemProps = {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  border?: boolean;
  testID?: string;
  onPress?: () => void;
  badge?: number;
};

function MenuItem({
  icon,
  label,
  border = true,
  testID,
  onPress,
  badge,
}: MenuItemProps) {
  const hasBadge = typeof badge === 'number' && badge > 0;

  return (
    <TouchableOpacity
      testID={testID}
      className={`flex-row justify-between items-center py-5 px-4 ${border ? 'border-b border-[#D1D9C5]' : ''}`}
      accessible
      accessibilityRole="button"
      accessibilityHint={`Opens ${label} section`}
      accessibilityLabel={
        hasBadge ? `${label}, ${badge} unread notifications` : label
      }
      onPress={onPress}
    >
      <View className="flex-row items-center">
        <MaterialIcons name={icon} size={28} color="#4A5D4E" />
        <Text
          maxFontSizeMultiplier={1.2}
          className="text-lg text-[#4A5D4E] ml-4"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
        >
          {label}
        </Text>
      </View>
      <View className="flex-row items-center">
        {hasBadge && (
          <View className="min-w-6 h-6 px-2 rounded-full bg-[#5B8C51] items-center justify-center mr-2">
            <Text
              maxFontSizeMultiplier={1.1}
              className="text-white text-xs"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
        <MaterialIcons name="chevron-right" size={28} color="#4A5D4E" />
      </View>
    </TouchableOpacity>
  );
}
