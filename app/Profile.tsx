import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useState } from 'react';
import { Image, Modal, ScrollView, Switch, Text, TouchableOpacity, View, AppState } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pickImage } from '../utils/imagePicker';
import { supabase, uploadImage } from '../utils/supabase';
import {
  DeviceRecord,
  isRealHomeDevice,
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
  HEALTH_CONNECT_HEART_RATE_PERMISSIONS,
  hasHeartRateReadPermission,
} from '../utils/healthConnectSync';

export default function Profile() {
  const router = useRouter();
  const { isAuthenticated, login, logout, userProfile } = useSpotify();
  const {
    data: biometricData,
    currentState,
  } = useBiometrics();
  const {
    notifications,
    unreadCount,
    markAllAsRead,
    clearAll,
    refreshNotifications,
    notificationsEnabled,
    setNotificationsEnabled,
  } = useNotifications();
  const [userName, setUserName] = useState('A carregar...');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPrivacyModalVisible, setIsPrivacyModalVisible] = useState(false);
  const [isAccountModalVisible, setIsAccountModalVisible] = useState(false);
  const [isNotificationsModalVisible, setIsNotificationsModalVisible] = useState(false);
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
  const notificationStats = useMemo(() => {
    const importantCount = notifications.filter((item) => !item.read && item.type !== 'system').length;
    const latest = notifications[0];

    return {
      total: notifications.length,
      unread: unreadCount,
      important: importantCount,
      latest,
    };
  }, [notifications, unreadCount]);

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
  const currentStateLabel =
    currentState.charAt(0) + currentState.slice(1).toLowerCase();

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

  const [discoveredDevices, setDiscoveredDevices] = useState<ConnectedDevice[]>([]);
  const [isRefreshingDevices, setIsRefreshingDevices] = useState(false);
  const [isRequestingDiscovery, setIsRequestingDiscovery] = useState(false);
  const [hardwareError, setHardwareError] = useState<string | null>(null);
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

  const loadConnectedDevices = async (userId: string, homeId: number | string | null) => {
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
      return [];
    }

    const rawDevices = ((data ?? []) as unknown) as DeviceRecord[];
    const devices = sortDevicesByFreshness(
      rawDevices.filter((device) => isRealHomeDevice(device)),
    ) as ConnectedDevice[];
    setHardwareError(null);
    setDiscoveredDevices(devices);
    return devices;
  };

  const refreshConnectedDevices = async (userId: string, homeId: number | string | null) => {
    setIsRefreshingDevices(true);
    try {
      await loadConnectedDevices(userId, homeId);
    } finally {
      setIsRefreshingDevices(false);
    }
  };

  const requestAutomaticDiscovery = async () => {
    setIsRequestingDiscovery(true);
    try {
      const { data, error } = await supabase.functions.invoke('request-device-discovery', {
        body: {},
      });

      if (error) throw error;
    } catch (error: any) {
      console.error('Failed to request automatic discovery:', error);
    } finally {
      setIsRequestingDiscovery(false);
    }
  };

  // Função para sincronizar dispositivos com o Supabase
  const syncDeviceToDB = async (name: string, type: string, source: string, externalId?: string) => {
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
  };

  useEffect(() => {
    let activeHomeChannel: ReturnType<typeof subscribeToHomeDeviceChanges> | null = null;

    const fetchUser = async () => {
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
            ? supabase.from('homes').select('name, join_code, device_sync_token').eq('id', finalHomeId).maybeSingle()
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
      }
      setIsLoading(false);
    };

    const checkHealthConnect = async () => {
      try {
        const {
          getGrantedPermissions,
          getSdkStatus,
          SdkAvailabilityStatus,
        } = require('react-native-health-connect');
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
          setHealthConnectStatus('disconnected');
          return;
        }

        setHealthConnectStatus('connected');
        await syncDeviceToDB('Health Connect', 'heart', 'health_connect', 'android_hc');
      } catch (e) {
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
  }, []);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const handleImagePick = async () => {
    const base64OrUri = await pickImage();
    if (!base64OrUri) return;

    setAvatarUrl(typeof base64OrUri === 'string' ? base64OrUri : null);

    const publicUrl = await uploadImage(base64OrUri, 'avatars');
    if (publicUrl) {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (user) {
        const { error: dbError } = await supabase.from('users').update({ avatar_url: publicUrl }).eq('email', user.email);
        if (dbError) {
          console.error("Erro a atualizar tabela users:", dbError);
          alert("A foto foi guardada no auth, mas falhou ao guardar na tabela publica users (erro RLS): " + dbError.message);
        }
      }

      setAvatarUrl(publicUrl);
      alert('Foto de perfil atualizada com sucesso!');
    } else {
      alert('Erro ao fazer upload da foto de perfil.');
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
        alert("Erro ao gravar hobbies: " + error.message);
      } else {
        setSelectedHobbies(parseHobbies(data?.hobbies));
        setIsModalVisible(false);
      }

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
          <TouchableOpacity onPress={handleImagePick} activeOpacity={0.8} style={{ position: 'relative' }}>
            {isLoading ? (
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
          {joinCode && (
            <View className="bg-[#E8EDDF] px-4 py-1.5 rounded-full mt-2 border border-[#C8D2C8]">
              <Text
                className="text-[#4A5D4E] text-sm"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                Join Code: <Text className="text-[#5B8C51] tracking-widest">{joinCode}</Text>
              </Text>
            </View>
          )}
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
                } = require('react-native-health-connect');
                const status = await getSdkStatus();
                if (status !== SdkAvailabilityStatus.SDK_AVAILABLE) {
                  alert('Health Connect is not available or needs to be installed.');
                  return;
                }

                const initialized = await initialize();
                if (initialized) {
                  if (healthConnectStatus !== 'connected') {
                    openHealthConnectSettings();
                    alert('Please enable Nidush heart rate permissions in Health Connect settings.');
                    return;
                  }

                  try {
                    openHealthConnectDataManagement();
                  } catch {
                    openHealthConnectSettings();
                  }
                }
              } catch (e) {
                alert('Could not open Health Connect settings.');
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

          <View className="bg-white/60 rounded-2xl p-4 mt-4 border border-[#E8EDDF]">
            <View className="flex-row items-center justify-between mb-3">
              <View>
                <Text
                  maxFontSizeMultiplier={1.2}
                  className="text-[#4A5D4E] text-base"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Heart rate
                </Text>
                <Text
                  maxFontSizeMultiplier={1.2}
                  className="text-gray-500 text-xs mt-0.5"
                  style={{ fontFamily: 'Nunito_400Regular' }}
                >
                  Current: {latestHeartRateLabel} · {currentState.toLowerCase()}
                </Text>
              </View>
              <MaterialIcons name="monitor-heart" size={24} color="#5B8C51" />
            </View>
            <View className="bg-[#F5F7F0] rounded-2xl p-3 border border-[#D1D9C5]">
              <Text
                maxFontSizeMultiplier={1.2}
                className="text-[#71806F] text-xs"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                Nidush analysis
              </Text>
              <Text
                maxFontSizeMultiplier={1.2}
                className="text-[#4A5D4E] text-lg mt-1"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                {biometricData?.heartRate
                  ? `${currentStateLabel} from ${latestHeartRateLabel}`
                  : 'Waiting for today\'s watch reading'}
              </Text>
              <Text
                maxFontSizeMultiplier={1.2}
                className="text-gray-500 text-xs mt-1"
                style={{ fontFamily: 'Nunito_400Regular' }}
              >
                Source: {latestWearableSource}
                {latestWearableTime ? ` · ${latestWearableTime}` : ''}
              </Text>
            </View>
          </View>
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

            <View className="flex-row justify-between mb-5">
              <NotificationStat label="Unread" value={notificationStats.unread} />
              <NotificationStat label="Important" value={notificationStats.important} />
              <NotificationStat label="Total" value={notificationStats.total} />
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
                className="text-sm text-[#71806F] mb-2"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                Latest
              </Text>
              {notificationStats.latest ? (
                <>
                  <Text
                    className="text-lg text-[#4A5D4E]"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    {notificationStats.latest.title}
                  </Text>
                  <Text
                    className="text-[#4A5D4E] mt-1 leading-5"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  >
                    {notificationStats.latest.message}
                  </Text>
                </>
              ) : (
                <Text
                  className="text-[#71806F]"
                  style={{ fontFamily: 'Nunito_400Regular' }}
                >
                  Nothing yet. Nidush will show useful activity and system updates here.
                </Text>
              )}
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
                  Open notification center
                </Text>
              </TouchableOpacity>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={async () => {
                    await markAllAsRead();
                    await refreshNotifications();
                  }}
                  className="flex-1 bg-[#E8EDDF] py-3 rounded-full items-center"
                  accessibilityRole="button"
                  accessibilityLabel="Mark all notifications as read"
                >
                  <Text
                    className="text-[#4A5D4E]"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    Mark read
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={clearAll}
                  className="flex-1 bg-[#FFE9E9] py-3 rounded-full items-center"
                  accessibilityRole="button"
                  accessibilityLabel="Clear all notifications"
                >
                  <Text
                    className="text-[#C75656]"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    Clear all
                  </Text>
                </TouchableOpacity>
              </View>
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
          <View className="bg-white w-full rounded-t-[40px] px-8 pt-8 pb-16 shadow-2xl h-[76%]">
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

            <ScrollView showsVerticalScrollIndicator={false} className="mb-4">
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

function DeviceItem({ name, status, connected, icon, testID }: any) {
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

function NotificationStat({ label, value }: { label: string; value: number }) {
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

function MenuItem({ icon, label, border = true, testID, onPress, badge }: any) {
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
