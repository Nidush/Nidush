import { MaterialCommunityIcons, MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../../utils/supabase';

import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';

import AddRoomDevice from '../../components/rooms/AddRoomDevice';
import CategoryPill from '../../components/rooms/CategoryPill';
import DeviceCard from '../../components/rooms/device-card';
import { FeedbackState } from '../../components/UI/FeedbackState';
import { SearchAutocomplete } from '../../components/UI/SearchAutocomplete';
import {
  AppDevice,
  DeviceRecord,
  isRealHomeDevice,
  mapDeviceRecordToAppDevice,
  subscribeToHomeDeviceChanges,
} from '../../utils/devices';
import {
  GoogleHomeSyncedDevice,
  syncGoogleHomeSnapshot,
  setGoogleHomeDeviceColor,
  setGoogleHomeDeviceBrightness,
  setGoogleHomeDevicePower,
} from '../../utils/googleHome';
import { updateDeviceStateRecord } from '../../utils/deviceExecution';
import { createHomeRoom } from '../../utils/homeSetup';
import { MAX_SEARCH_LENGTH, normalizeSearchInput } from '../../utils/searchSecurity';

interface Room {
  id: number;
  name: string;
}

type Device = AppDevice;

interface ActivityItem {
  id: number;
  title: string;
  description: string;
  type: string;
  image: string;
  room_id?: number | null;
}

const LIGHT_COLOR_OPTIONS = [
  '#FFD65A',
  '#F4A261',
  '#F28482',
  '#84A59D',
  '#86B3EB',
  '#CDB4DB',
] as const;

const normalizeRoomName = (value: string) => value.trim().toLowerCase();

const extractDeviceRoomName = (device: DeviceRecord) => {
  const metadata = device.metadata && typeof device.metadata === 'object'
    ? device.metadata
    : null;

  const candidates = [
    device.room_hint,
    typeof metadata?.roomName === 'string' ? metadata.roomName : null,
    typeof metadata?.roomHint === 'string' ? metadata.roomHint : null,
  ];

  return candidates.find((value) => typeof value === 'string' && value.trim())?.trim() ?? null;
};

const roomsScreenCache: {
  rooms: Room[];
  activeRoomId: number | null;
  allDevices: Device[];
  allActivities: ActivityItem[];
  hasLoadedOnce: boolean;
  loadError: string | null;
  userHomeId: number | null;
} = {
  rooms: [],
  activeRoomId: null,
  allDevices: [],
  allActivities: [],
  hasLoadedOnce: false,
  loadError: null,
  userHomeId: null,
};

const LIVE_DEVICE_REFRESH_INTERVAL_MS = 12000;

export default function Rooms() {
  // --- Fonts ---
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  // --- States ---
  const [rooms, setRooms] = useState<Room[]>(roomsScreenCache.rooms);
  const [activeRoomId, setActiveRoomId] = useState<number | null>(roomsScreenCache.activeRoomId);
  const [allDevices, setAllDevices] = useState<Device[]>(roomsScreenCache.allDevices);
  const [allActivities, setAllActivities] = useState<ActivityItem[]>(roomsScreenCache.allActivities);
  const [junctions, setJunctions] = useState<{ activity_id: number; device_id: number }[]>([]);
  const [loading, setLoading] = useState(!roomsScreenCache.hasLoadedOnce);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(roomsScreenCache.hasLoadedOnce);
  const [loadError, setLoadError] = useState<string | null>(roomsScreenCache.loadError);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<'error' | 'success' | 'info'>('info');
  const [searchQuery, setSearchQuery] = useState('');
  const [userHomeId, setUserHomeId] = useState<number | null>(roomsScreenCache.userHomeId);
  const [isAdjustingLight, setIsAdjustingLight] = useState(false);
  const refreshTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isRefreshingDevicesRef = useRef(false);
  const createPanelTranslateX = useRef(new Animated.Value(900)).current;

  // --- Add Device / Room Panel State ---
  const [createPanelMode, setCreatePanelMode] = useState<'room' | 'device' | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceType, setNewDeviceType] = useState<'light' | 'speaker' | 'difuser' | 'purifier'>('light');
  const [newDeviceRoomId, setNewDeviceRoomId] = useState<number | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isDeletingRoom, setIsDeletingRoom] = useState(false);
  const [roomPendingDeletion, setRoomPendingDeletion] = useState<number | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [deviceDraftName, setDeviceDraftName] = useState('');
  const [deviceDraftRoomId, setDeviceDraftRoomId] = useState<number | null>(null);
  const [isSavingDeviceDetails, setIsSavingDeviceDetails] = useState(false);
  const [selectedLightColor, setSelectedLightColor] = useState<string>(LIGHT_COLOR_OPTIONS[0]);
  const [isUpdatingLightColor, setIsUpdatingLightColor] = useState(false);

  // --- Manage Linked Devices Modal State ---
  const [isManageModalVisible, setIsManageModalVisible] = useState(false);
  const [selectedActivity, setSelectedActivity] = useState<ActivityItem | null>(null);
  const [tempLinkedDeviceIds, setTempLinkedDeviceIds] = useState<number[]>([]);
  const [isSavingLinks, setIsSavingLinks] = useState(false);

  const syncGoogleHomeDevicesToDb = useCallback(
    async (userId: string, homeId: number, devices: GoogleHomeSyncedDevice[]) => {
      const seenExternalIds = new Set<string>();
      const now = new Date().toISOString();
      const roomIdByName = new Map<string, number>();

      const { data: existingRooms, error: roomsError } = await supabase
        .from('rooms')
        .select('id, name')
        .eq('home_id', homeId)
        .order('id', { ascending: true });

      if (roomsError) throw roomsError;

      for (const room of existingRooms ?? []) {
        if (!room?.name) continue;
        roomIdByName.set(normalizeRoomName(room.name), room.id);
      }

      for (const device of devices) {
        const externalId = String(device.externalId ?? '').trim();
        const name = String(device.name ?? '').trim();
        if (!externalId || !name) continue;

        seenExternalIds.add(externalId);

        const googleRoomName = String(device.roomName ?? device.roomHint ?? '').trim();
        let roomId: number | null = null;

        if (googleRoomName) {
          const normalizedRoomName = normalizeRoomName(googleRoomName);
          roomId = roomIdByName.get(normalizedRoomName) ?? null;

          if (roomId == null) {
            const { data: createdRoom, error: createRoomError } = await supabase
              .from('rooms')
              .insert({
                home_id: homeId,
                name: googleRoomName,
              })
              .select('id, name')
              .single();

            if (createRoomError) throw createRoomError;

            roomId = createdRoom.id;
            roomIdByName.set(normalizedRoomName, createdRoom.id);
          }
        }

        const payload = {
          name,
          type: device.type || 'unknown',
          source: 'google_home',
          status: device.isOn ? 'On' : 'Off',
          connectivity_status: device.isOnline === false ? 'offline' : 'online',
          discovery_method: 'integration',
          sync_source: 'google_home',
          user_id: userId,
          home_id: homeId,
          external_id: externalId,
          last_seen: now,
          manufacturer: device.manufacturer ?? null,
          model: device.model ?? null,
          room_id: roomId,
          room_hint: googleRoomName || null,
          metadata: {
            roomName: device.roomName ?? null,
            roomHint: device.roomHint ?? null,
            traits: device.traits ?? [],
            provider: 'google_home',
            ...((device.metadata ?? {}) as Record<string, unknown>),
          },
        };

        const legacyPayload = {
          name,
          type: device.type || 'unknown',
          source: 'google_home',
          status: device.isOn ? 'On' : 'Off',
          user_id: userId,
          home_id: homeId,
          external_id: externalId,
          last_seen: now,
          room_id: roomId,
        };

        const { data: existing, error: existingError } = await supabase
          .from('devices')
          .select('id')
          .eq('home_id', homeId)
          .eq('source', 'google_home')
          .eq('external_id', externalId)
          .limit(1)
          .maybeSingle();

        if (existingError) throw existingError;

        const request = existing
          ? supabase.from('devices').update(payload).eq('id', existing.id)
          : supabase.from('devices').insert(payload);

        let { error } = await request;

        if (error?.code === '42703') {
          const fallbackRequest = existing
            ? supabase.from('devices').update(legacyPayload).eq('id', existing.id)
            : supabase.from('devices').insert(legacyPayload);

          const fallbackResult = await fallbackRequest;
          error = fallbackResult.error;
        }

        if (error) throw error;
      }

      if (seenExternalIds.size > 0) {
        await supabase
          .from('devices')
          .update({
            status: 'Off',
            connectivity_status: 'offline',
          })
          .eq('home_id', homeId)
          .eq('source', 'google_home')
          .not('external_id', 'in', `(${Array.from(seenExternalIds)
            .map((value) => `"${value.replace(/"/g, '\\"')}"`)
            .join(',')})`);
      }
    },
    [],
  );

  const mapVisibleDevices = useCallback(
    (devicesData: DeviceRecord[], loadedRooms: Room[]) => {
      const roomIdByName = new Map(
        loadedRooms.map((room) => [normalizeRoomName(room.name), room.id] as const),
      );
      const virtualRooms: Room[] = [];
      let nextVirtualRoomId = -1;

      const mappedDevices: Device[] = (devicesData || [])
        .filter((device: DeviceRecord) => isRealHomeDevice(device))
        .filter((device: DeviceRecord) => device.source?.toLowerCase() !== 'health_connect')
        .map((device: DeviceRecord) => {
          const mappedDevice = mapDeviceRecordToAppDevice(device);

          if (mappedDevice.room_id != null) {
            return mappedDevice;
          }

          const googleRoomName = extractDeviceRoomName(device);
          if (!googleRoomName) {
            return mappedDevice;
          }

          const normalizedRoomName = normalizeRoomName(googleRoomName);
          let resolvedRoomId = roomIdByName.get(normalizedRoomName) ?? null;

          if (resolvedRoomId == null) {
            resolvedRoomId = nextVirtualRoomId;
            nextVirtualRoomId -= 1;
            roomIdByName.set(normalizedRoomName, resolvedRoomId);
            virtualRooms.push({
              id: resolvedRoomId,
              name: googleRoomName,
            });
          }

          return {
            ...mappedDevice,
            room_id: resolvedRoomId,
          };
        });

      return {
        mappedDevices,
        virtualRooms,
      };
    },
    [],
  );

  const showFeedback = useCallback((message: string, tone: 'error' | 'success' | 'info' = 'info') => {
    setFeedbackMessage(message);
    setFeedbackTone(tone);
  }, []);

  // --- Load Data from Database ---
  const loadDatabaseData = useCallback(async (options?: { showLoader?: boolean }) => {
    if (isRefreshingDevicesRef.current) return;
    isRefreshingDevicesRef.current = true;

    const showLoader = options?.showLoader ?? !hasLoadedOnce;

    if (showLoader) {
      setLoading(true);
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoadError('Sign in again to load your rooms and devices.');
        setLoading(false);
        return;
      }

      // 1. Get current user's home ID
      const { data: homeAssoc } = await supabase
        .from('user_homes')
        .select('home_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!homeAssoc?.home_id) {
        setLoadError('Connect this profile to a home to start organizing rooms and devices.');
        setLoading(false);
        return;
      }
      
      const homeId = homeAssoc.home_id;
      setUserHomeId(homeId);
      roomsScreenCache.userHomeId = homeId;

      try {
        const snapshot = await syncGoogleHomeSnapshot();
        if (snapshot.devices.length > 0) {
          await syncGoogleHomeDevicesToDb(user.id, homeId, snapshot.devices);
        }
      } catch (error) {
        console.warn('Rooms screen could not refresh Google Home live state:', error);
      }

      const [
        { data: roomsData, error: roomsErr },
        { data: devicesData, error: devicesErr },
        { data: activitiesData, error: activitiesErr },
      ] = await Promise.all([
        supabase
          .from('rooms')
          .select('id, name')
          .eq('home_id', homeId)
          .order('id', { ascending: true }),
        supabase
          .from('devices')
          .select('*')
          .eq('home_id', homeId),
        supabase
          .from('activities')
          .select('*')
          .eq('home_id', homeId),
      ]);

      if (roomsErr) throw roomsErr;
      if (devicesErr) throw devicesErr;
      if (activitiesErr) throw activitiesErr;

      const loadedRooms = roomsData || [];
      const loadedActivities = activitiesData || [];
      const { mappedDevices, virtualRooms } = mapVisibleDevices(
        devicesData || [],
        loadedRooms,
      );
      const effectiveRooms = [...loadedRooms, ...virtualRooms];

      setRooms(effectiveRooms);
      setAllDevices(mappedDevices);
      setAllActivities(loadedActivities);
      setLoadError(null);
      setActiveRoomId((prev) => {
        if (prev === null) return null;
        return effectiveRooms.some((room) => room.id === prev) ? prev : null;
      });
      roomsScreenCache.activeRoomId =
        roomsScreenCache.activeRoomId !== null &&
        effectiveRooms.some((room) => room.id === roomsScreenCache.activeRoomId)
          ? roomsScreenCache.activeRoomId
          : null;
      roomsScreenCache.rooms = effectiveRooms;
      roomsScreenCache.allDevices = mappedDevices;
      roomsScreenCache.allActivities = loadedActivities;
      roomsScreenCache.loadError = null;

      // Only fetch links for activities that actually belong to this home.
      const activityIds = loadedActivities.map((activity) => activity.id).filter(Boolean);
      if (activityIds.length === 0) {
        setJunctions([]);
        return;
      }

      try {
        const { data: junctionsData, error: junctionsErr } = await supabase
          .from('activity_devices')
          .select('activity_id, device_id')
          .in('activity_id', activityIds);

        if (junctionsErr) {
          const isMissingJunctionTable =
            junctionsErr.code === 'PGRST205' ||
            junctionsErr.code === '42P01' ||
            /activity_devices/i.test(junctionsErr.message || '');

          if (isMissingJunctionTable) {
            console.log(
              'activity_devices table is not available yet; continuing without linked devices.',
            );
            setJunctions([]);
            return;
          }

          throw junctionsErr;
        }

        setJunctions(junctionsData || []);
      } catch (err) {
        console.log('activity_devices junction table not fully migrated or empty:', err);
      }

    } catch (error) {
      console.error('Error fetching room/device details:', error);
      setLoadError('We could not load your smart home right now. Pull to refresh or try again in a moment.');
      roomsScreenCache.loadError = 'We could not load your smart home right now. Pull to refresh or try again in a moment.';
    } finally {
      isRefreshingDevicesRef.current = false;
      roomsScreenCache.hasLoadedOnce = true;
      setHasLoadedOnce(true);
      setLoading(false);
    }
  }, [hasLoadedOnce, mapVisibleDevices, syncGoogleHomeDevicesToDb]);

  const refreshDevicesOnly = useCallback(async () => {
    if (isRefreshingDevicesRef.current) return;
    isRefreshingDevicesRef.current = true;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { data: homeAssoc } = await supabase
        .from('user_homes')
        .select('home_id')
        .eq('user_id', user.id)
        .maybeSingle();

      const homeId = homeAssoc?.home_id;
      if (!homeId) return;

      try {
        const snapshot = await syncGoogleHomeSnapshot();
        if (snapshot.devices.length > 0) {
          await syncGoogleHomeDevicesToDb(user.id, homeId, snapshot.devices);
        }
      } catch (error) {
        console.warn('Rooms screen could not refresh Google Home live state:', error);
      }

      const { data: devicesData, error: devicesErr } = await supabase
        .from('devices')
        .select('*')
        .eq('home_id', homeId);

      if (devicesErr) throw devicesErr;

      const baseRooms = roomsScreenCache.rooms.filter((room) => room.id > 0);
      const { mappedDevices, virtualRooms } = mapVisibleDevices(
        devicesData || [],
        baseRooms,
      );
      const effectiveRooms = [...baseRooms, ...virtualRooms];

      setAllDevices(mappedDevices);
      roomsScreenCache.allDevices = mappedDevices;

      setRooms(effectiveRooms);
      roomsScreenCache.rooms = effectiveRooms;

      setActiveRoomId((prev) => {
        if (prev === null) return null;
        return effectiveRooms.some((room) => room.id === prev) ? prev : null;
      });
      roomsScreenCache.activeRoomId =
        roomsScreenCache.activeRoomId !== null &&
        effectiveRooms.some((room) => room.id === roomsScreenCache.activeRoomId)
          ? roomsScreenCache.activeRoomId
          : null;
    } catch (error) {
      console.error('Error refreshing room devices:', error);
    } finally {
      isRefreshingDevicesRef.current = false;
    }
  }, [mapVisibleDevices, syncGoogleHomeDevicesToDb]);

  // Reload data when page gets focused
  useFocusEffect(
    useCallback(() => {
      loadDatabaseData({ showLoader: !hasLoadedOnce });
    }, [hasLoadedOnce, loadDatabaseData])
  );

  useEffect(() => {
    if (!userHomeId) return;

    const channel = subscribeToHomeDeviceChanges(userHomeId, () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }

      refreshTimeoutRef.current = setTimeout(() => {
        refreshDevicesOnly();
      }, 250);
    });

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
        refreshTimeoutRef.current = null;
      }
      supabase.removeChannel(channel);
    };
  }, [refreshDevicesOnly, userHomeId]);

  useEffect(() => {
    if (!userHomeId) return;

    const interval = setInterval(() => {
      refreshDevicesOnly();
    }, LIVE_DEVICE_REFRESH_INTERVAL_MS);

    return () => {
      clearInterval(interval);
    };
  }, [refreshDevicesOnly, userHomeId]);

  // --- Real-time Updates ---
  const toggleDevice = async (deviceId: number) => {
    // Optimistic UI Update
    const device = allDevices.find(d => d.id === deviceId);
    if (!device) return;

    const nextStatus = device.status === 'On' ? 'Off' : 'On';
    const fallbackLevel =
      typeof device.level === 'number' && Number.isFinite(device.level)
        ? Math.round(device.level)
        : device.type === 'light'
          ? 100
          : 50;
    const nextLevel = nextStatus === 'On'
      ? Math.max(1, fallbackLevel)
      : 0;
    
    setAllDevices(prev => prev.map(d => 
      d.id === deviceId
        ? {
            ...d,
            status: nextStatus,
            level: d.type === 'light' ? nextLevel : d.level,
            status_level: d.type === 'light' ? nextLevel : d.status_level,
          }
        : d
    ));

    try {
      if (device.source === 'google_home' && device.external_id) {
        await setGoogleHomeDevicePower(device.external_id, nextStatus === 'On');
      }

      await updateDeviceStateRecord(deviceId, {
        powerOn: nextStatus === 'On',
        level: device.type === 'light' ? nextLevel : null,
      });
    } catch (err: unknown) {
      console.error('Failed to toggle device status:', err);
      // Revert status on failure
      setAllDevices(prev => prev.map(d => 
        d.id === deviceId ? { ...d, status: device.status } : d
      ));
      showFeedback('Could not sync device status to the server.', 'error');
    }
  };

  const updateDeviceLevel = async (deviceId: number, newLevel: number) => {
    const roundedLevel = Math.round(newLevel);
    const nextStatus = roundedLevel > 0 ? 'On' : 'Off';
    const device = allDevices.find((entry) => entry.id === deviceId);
    
    setAllDevices(prev => prev.map(d => 
      d.id === deviceId
        ? { ...d, level: roundedLevel, status_level: roundedLevel, status: nextStatus }
        : d
    ));

    try {
      if (device?.source === 'google_home' && device.external_id) {
        await setGoogleHomeDeviceBrightness(device.external_id, roundedLevel);
      }

      await updateDeviceStateRecord(deviceId, {
        powerOn: roundedLevel > 0,
        level: roundedLevel,
      });
    } catch (err) {
      console.error('Failed to update device level:', err);
    }
  };

  const openDeviceDetails = (device: Device) => {
    setSelectedDevice(device);
    setDeviceDraftName(device.name);
    setDeviceDraftRoomId(device.room_id ?? rooms[0]?.id ?? null);
    setSelectedLightColor(LIGHT_COLOR_OPTIONS[0]);
  };

  const closeDeviceDetails = () => {
    setSelectedDevice(null);
    setDeviceDraftName('');
    setDeviceDraftRoomId(null);
    setIsSavingDeviceDetails(false);
    setIsUpdatingLightColor(false);
  };

  const handleSetDeviceColor = async (colorHex: string) => {
    if (!selectedDevice) return;

    if (selectedDevice.type !== 'light') {
      showFeedback('Only lights support color changes here.', 'info');
      return;
    }

    setSelectedLightColor(colorHex);

    if (selectedDevice.source !== 'google_home' || !selectedDevice.external_id) {
      showFeedback('This light does not expose Google Home color control yet.', 'info');
      return;
    }

    setIsUpdatingLightColor(true);
    try {
      await setGoogleHomeDeviceColor(selectedDevice.external_id, colorHex);
      showFeedback(`Updated ${selectedDevice.name} to ${colorHex}.`, 'success');
    } catch (err) {
      console.error('Failed to update device color:', err);
      showFeedback(
        err instanceof Error
          ? err.message
          : 'Could not change this light color right now.',
        'error',
      );
    } finally {
      setIsUpdatingLightColor(false);
    }
  };

  const handleSaveDeviceDetails = async () => {
    if (!selectedDevice) return;

    if (!deviceDraftName.trim()) {
      showFeedback('Please enter a device name.', 'error');
      return;
    }

    if (!deviceDraftRoomId) {
      showFeedback('Choose a room for this device.', 'error');
      return;
    }

    setIsSavingDeviceDetails(true);
    try {
      const updates = {
        name: deviceDraftName.trim(),
        room_id: deviceDraftRoomId,
      };

      const { error } = await supabase
        .from('devices')
        .update(updates)
        .eq('id', selectedDevice.id);

      if (error) throw error;

      setAllDevices((prev) =>
        prev.map((device) =>
          device.id === selectedDevice.id
            ? { ...device, name: updates.name, room_id: updates.room_id }
            : device,
        ),
      );

      closeDeviceDetails();
    } catch (err: unknown) {
      console.error('Failed to update device details:', err);
      showFeedback('Could not save the device changes.', 'error');
      setIsSavingDeviceDetails(false);
    }
  };

  const handleDeleteFromDetails = () => {
    if (!selectedDevice) return;

    const deviceToDelete = selectedDevice;
    (async () => {
      try {
        const { error } = await supabase
          .from('devices')
          .delete()
          .eq('id', deviceToDelete.id);

        if (error) throw error;

        setAllDevices((prev) => prev.filter((device) => device.id !== deviceToDelete.id));
        closeDeviceDetails();
        showFeedback(`Removed "${deviceToDelete.name}" from your smart home.`, 'success');
      } catch (err: unknown) {
        console.error('Failed to delete device:', err);
        showFeedback('Could not remove this device.', 'error');
      }
    })();
  };

  // --- Add Device Handler ---
  const handleAddDevice = async () => {
    if (!newDeviceName.trim()) {
      showFeedback('Please enter a device name.', 'error');
      return;
    }

    if (!newDeviceRoomId || !userHomeId) {
      showFeedback('Choose a room for this device first.', 'error');
      return;
    }

    setIsAdding(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const payload = {
        name: newDeviceName.trim(),
        type: newDeviceType,
        source: 'network',
        status: 'Off',
        connectivity_status: 'online',
        discovery_method: 'manual',
        sync_source: 'manual',
        status_level: newDeviceType === 'light' ? 100 : 50,
        room_id: newDeviceRoomId,
        home_id: userHomeId,
        user_id: user?.id || null,
        external_id: `room_dev:${Date.now()}`,
      };
      const legacyPayload = {
        name: newDeviceName.trim(),
        type: newDeviceType,
        source: 'network',
        status: 'Off',
        status_level: newDeviceType === 'light' ? 100 : 50,
        room_id: newDeviceRoomId,
        home_id: userHomeId,
        user_id: user?.id || null,
        external_id: payload.external_id,
      };

      let { data, error } = await supabase
        .from('devices')
        .insert(payload)
        .select()
        .single();

      if (error?.code === '42703') {
        const fallbackResult = await supabase
          .from('devices')
          .insert(legacyPayload)
          .select()
          .single();
        data = fallbackResult.data;
        error = fallbackResult.error;
      }

      if (error) throw error;

      if (data) {
        setAllDevices(prev => [...prev, {
          ...mapDeviceRecordToAppDevice(data as DeviceRecord),
        }]);

        closeCreatePanel();
        setNewDeviceName('');
        setNewDeviceRoomId(activeRoomId ?? rooms[0]?.id ?? null);
        showFeedback(`"${data.name}" was added to the selected room.`, 'success');
      }
    } catch (err: unknown) {
      console.error('Failed to add device:', err);
      showFeedback(
        'Could not create new smart device: ' +
          (err instanceof Error ? err.message : 'Unknown error'),
        'error',
      );
    } finally {
      setIsAdding(false);
    }
  };

  // --- Manage Linked Devices Handler ---
  const toggleLinkDevice = (deviceId: number) => {
    setTempLinkedDeviceIds(prev => 
      prev.includes(deviceId) 
        ? prev.filter(id => id !== deviceId) 
        : [...prev, deviceId]
    );
  };

  const handleSaveLinks = async () => {
    if (!selectedActivity) return;
    setIsSavingLinks(true);
    
    try {
      const { error: deleteErr } = await supabase
        .from('activity_devices')
        .delete()
        .eq('activity_id', selectedActivity.id);

      if (deleteErr) throw deleteErr;

      if (tempLinkedDeviceIds.length > 0) {
        const payload = tempLinkedDeviceIds.map(devId => ({
          activity_id: selectedActivity.id,
          device_id: devId
        }));

        const { error: insertErr } = await supabase
          .from('activity_devices')
          .insert(payload);

        if (insertErr) throw insertErr;
      }

      setJunctions(prev => {
        const filtered = prev.filter(j => j.activity_id !== selectedActivity.id);
        const added = tempLinkedDeviceIds.map(devId => ({
          activity_id: selectedActivity.id,
          device_id: devId
        }));
        return [...filtered, ...added];
      });

      setIsManageModalVisible(false);
      setSelectedActivity(null);
      showFeedback('Linked devices updated successfully.', 'success');
    } catch (err: unknown) {
      console.error('Failed to save activity-device links:', err);
      showFeedback(
        'Failed to update linked devices: ' +
          (err instanceof Error ? err.message : 'Unknown error'),
        'error',
      );
    } finally {
      setIsSavingLinks(false);
    }
  };

  // --- Filtering & Memoized room elements ---
  const activeRoom = useMemo(
    () => rooms.find((room) => room.id === activeRoomId),
    [activeRoomId, rooms],
  );

  const roomDevices = useMemo(
    () =>
      activeRoomId === null
        ? allDevices
        : allDevices.filter((device) => device.room_id === activeRoomId),
    [activeRoomId, allDevices],
  );

  const filteredDevices = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return roomDevices.filter((device) => {
      const matchesSearch =
        normalizedQuery.length === 0 || device.name.toLowerCase().includes(normalizedQuery);
      return matchesSearch;
    });
  }, [roomDevices, searchQuery]);

  const searchSuggestions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (normalizedQuery.length < 2) return [];

    const seen = new Set<string>();
    const suggestions: string[] = [];

    for (const device of roomDevices) {
      const name = device.name.trim();
      if (!name.toLowerCase().includes(normalizedQuery)) continue;
      if (seen.has(name.toLowerCase())) continue;
      seen.add(name.toLowerCase());
      suggestions.push(name);
      if (suggestions.length >= 5) break;
    }

    return suggestions;
  }, [roomDevices, searchQuery]);

  const openAddDeviceModal = () => {
    if (rooms.length === 0) {
      showFeedback('Create a room first, then assign your device to it.', 'info');
      return;
    }

    setNewDeviceRoomId(activeRoomId ?? rooms[0]?.id ?? null);
    setCreatePanelMode('device');
    createPanelTranslateX.setValue(900);
    Animated.timing(createPanelTranslateX, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  };

  const openAddRoomModal = () => {
    setNewRoomName('');
    setCreatePanelMode('room');
    createPanelTranslateX.setValue(900);
    Animated.timing(createPanelTranslateX, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  };

  const closeCreatePanel = () => {
    Animated.timing(createPanelTranslateX, {
      toValue: 900,
      duration: 240,
      useNativeDriver: true,
    }).start(() => {
      setCreatePanelMode(null);
      setIsAdding(false);
    });
  };

  const handleAddRoom = async () => {
    if (!newRoomName.trim()) {
      showFeedback('Please enter a room name.', 'error');
      return;
    }

    if (!userHomeId) {
      showFeedback('We could not find your home right now.', 'error');
      return;
    }

    try {
      const createdRoom = await createHomeRoom(userHomeId, newRoomName);
      setRooms((prev) => [...prev, createdRoom]);
      setActiveRoomId(createdRoom.id);
      setNewDeviceRoomId(createdRoom.id);
      closeCreatePanel();
      setNewRoomName('');
      showFeedback(`"${createdRoom.name}" was added to your home.`, 'success');
    } catch (err: unknown) {
      console.error('Failed to add room:', err);
      showFeedback(
        'Could not create new room: ' +
          (err instanceof Error ? err.message : 'Unknown error'),
        'error',
      );
    }
  };

  const handleDeleteRoom = useCallback(async (room: Room) => {
    if (isDeletingRoom) return;

    setIsDeletingRoom(true);
    try {
      const { error: devicesError } = await supabase
        .from('devices')
        .update({ room_id: null })
        .eq('room_id', room.id);

      if (devicesError) throw devicesError;

      const { error: activitiesError } = await supabase
        .from('activities')
        .update({ room_id: null })
        .eq('room_id', room.id);

      if (activitiesError) throw activitiesError;

      const { error: scenariosError } = await supabase
        .from('scenarios')
        .delete()
        .eq('room_id', room.id);

      if (scenariosError) throw scenariosError;

      const { error } = await supabase
        .from('rooms')
        .delete()
        .eq('id', room.id);

      if (error) throw error;

      setRooms((current) => {
        const nextRooms = current.filter((item) => item.id !== room.id);
        roomsScreenCache.rooms = nextRooms;
        return nextRooms;
      });
      setAllDevices((current) => {
        const nextDevices = current.map((device) =>
          device.room_id === room.id
            ? { ...device, room_id: null }
            : device,
        );
        roomsScreenCache.allDevices = nextDevices;
        return nextDevices;
      });
      setAllActivities((current) => {
        const nextActivities = current.map((activity) =>
          activity.room_id === room.id
            ? { ...activity, room_id: null }
            : activity,
        );
        roomsScreenCache.allActivities = nextActivities;
        return nextActivities;
      });
      setActiveRoomId((current) => {
        if (current !== room.id) return current;
        roomsScreenCache.activeRoomId = null;
        return null;
      });
      setRoomPendingDeletion((current) => (current === room.id ? null : current));
      showFeedback(`"${room.name}" was removed from your home.`, 'success');
    } catch (err: unknown) {
      console.error('Failed to delete room:', err);
      showFeedback(
        'Could not delete this room: ' +
          (err instanceof Error ? err.message : 'Unknown error'),
        'error',
      );
    } finally {
      setIsDeletingRoom(false);
    }
  }, [isDeletingRoom, showFeedback]);

  const menuActions = [
    { label: 'Room', onPress: openAddRoomModal },
    { label: 'Device', onPress: openAddDeviceModal },
  ];

  if (!fontsLoaded || loading) {
    return (
      <View className="flex-1 bg-[#F1F3EA] justify-center items-center">
        <ActivityIndicator size="large" color="#548F53" />
        <Text className="mt-4 text-[#354F52]" style={{ fontFamily: 'Nunito_600SemiBold' }}>
          Loading your smart home...
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      className="flex-1 bg-[#F1F3EA]"
      edges={['top']}
      accessibilityLanguage="en-US"
    >
      <StatusBar barStyle="dark-content" backgroundColor="#F2F5F0" />

      {/* Header (Original unmodified format & title) */}
      <View className="items-center mt-2 mb-6">
        <Text
          maxFontSizeMultiplier={1.2}
          className="text-3xl font-semibold text-[#354F52]"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
          accessibilityRole="header"
        >
          Rooms
        </Text>
      </View>

      {loadError ? (
        <View className="mx-5 mb-4 rounded-[24px] border border-[#E7D7B7] bg-[#FFF8EA] px-4 py-3">
          <Text className="text-[#6D5A2E] text-sm" style={{ fontFamily: 'Nunito_600SemiBold' }}>
            {loadError}
          </Text>
        </View>
      ) : null}

      {feedbackMessage ? (
        <View
          className={`mx-5 mb-4 rounded-[24px] px-4 py-3 ${
            feedbackTone === 'error'
              ? 'border border-[#E7C2BF] bg-[#FDEEEE]'
              : feedbackTone === 'success'
                ? 'border border-[#CFE2C8] bg-[#EEF8EB]'
                : 'border border-[#D8DFD5] bg-white/80'
          }`}
        >
          <Text
            className={`text-sm ${
              feedbackTone === 'error'
                ? 'text-[#8A3D35]'
                : feedbackTone === 'success'
                  ? 'text-[#426A3F]'
                  : 'text-[#4E6059]'
            }`}
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          >
            {feedbackMessage}
          </Text>
        </View>
      ) : null}

      {/* Search Bar (Original style: bg-transparent) */}
      <View className="px-5 mb-6">
        <View className="flex-row items-center justify-center border border-[#BDC7C2] rounded-full px-4 h-12 bg-transparent">
          <MaterialIcons
            name="search"
            size={24}
            color="#7A8C85"
            style={{ marginRight: 10 }}
            accessible={false}
          />
          <TextInput
            maxFontSizeMultiplier={1.2}
            placeholder="Search devices..."
            accessibilityLabel="Search devices"
            accessibilityRole="search"
            accessibilityHint="Type to filter devices by name."
            placeholderTextColor="#7A8C85"
            value={searchQuery}
            onChangeText={(value) => setSearchQuery(normalizeSearchInput(value))}
            className="flex-1 h-full text-base text-[#2C3A35]"
            style={{
              fontFamily: 'Nunito_600SemiBold',
              paddingVertical: 0,
            }}
            textAlignVertical="center"
            autoCorrect={false}
            autoCapitalize="none"
            maxLength={MAX_SEARCH_LENGTH}
          />
          <SearchAutocomplete
            suggestions={searchSuggestions}
            query={searchQuery}
            onSelect={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              accessibilityHint="Clears the current search text."
              hitSlop={10}
            >
              <MaterialIcons
                name="close"
                size={20}
                color="#7A8C85"
                accessible={false}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categories (Original style: h-10 mb-9) */}
      <View className="h-10 mb-9 justify-center">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          <CategoryPill
            key="all-rooms"
            item={{ id: 0, name: 'All' }}
            isActive={activeRoomId === null}
            onPress={() => {
              setActiveRoomId(null);
            }}
          />
          {rooms.map((room) => (
            <CategoryPill
              key={room.id}
              item={{ id: room.id, name: room.name }}
              isActive={activeRoomId === room.id}
              onPress={() => {
                setActiveRoomId(room.id);
              }}
            />
          ))}
        </ScrollView>
      </View>

      {/* Main FlatList rendering Devices in 2 columns (Original structural grid) */}
      <FlatList
        data={filteredDevices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <DeviceCard
            item={item}
            onToggle={() => toggleDevice(item.id)}
            onUpdateLevel={(newLevel) => updateDeviceLevel(item.id, newLevel)}
            onPress={() => openDeviceDetails(item)}
            onAdjustingChange={setIsAdjustingLight}
          />
        )}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isAdjustingLight}
        
        // Render devices section title in ListHeaderComponent
        ListHeaderComponent={
          activeRoom || activeRoomId === null ? (
            <View className="mb-4 flex-row items-center">
              <Text
                maxFontSizeMultiplier={1.2}
                className="text-2xl text-[#354F52]"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
                accessibilityRole="header"
              >
                Smart Home Devices ({filteredDevices.length})
              </Text>
              <Ionicons
                name="chevron-forward"
                size={20}
                color="#548F53"
                importantForAccessibility="no"
              />
            </View>
          ) : null
        }

        ListEmptyComponent={
          <FeedbackState
            icon={searchQuery ? 'search' : 'home'}
            title={searchQuery ? `No devices for "${searchQuery}"` : 'No smart devices yet'}
            message={
              searchQuery
                ? 'Try a different device name or clear the search to see everything in this room.'
                : rooms.length === 0
                  ? 'Create or sync a room first, then add devices to make this space feel alive.'
                  : 'Add a device manually or run discovery to start controlling this room from Nidush.'
            }
            compact
          />
        }
        ListFooterComponent={
          activeRoom ? (
            <View className="mt-4 mb-6">
              <View className="rounded-3xl border border-[#D8DFD5] bg-white/70 p-5">
                <View className="flex-row items-center justify-between mb-2">
                  <Text
                    className="text-lg text-[#354F52] font-bold"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    {activeRoom.name} Summary
                  </Text>
                  <MaterialCommunityIcons
                    name="sofa-single"
                    size={22}
                    color="#548F53"
                    accessible={false}
                  />
                </View>
                <Text
                  className="text-[#6C7A74] text-sm mb-3"
                  style={{ fontFamily: 'Nunito_400Regular' }}
                >
                  {filteredDevices.length} device{filteredDevices.length === 1 ? '' : 's'} in this room.
                </Text>
                {roomPendingDeletion === activeRoom.id ? (
                  <View className="mt-3 rounded-[22px] border border-[#F2C9C4] bg-[#FFF2EF] p-4">
                    <Text
                      className="text-[#8E473F] text-sm mb-3"
                      style={{ fontFamily: 'Nunito_600SemiBold' }}
                    >
                      Delete "{activeRoom.name}"? Devices in this room will become unassigned.
                    </Text>
                    <View className="flex-row gap-3">
                      <TouchableOpacity
                        onPress={() => setRoomPendingDeletion(null)}
                        disabled={isDeletingRoom}
                        className="px-4 py-3 rounded-full bg-white border border-[#E7D7D3]"
                        accessibilityRole="button"
                        accessibilityLabel={`Cancel deleting room ${activeRoom.name}`}
                      >
                        <Text
                          className="text-[#6C7A74] text-sm"
                          style={{ fontFamily: 'Nunito_700Bold' }}
                        >
                          Cancel
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => {
                          void handleDeleteRoom(activeRoom);
                        }}
                        disabled={isDeletingRoom}
                        className="px-4 py-3 rounded-full bg-[#B5564D]"
                        accessibilityRole="button"
                        accessibilityLabel={`Confirm deleting room ${activeRoom.name}`}
                      >
                        {isDeletingRoom ? (
                          <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                          <Text
                            className="text-white text-sm"
                            style={{ fontFamily: 'Nunito_700Bold' }}
                          >
                            Confirm delete
                          </Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity
                    onPress={() => setRoomPendingDeletion(activeRoom.id)}
                    disabled={isDeletingRoom}
                    className="self-start mt-2 px-4 py-3 rounded-full bg-[#FBE8E6]"
                    accessibilityRole="button"
                    accessibilityLabel={`Delete room ${activeRoom.name}`}
                  >
                    {isDeletingRoom ? (
                      <ActivityIndicator size="small" color="#B5564D" />
                  ) : (
                      <Text
                        className="text-[#B5564D] text-sm"
                        style={{ fontFamily: 'Nunito_700Bold' }}
                      >
                        Delete room
                      </Text>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : null
        }
      />

      {/* Floating menu FAB with add device action */}
      <AddRoomDevice actions={menuActions} />

      {createPanelMode ? (
        <View className="absolute inset-0 z-20 bg-black/35">
          <Pressable className="absolute inset-0" onPress={closeCreatePanel} />
          <Animated.View
            className="absolute inset-0 bg-[#F6F8F2] shadow-2xl"
            style={{ transform: [{ translateX: createPanelTranslateX }] }}
          >
            <KeyboardAvoidingView
              className="flex-1"
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
            >
              <View className="flex-1">
                <View className="px-5 pt-14 pb-5 bg-[#EDF2E9] border-b border-[#DCE4D7]">
                  <TouchableOpacity onPress={closeCreatePanel} className="mb-5 self-start" hitSlop={8}>
                    <Ionicons name="chevron-back" size={28} color="#354F52" />
                  </TouchableOpacity>
                  <Text className="text-[#354F52] text-[30px]" style={{ fontFamily: 'Nunito_700Bold' }}>
                    {createPanelMode === 'room' ? 'Add Room' : 'Add Device'}
                  </Text>
                  <Text className="text-[#6B7C76] text-sm mt-2" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                    {createPanelMode === 'room'
                      ? 'Create a new space in your home before linking activities and devices.'
                      : 'Add a device and place it directly inside one of your home rooms.'}
                  </Text>
                </View>

                <ScrollView
                  className="flex-1"
                  contentContainerStyle={{ padding: 24, paddingBottom: 36 }}
                  keyboardShouldPersistTaps="handled"
                  showsVerticalScrollIndicator={false}
                >
                  {createPanelMode === 'room' ? (
                    <>
                      <Text className="text-[#354F52] text-sm mb-2" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                        Room Name
                      </Text>
                      <TextInput
                        placeholder="e.g. Office"
                        placeholderTextColor="#6B7C76"
                        value={newRoomName}
                        onChangeText={setNewRoomName}
                        className="bg-white border border-[#D4DDD2] rounded-2xl px-4 py-4 text-base text-[#2C3A35] mb-6"
                        style={{ fontFamily: 'Nunito_600SemiBold', color: '#1F2A24' }}
                        selectionColor="#548F53"
                      />

                      <View className="rounded-[28px] bg-white border border-[#E0E7DD] p-5">
                        <Text className="text-[#354F52] text-lg mb-2" style={{ fontFamily: 'Nunito_700Bold' }}>
                          What happens next
                        </Text>
                        <Text className="text-[#6B7C76] text-sm" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                          After saving the room, you can add devices to it and then use it in new activities and scenarios.
                        </Text>
                      </View>
                    </>
                  ) : (
                    <>
                      <Text className="text-[#354F52] text-sm mb-2" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                        Device Name
                      </Text>
                      <TextInput
                        placeholder="e.g. Atmosphere Diffuser"
                        placeholderTextColor="#6B7C76"
                        value={newDeviceName}
                        onChangeText={setNewDeviceName}
                        className="bg-white border border-[#D4DDD2] rounded-2xl px-4 py-4 text-base text-[#2C3A35] mb-5"
                        style={{ fontFamily: 'Nunito_600SemiBold', color: '#1F2A24' }}
                        selectionColor="#548F53"
                      />

                      <Text className="text-[#354F52] text-sm mb-3" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                        Device Category Type
                      </Text>
                      <View className="flex-row justify-between mb-8 gap-x-2">
                        {(['light', 'speaker', 'difuser', 'purifier'] as const).map(type => {
                          const isSelected = newDeviceType === type;
                          const label = type.charAt(0).toUpperCase() + type.slice(1);

                          return (
                            <TouchableOpacity
                              key={type}
                              onPress={() => setNewDeviceType(type)}
                              className={`w-[23%] py-3 rounded-2xl border items-center justify-center ${
                                isSelected ? 'bg-[#BBE6BA] border-transparent' : 'bg-white border-[#D4DDD2]'
                              }`}
                            >
                              {type === 'difuser' ? (
                                <MaterialCommunityIcons name="air-purifier" size={22} color={isSelected ? '#354F52' : '#7A8C85'} />
                              ) : type === 'light' ? (
                                <MaterialIcons name="lightbulb" size={22} color={isSelected ? '#354F52' : '#7A8C85'} />
                              ) : type === 'speaker' ? (
                                <MaterialIcons name="speaker" size={22} color={isSelected ? '#354F52' : '#7A8C85'} />
                              ) : (
                                <MaterialIcons name="air" size={22} color={isSelected ? '#354F52' : '#7A8C85'} />
                              )}
                              <Text className="text-[10px] mt-1 text-[#354F52] font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                                {label}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>

                      <Text className="text-[#354F52] text-sm mb-3" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                        Save in Room
                      </Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ paddingBottom: 20 }}
                        keyboardShouldPersistTaps="handled"
                      >
                        {rooms.map((room) => {
                          const isSelected = newDeviceRoomId === room.id;

                          return (
                            <TouchableOpacity
                              key={room.id}
                              onPress={() => setNewDeviceRoomId(room.id)}
                              className={`mr-3 px-4 py-3 rounded-2xl border ${
                                isSelected ? 'bg-[#BBE6BA] border-transparent' : 'bg-white border-[#D4DDD2]'
                              }`}
                            >
                              <Text
                                className="text-[#354F52] font-bold"
                                style={{ fontFamily: 'Nunito_700Bold' }}
                              >
                                {room.name}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </>
                  )}
                </ScrollView>

                <View className="px-6 pt-4 pb-8 border-t border-[#DCE4D7] bg-[#F6F8F2] flex-row justify-between">
                  <TouchableOpacity
                    onPress={closeCreatePanel}
                    className="w-[48%] py-4 bg-[#E9EFE7] rounded-full items-center"
                  >
                    <Text className="text-[#354F52] text-base font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={createPanelMode === 'room' ? handleAddRoom : handleAddDevice}
                    disabled={createPanelMode === 'device' ? isAdding : false}
                    className="w-[48%] py-4 bg-[#548F53] rounded-full items-center flex-row justify-center"
                  >
                    {createPanelMode === 'device' && isAdding ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white text-base font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                        {createPanelMode === 'room' ? 'Save Room' : 'Save Device'}
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      ) : null}

      <Modal
        visible={selectedDevice !== null}
        transparent={true}
        animationType="slide"
        onRequestClose={closeDeviceDetails}
      >
        <KeyboardAvoidingView
          className="flex-1 bg-black/40 px-5 pt-14 pb-6"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        >
          <View className="bg-white rounded-[34px] px-6 pt-5 pb-5 max-h-[72%] shadow-xl">
            <View className="items-center mb-4">
              <View className="w-12 h-1.5 rounded-full bg-[#D7DED6]" />
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
              keyboardDismissMode="interactive"
            >
              <View className="flex-row justify-between items-center mb-2">
                <Text className="text-[26px] font-bold text-[#354F52]" style={{ fontFamily: 'Nunito_700Bold' }}>
                  Device Details
                </Text>
                <TouchableOpacity onPress={closeDeviceDetails} hitSlop={15}>
                  <Ionicons name="close" size={24} color="#7A8C85" />
                </TouchableOpacity>
              </View>

              <Text
                className="text-[#6B7C76] text-sm mb-4"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                Rename the device and move it to the right room.
              </Text>

              <View className="bg-[#F5F7F0] rounded-3xl p-4 mb-4 border border-[#E2E8E0] flex-row items-center">
                <View className="w-12 h-12 rounded-full bg-[#DDE8D8] items-center justify-center mr-3">
                  <MaterialIcons
                    name={
                      selectedDevice?.type === 'light'
                        ? 'lightbulb'
                        : selectedDevice?.type === 'speaker'
                          ? 'speaker'
                          : selectedDevice?.type === 'tv'
                            ? 'tv'
                            : 'devices'
                    }
                    size={24}
                    color="#548F53"
                    accessible={false}
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-[#354F52] text-lg font-bold mb-1" style={{ fontFamily: 'Nunito_700Bold' }}>
                    {selectedDevice?.name}
                  </Text>
                  <Text className="text-[#6B7C76] text-sm" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                    Type: {selectedDevice?.type ?? 'unknown'} · Status: {selectedDevice?.status ?? 'Off'}
                  </Text>
                </View>
              </View>

              <Text className="text-[#354F52] text-sm mb-2" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                Device Name
              </Text>
              <TextInput
                placeholder="e.g. Atmosphere Diffuser"
                placeholderTextColor="#6B7C76"
                value={deviceDraftName}
                onChangeText={setDeviceDraftName}
                className="bg-[#F1F3EA] border border-[#BDC7C2] rounded-2xl px-4 py-4 text-base text-[#2C3A35] mb-5"
                style={{ fontFamily: 'Nunito_700Bold', color: '#1F2A24' }}
                selectionColor="#548F53"
                returnKeyType="done"
              />

              <Text className="text-[#354F52] text-sm mb-3" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                Room
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                keyboardShouldPersistTaps="handled"
              >
                {rooms.map((room) => {
                  const isSelected = deviceDraftRoomId === room.id;

                  return (
                    <TouchableOpacity
                      key={room.id}
                      onPress={() => setDeviceDraftRoomId(room.id)}
                      className={`mr-3 px-4 py-3 rounded-2xl border ${
                        isSelected ? 'bg-[#BBE6BA] border-transparent' : 'bg-transparent border-[#BDC7C2]'
                      }`}
                    >
                      <Text
                        className="text-[#354F52] font-bold"
                        style={{ fontFamily: 'Nunito_700Bold' }}
                      >
                        {room.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {selectedDevice?.type === 'light' ? (
                <View className="mb-2">
                  <View className="flex-row items-center justify-between mb-3">
                    <Text className="text-[#354F52] text-sm" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                      Light Color
                    </Text>
                    {isUpdatingLightColor ? (
                      <ActivityIndicator size="small" color="#548F53" />
                    ) : (
                      <Text className="text-[#6B7C76] text-xs" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                        Applies instantly
                      </Text>
                    )}
                  </View>

                  <View className="flex-row flex-wrap gap-y-3">
                    {LIGHT_COLOR_OPTIONS.map((color) => {
                      const selected = selectedLightColor === color;

                      return (
                        <TouchableOpacity
                          key={color}
                          onPress={() => {
                            void handleSetDeviceColor(color);
                          }}
                          disabled={isUpdatingLightColor}
                          className="mr-3"
                          style={{
                            width: 44,
                            height: 44,
                            borderRadius: 22,
                            backgroundColor: color,
                            borderWidth: selected ? 3 : 1,
                            borderColor: selected ? '#354F52' : '#D7DED6',
                            opacity: isUpdatingLightColor ? 0.7 : 1,
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Set light color ${color}`}
                        />
                      );
                    })}
                  </View>

                  <Text className="text-[#6B7C76] text-xs mt-3" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                    Works for Google Home lights that support RGB color control. White-only bulbs may reject this command.
                  </Text>
                </View>
              ) : null}
            </ScrollView>

            <View className="flex-row justify-between mt-2 pt-2">
              <TouchableOpacity
                onPress={handleDeleteFromDetails}
                className="w-[30%] py-4 bg-[#FBE8E6] rounded-full items-center"
              >
                <Text className="text-[#B5564D] text-base font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                  Remove
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={closeDeviceDetails}
                className="w-[30%] py-4 bg-[#F1F3EA] rounded-full items-center"
              >
                <Text className="text-[#354F52] text-base font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveDeviceDetails}
                disabled={isSavingDeviceDetails}
                className="w-[35%] py-4 bg-[#548F53] rounded-full items-center flex-row justify-center"
              >
                {isSavingDeviceDetails ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white text-base font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                    Save
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* --- MANAGE LINKED DEVICES DIALOG MODAL --- */}
      <Modal
        visible={isManageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsManageModalVisible(false)}
      >
        <View className="flex-1 justify-center bg-black/50 px-5">
          <View className="bg-white rounded-[32px] p-6 max-h-[70%]">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-[#354F52] flex-1 mr-4" style={{ fontFamily: 'Nunito_700Bold' }} numberOfLines={1}>
                Devices for: {selectedActivity?.title}
              </Text>
              <TouchableOpacity onPress={() => setIsManageModalVisible(false)} hitSlop={15}>
                <Ionicons name="close" size={24} color="#7A8C85" />
              </TouchableOpacity>
            </View>

            <Text className="text-xs text-gray-500 mb-4" style={{ fontFamily: 'Nunito_400Regular' }}>
              Select the devices in this room that should turn on or activate when this activity is started.
            </Text>

            <ScrollView className="mb-6 gap-y-3" showsVerticalScrollIndicator={false}>
              {roomDevices.length > 0 ? (
                roomDevices.map(d => {
                  const isChecked = tempLinkedDeviceIds.includes(d.id);
                  return (
                    <TouchableOpacity
                      key={d.id}
                      onPress={() => toggleLinkDevice(d.id)}
                      className={`flex-row items-center justify-between p-4 rounded-2xl border ${
                        isChecked 
                          ? 'bg-[#BBE6BA]/40 border-[#548F53]' 
                          : 'bg-white border-[#E9ECE6]'
                      }`}
                    >
                      <View className="flex-row items-center">
                        <View className="bg-[#548F53]/20 p-2 rounded-full mr-3">
                          <MaterialIcons 
                            name={d.type === 'light' ? 'lightbulb' : d.type === 'speaker' ? 'speaker' : 'devices'} 
                            size={20} 
                            color="#548F53" 
                          />
                        </View>
                        <Text className="text-[#354F52] font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                          {d.name}
                        </Text>
                      </View>
                      
                      <Switch
                        value={isChecked}
                        onValueChange={() => toggleLinkDevice(d.id)}
                        trackColor={{ false: '#D8DFD5', true: '#BBE6BA' }}
                        thumbColor={isChecked ? '#548F53' : '#F4F3F0'}
                      />
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text className="text-center text-gray-400 italic py-6">
                  Add smart devices to this room first to link them!
                </Text>
              )}
            </ScrollView>

            <View className="flex-row justify-between">
              <TouchableOpacity
                onPress={() => setIsManageModalVisible(false)}
                className="w-[48%] py-3 bg-[#F1F3EA] rounded-full items-center"
              >
                <Text className="text-[#354F52] font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSaveLinks}
                disabled={isSavingLinks}
                className="w-[48%] py-3 bg-[#548F53] rounded-full items-center flex-row justify-center"
              >
                {isSavingLinks ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                    Save Links
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}
