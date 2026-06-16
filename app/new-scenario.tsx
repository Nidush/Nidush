import { ScenarioReviewCard } from '@/components/newActivityFlow/ScenarioReviewCard';
import { FlowHeader } from '@/components/newActivityFlow/FlowHeader';
import { ReviewCard } from '@/components/newActivityFlow/ReviewCard';
import { SelectionCard } from '@/components/newActivityFlow/SelectionCard';
import { Step5_Details } from '@/components/newActivityFlow/steps/Step5_Details';
import { StepWrapper } from '@/components/newActivityFlow/StepWrapper';
import SpotifyPlaylistSelector from '@/components/UI/SpotifyPlaylistSelector';
import { resolveCatalogImage } from '@/constants/data/catalogAssets';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { useNotifications } from '@/context/NotificationsContext';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Feather, Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Animated,
  Dimensions,
  ImageSourcePropType,
  Keyboard,
  KeyboardAvoidingView,
  LayoutChangeEvent,
  PanResponder,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { captureException, trackEvent } from '@/utils/observability';
import { normalizeScenarioDeviceType } from '@/utils/activityDeviceConfigs';
import { getRoomIconName } from '@/utils/roomIcons';
import { supabase, uploadImage } from '@/utils/supabase';

type RoomRow = {
  id: number;
  name: string;
};

type RoomDeviceRow = {
  id: number;
  name: string;
  type: string;
};

type DeviceControlDraft = {
  state: 'on' | 'off';
  value?: string | number;
  brightness?: string;
  color?: string;
  temperature?: number;
  mode?: string;
  deviceName: string;
  deviceType: string;
};

type PlaylistItem = {
  id: string;
  name: string;
};

type ScenarioDraftPayload = {
  step: number;
  isRoomStepSkipped: boolean;
  selectedRoomId: number | null;
  selectedPlaylistId: string;
  selectedPlaylistName: string;
  scenarioName: string;
  description: string;
  scenarioImageUri: string | null;
  focusMode: boolean;
  selectedDeviceIds: number[];
  deviceDrafts: Record<number, DeviceControlDraft>;
};

const SCENARIO_DEFAULT_IMAGES: Record<string, string> = {
  bedroom: 'Scenarios/lavender_dream.png',
  kitchen: 'Scenarios/slow_cooking.png',
  'living room': 'Scenarios/moonlight_bay.png',
  bathroom: 'Scenarios/rose_garden.png',
};

const TOTAL_STEPS = 4;
const PANEL_WIDTH = Dimensions.get('window').width;
const NEW_SCENARIO_DRAFT_KEY = '@new_scenario_draft';
const SPOTIFY_RETURN_ROUTE_KEY = '@spotify_return_route';

const LIGHT_COLOR_OPTIONS = [
  '#EBCF68',
  '#D4CA80',
  '#AFC6C8',
  '#B0C6C6',
  '#86B3EB',
  '#C69B4C',
  '#79C472',
  '#3A6CC0',
  '#B452D8',
];

const LIGHT_PRESETS = [
  { label: 'Relax', color: '#EBCF68', brightness: '45%', temperature: 18, mode: 'Relax' },
  { label: 'Focus', color: '#F4F1DE', brightness: '85%', temperature: 78, mode: 'Focus' },
  { label: 'Night', color: '#86B3EB', brightness: '22%', temperature: 92, mode: 'Night' },
];

const LIGHT_TEMPERATURE_PRESETS = [
  { label: 'Warm', temperature: 18, mode: 'Warm glow' },
  { label: 'Balanced', temperature: 50, mode: 'Balanced glow' },
  { label: 'Cool', temperature: 84, mode: 'Cool glow' },
];

const getDefaultScenarioImage = (roomName: string | null) => {
  if (!roomName) return resolveCatalogImage('Scenarios/forest_bathing.png');
  const key = SCENARIO_DEFAULT_IMAGES[roomName.toLowerCase()] ?? 'Scenarios/forest_bathing.png';
  return resolveCatalogImage(key);
};

const getDefaultScenarioImageKey = (roomName: string | null) =>
  roomName ? SCENARIO_DEFAULT_IMAGES[roomName.toLowerCase()] ?? 'Scenarios/forest_bathing.png' : 'Scenarios/forest_bathing.png';

const getImageUri = (value: unknown) =>
  value && typeof value === 'object' && 'uri' in value
    ? String((value as { uri?: unknown }).uri ?? '')
    : typeof value === 'string'
      ? value
      : '';

const getDeviceIcon = (type: string) => {
  switch (normalizeScenarioDeviceType(type)) {
    case 'light':
      return <MaterialIcons name="lightbulb-outline" size={20} color="#548F53" />;
    case 'thermostat':
      return <MaterialCommunityIcons name="thermometer" size={20} color="#548F53" />;
    case 'speaker':
      return <MaterialIcons name="speaker" size={20} color="#548F53" />;
    case 'tv':
      return <MaterialIcons name="tv" size={20} color="#548F53" />;
    case 'blind':
      return <MaterialCommunityIcons name="blinds" size={20} color="#548F53" />;
    case 'diffuser':
      return <MaterialCommunityIcons name="air-humidifier" size={20} color="#548F53" />;
    case 'purifier':
      return <MaterialCommunityIcons name="air-filter" size={20} color="#548F53" />;
    default:
      return <Feather name="cpu" size={20} color="#548F53" />;
  }
};

const getMissingColumnName = (error: unknown) => {
  if (!error || typeof error !== 'object') return null;

  const message = 'message' in error && typeof error.message === 'string' ? error.message : '';
  const match = message.match(/Could not find the '([^']+)' column/i);
  return match?.[1] ?? null;
};

const omitKeys = <T extends Record<string, unknown>>(payload: T, keys: string[]) => {
  const nextPayload = { ...payload };

  for (const key of keys) {
    delete nextPayload[key as keyof T];
  }

  return nextPayload;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const getDefaultDeviceDraft = (device: RoomDeviceRow): DeviceControlDraft => {
  const normalizedType = normalizeScenarioDeviceType(device.type);

  if (normalizedType === 'thermostat') {
    return {
      state: 'on',
      value: 22,
      mode: 'Comfort',
      deviceName: device.name,
      deviceType: device.type,
    };
  }

  if (normalizedType === 'light') {
    return {
      state: 'on',
      value: '#EBCF68',
      brightness: '70%',
      color: '#EBCF68',
      temperature: 20,
      mode: 'Warm glow',
      deviceName: device.name,
      deviceType: device.type,
    };
  }

  if (normalizedType === 'speaker' || normalizedType === 'tv') {
    return {
      state: 'on',
      value: '45%',
      mode: 'Balanced',
      deviceName: device.name,
      deviceType: device.type,
    };
  }

  if (normalizedType === 'blind') {
    return {
      state: 'on',
      value: '60%',
      mode: 'Half open',
      deviceName: device.name,
      deviceType: device.type,
    };
  }

  if (normalizedType === 'diffuser') {
    return {
      state: 'on',
      value: '55%',
      mode: 'Calm mist',
      deviceName: device.name,
      deviceType: device.type,
    };
  }

  if (normalizedType === 'purifier') {
    return {
      state: 'on',
      value: '65%',
      mode: 'Clean air',
      deviceName: device.name,
      deviceType: device.type,
    };
  }

  return {
    state: 'on',
    value: '70%',
    mode: 'Standard',
    deviceName: device.name,
    deviceType: device.type,
  };
};

const getDeviceControlConfig = (type: string) => {
  const normalizedType = normalizeScenarioDeviceType(type);

  switch (normalizedType) {
    case 'light':
      return { label: 'Brightness', min: 0, max: 100, step: 1, unit: '%' };
    case 'speaker':
      return { label: 'Volume', min: 0, max: 100, step: 1, unit: '%' };
    case 'tv':
      return { label: 'Volume', min: 0, max: 100, step: 1, unit: '%' };
    case 'purifier':
      return { label: 'Power', min: 0, max: 100, step: 1, unit: '%' };
    case 'diffuser':
      return { label: 'Intensity', min: 0, max: 100, step: 1, unit: '%' };
    case 'blind':
      return { label: 'Open level', min: 0, max: 100, step: 1, unit: '%' };
    case 'thermostat':
      return { label: 'Temperature', min: 16, max: 30, step: 1, unit: 'ºC' };
    default:
      return { label: 'Level', min: 0, max: 100, step: 1, unit: '%' };
  }
};

const parseDraftNumericValue = (draft: DeviceControlDraft, fallback: number) => {
  if (typeof draft.value === 'number') return draft.value;
  if (typeof draft.value === 'string') {
    const parsed = Number.parseInt(draft.value.replace(/[^0-9-]/g, ''), 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  if (typeof draft.brightness === 'string') {
    const parsed = Number.parseInt(draft.brightness.replace(/[^0-9-]/g, ''), 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return fallback;
};

const getControlFillPercentage = (value: number, min: number, max: number) => {
  if (max <= min) return 0;
  return clamp(((value - min) / (max - min)) * 100, 0, 100);
};

const formatControlValue = (value: number, unit: string) =>
  unit === '%' ? `${value}%` : value;

const serializeScenarioImage = (value: string | ImageSourcePropType | null) => {
  if (!value) return null;
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && 'uri' in value) {
    return String((value as { uri?: unknown }).uri ?? '') || null;
  }
  return null;
};

const getTemperatureTone = (temperature: number | undefined) => {
  if (typeof temperature !== 'number') return 'Balanced';
  if (temperature <= 35) return 'Warm';
  if (temperature <= 65) return 'Balanced';
  return 'Cool';
};

const getScenarioDeviceSummary = (device: RoomDeviceRow, draft: DeviceControlDraft) => {
  const normalizedType = normalizeScenarioDeviceType(device.type);

  if (normalizedType === 'light') {
    return [draft.mode || getTemperatureTone(draft.temperature), draft.brightness || '0%'].filter(Boolean).join(' • ');
  }

  if (normalizedType === 'thermostat') {
    return [`${parseDraftNumericValue(draft, 22)}ºC`, draft.mode].filter(Boolean).join(' • ');
  }

  return [typeof draft.value === 'number' ? `${draft.value}` : draft.value, draft.mode].filter(Boolean).join(' • ');
};

const getSliderColors = (type: string, accentColor?: string) => {
  switch (normalizeScenarioDeviceType(type)) {
    case 'light':
      return ['#FFD55A', '#F4E7A1', accentColor || '#A9C8F2'];
    case 'thermostat':
      return ['#9ED1FF', '#E6F0FF', '#FFD4A8'];
    case 'speaker':
    case 'tv':
      return ['#A9D18E', '#D1E8CC', '#7FB069'];
    case 'blind':
      return ['#E7D9B5', '#F2E8D0', '#CBB37B'];
    default:
      return ['#BFD9B9', '#DDEBD6', '#8CBF88'];
  }
};

const getDevicePresetOptions = (device: RoomDeviceRow) => {
  switch (normalizeScenarioDeviceType(device.type)) {
    case 'light':
      return LIGHT_PRESETS;
    case 'thermostat':
      return [
        { label: 'Sleep', value: 19, mode: 'Sleep' },
        { label: 'Comfort', value: 22, mode: 'Comfort' },
        { label: 'Boost', value: 25, mode: 'Boost' },
      ];
    case 'speaker':
    case 'tv':
      return [
        { label: 'Quiet', value: '25%', mode: 'Quiet' },
        { label: 'Balanced', value: '45%', mode: 'Balanced' },
        { label: 'Immersive', value: '70%', mode: 'Immersive' },
      ];
    case 'blind':
      return [
        { label: 'Private', value: '10%', mode: 'Private' },
        { label: 'Half', value: '50%', mode: 'Half open' },
        { label: 'Open', value: '100%', mode: 'Fully open' },
      ];
    case 'diffuser':
      return [
        { label: 'Soft', value: '30%', mode: 'Soft mist' },
        { label: 'Calm', value: '55%', mode: 'Calm mist' },
        { label: 'Deep', value: '80%', mode: 'Deep mist' },
      ];
    case 'purifier':
      return [
        { label: 'Eco', value: '35%', mode: 'Eco clean' },
        { label: 'Daily', value: '65%', mode: 'Daily clean' },
        { label: 'Boost', value: '90%', mode: 'Boost clean' },
      ];
    default:
      return [
        { label: 'Low', value: '25%', mode: 'Low' },
        { label: 'Medium', value: '55%', mode: 'Medium' },
        { label: 'High', value: '85%', mode: 'High' },
      ];
  }
};

function NewScenarioContent() {
  const [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Nunito_600SemiBold,
    Nunito_400Regular,
  });

  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const previousDefaultImageRef = useRef<string | ImageSourcePropType | null>(null);
  const sliderDragStartRef = useRef<Record<string, number>>({});
  const restoredDraftRef = useRef<ScenarioDraftPayload | null>(null);
  const hasHydratedDraftRef = useRef(false);
  const hasAppliedRestoredDevicesRef = useRef(false);

  const { addNotification } = useNotifications();
  const { roomName: roomNameParam } = useLocalSearchParams<{ roomName?: string }>();

  const [step, setStep] = useState(1);
  const [isRoomStepSkipped, setIsRoomStepSkipped] = useState(false);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [selectedPlaylistName, setSelectedPlaylistName] = useState('');
  const [scenarioName, setScenarioName] = useState('');
  const [description, setDescription] = useState('');
  const [scenarioImage, setScenarioImage] = useState<string | ImageSourcePropType | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [roomDevices, setRoomDevices] = useState<RoomDeviceRow[]>([]);
  const [selectedDeviceIds, setSelectedDeviceIds] = useState<Set<number>>(new Set());
  const [deviceDrafts, setDeviceDrafts] = useState<Record<number, DeviceControlDraft>>({});
  const [sliderWidths, setSliderWidths] = useState<Record<string, number>>({});
  const [activeConfigDeviceId, setActiveConfigDeviceId] = useState<number | null>(null);
  const [isAdjustingLightHero, setIsAdjustingLightHero] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [homeId, setHomeId] = useState<number | null>(null);
  const [isDraftHydrated, setIsDraftHydrated] = useState(false);
  const [isRoomsHydrated, setIsRoomsHydrated] = useState(false);
  const [isDevicesHydrated, setIsDevicesHydrated] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const panelTranslateX = useRef(new Animated.Value(PANEL_WIDTH)).current;

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId],
  );

  const displayedTotalSteps = isRoomStepSkipped ? TOTAL_STEPS - 1 : TOTAL_STEPS;
  const displayedStep = isRoomStepSkipped ? Math.max(step - 1, 1) : step;

  const defaultScenarioImage = useMemo(
    () => getDefaultScenarioImage(selectedRoom?.name ?? null),
    [selectedRoom?.name],
  );

  const selectedDevices = useMemo(
    () => roomDevices.filter((device) => selectedDeviceIds.has(device.id)),
    [roomDevices, selectedDeviceIds],
  );

  const activeConfigDevice = useMemo(
    () => roomDevices.find((device) => device.id === activeConfigDeviceId) ?? null,
    [activeConfigDeviceId, roomDevices],
  );

  const shouldBlockForDevices = (isRoomStepSkipped || step > 1) && !isDevicesHydrated;
  const isInitializing = !isDraftHydrated || !isRoomsHydrated || shouldBlockForDevices;

  const buildDraftPayload = (): ScenarioDraftPayload => ({
    step,
    isRoomStepSkipped,
    selectedRoomId,
    selectedPlaylistId,
    selectedPlaylistName,
    scenarioName,
    description,
    scenarioImageUri: serializeScenarioImage(scenarioImage),
    focusMode,
    selectedDeviceIds: Array.from(selectedDeviceIds),
    deviceDrafts,
  });

  const saveScenarioDraft = useCallback(async () => {
    await AsyncStorage.setItem(
      NEW_SCENARIO_DRAFT_KEY,
      JSON.stringify(buildDraftPayload()),
    );
  }, [
    description,
    deviceDrafts,
    focusMode,
    isRoomStepSkipped,
    scenarioImage,
    scenarioName,
    selectedDeviceIds,
    selectedPlaylistId,
    selectedPlaylistName,
    selectedRoomId,
    step,
  ]);

  const saveScenarioDraftForSpotify = useCallback(async () => {
    await saveScenarioDraft();
    await AsyncStorage.setItem(SPOTIFY_RETURN_ROUTE_KEY, '/new-scenario');
  }, [saveScenarioDraft]);

  const discardScenarioDraft = useCallback(async () => {
    await AsyncStorage.removeItem(NEW_SCENARIO_DRAFT_KEY);
    await AsyncStorage.removeItem(SPOTIFY_RETURN_ROUTE_KEY);
  }, []);

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const raw = await AsyncStorage.getItem(NEW_SCENARIO_DRAFT_KEY);
        if (!raw) return;

        const draft = JSON.parse(raw) as ScenarioDraftPayload;
        restoredDraftRef.current = draft;
        hasAppliedRestoredDevicesRef.current = false;

        setStep(typeof draft.step === 'number' ? draft.step : 1);
        setIsRoomStepSkipped(draft.isRoomStepSkipped === true);
        setSelectedRoomId(typeof draft.selectedRoomId === 'number' ? draft.selectedRoomId : null);
        setSelectedPlaylistId(draft.selectedPlaylistId ?? '');
        setSelectedPlaylistName(draft.selectedPlaylistName ?? '');
        setScenarioName(draft.scenarioName ?? '');
        setDescription(draft.description ?? '');
        setFocusMode(draft.focusMode === true);

        if (draft.scenarioImageUri) {
          setScenarioImage(draft.scenarioImageUri);
        }
      } catch (error) {
        console.error('Failed to restore scenario draft:', error);
      } finally {
        hasHydratedDraftRef.current = true;
        setIsDraftHydrated(true);
      }
    };

    loadDraft();
  }, []);

  useEffect(() => {
    if (!isDraftHydrated) return;

    const previousDefault = previousDefaultImageRef.current;
    const shouldAdoptNewDefault =
      !scenarioImage || scenarioImage === previousDefault;

    if (shouldAdoptNewDefault) {
      setScenarioImage(defaultScenarioImage);
    }

    previousDefaultImageRef.current = defaultScenarioImage;
  }, [defaultScenarioImage, scenarioImage]);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`Step ${displayedStep} of ${displayedTotalSteps}`);
  }, [displayedStep, displayedTotalSteps]);

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        if (step === 3 && scrollViewRef.current) {
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 120);
        }
      },
    );
    const keyboardHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false),
    );

    return () => {
      keyboardShowListener.remove();
      keyboardHideListener.remove();
    };
  }, [step]);

  useEffect(() => {
    const loadRooms = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setHomeId(null);
          setLoadError('You need to be logged in to create a scenario.');
          return;
        }

        const { data: userHome, error: userHomeError } = await supabase
          .from('user_homes')
          .select('home_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (userHomeError) throw userHomeError;

        if (!userHome?.home_id) {
          setHomeId(null);
          setLoadError('Connect this profile to a home before creating scenarios.');
          return;
        }

        setHomeId(userHome.home_id);

        const { data: roomRows, error: roomsError } = await supabase
          .from('rooms')
          .select('id, name')
          .eq('home_id', userHome.home_id)
          .order('id', { ascending: true });

        if (roomsError) throw roomsError;

        const safeRooms = roomRows ?? [];
        if (safeRooms.length === 0) {
          setRooms([]);
          setSelectedRoomId(null);
          setLoadError('Create at least one room before creating a scenario.');
          return;
        }

        const { count: assignedDevicesCount, error: devicesError } = await supabase
          .from('devices')
          .select('id', { count: 'exact', head: true })
          .eq('home_id', userHome.home_id)
          .not('room_id', 'is', null);

        if (devicesError) throw devicesError;
        if (!assignedDevicesCount) {
          setRooms(safeRooms);
          setSelectedRoomId((current) => current ?? safeRooms[0]?.id ?? null);
          setIsRoomStepSkipped(false);
          setLoadError('Assign at least one device to a room before creating a scenario.');
          return;
        }

        const normalizedRoomNameParam = String(roomNameParam ?? '').trim().toLowerCase();
        const preselectedRoom =
          normalizedRoomNameParam.length > 0
            ? safeRooms.find((room) => room.name.trim().toLowerCase() === normalizedRoomNameParam)
            : null;

        setRooms(safeRooms);
        setSelectedRoomId((current) => current ?? preselectedRoom?.id ?? safeRooms[0]?.id ?? null);
        setIsRoomStepSkipped(Boolean(preselectedRoom));
        if (preselectedRoom) {
          setStep((current) => (current === 1 ? 2 : current));
        }
        setLoadError(null);
      } catch (error) {
        console.error('Failed to load rooms for scenario creation:', error);
        setLoadError('We could not load your home rooms right now.');
      } finally {
        setIsRoomsHydrated(true);
      }
    };

    loadRooms();
  }, [roomNameParam]);

  useEffect(() => {
    const loadRoomDevices = async () => {
      if (!selectedRoomId) {
        setRoomDevices([]);
        setSelectedDeviceIds(new Set());
        setDeviceDrafts({});
        setIsDevicesHydrated(true);
        return;
      }

      setIsDevicesHydrated(false);
      try {
        if (!homeId) {
          setIsDevicesHydrated(true);
          return;
        }

        const { data: devices } = await supabase
          .from('devices')
          .select('id, name, type')
          .eq('home_id', homeId)
          .eq('room_id', selectedRoomId);

        if (devices) {
          setRoomDevices(devices);
          const restoredDraft = restoredDraftRef.current;
          const shouldApplyRestoredDraft =
            restoredDraft &&
            restoredDraft.selectedRoomId === selectedRoomId &&
            !hasAppliedRestoredDevicesRef.current;

          if (shouldApplyRestoredDraft) {
            const availableDeviceIds = new Set(devices.map((device) => device.id));
            const restoredSelectedIds = restoredDraft.selectedDeviceIds.filter((id) => availableDeviceIds.has(id));
            const restoredDeviceDrafts = Object.fromEntries(
              devices.map((device) => [
                device.id,
                restoredDraft.deviceDrafts[device.id] ?? getDefaultDeviceDraft(device),
              ]),
            );

            setSelectedDeviceIds(new Set(restoredSelectedIds));
            setDeviceDrafts(restoredDeviceDrafts);
            hasAppliedRestoredDevicesRef.current = true;
          } else {
            setSelectedDeviceIds(new Set(devices.map(d => d.id)));
            setDeviceDrafts(
              Object.fromEntries(
                devices.map((device) => [device.id, getDefaultDeviceDraft(device)]),
              ),
            );
          }
        } else {
          setRoomDevices([]);
          setSelectedDeviceIds(new Set());
          setDeviceDrafts({});
        }
      } catch (error) {
        console.error('Failed to load room devices:', error);
      } finally {
        setIsDevicesHydrated(true);
      }
    };
    loadRoomDevices();
  }, [homeId, selectedRoomId]);

  useEffect(() => {
    if (!hasHydratedDraftRef.current) return;

    const shouldPersist =
      step > 1 ||
      !!selectedRoomId ||
      !!selectedPlaylistId ||
      !!selectedPlaylistName ||
      !!scenarioName.trim() ||
      !!description.trim() ||
      focusMode ||
      selectedDeviceIds.size > 0;

    const persistDraft = async () => {
      try {
        if (!shouldPersist) {
          await AsyncStorage.removeItem(NEW_SCENARIO_DRAFT_KEY);
          return;
        }

        await saveScenarioDraft();
      } catch (error) {
        console.error('Failed to persist scenario draft:', error);
      }
    };

    void persistDraft();
  }, [
    description,
    deviceDrafts,
    focusMode,
    isRoomStepSkipped,
    saveScenarioDraft,
    scenarioImage,
    scenarioName,
    selectedDeviceIds,
    selectedPlaylistId,
    selectedPlaylistName,
    selectedRoomId,
    step,
  ]);

  const nextStep = () => {
    if (step < TOTAL_STEPS) setStep((current) => current + 1);
  };

  const prevStep = async () => {
    if (isRoomStepSkipped && step === 2) {
      await discardScenarioDraft();
      router.back();
      return;
    }

    if (step > 1) {
      setStep((current) => current - 1);
      return;
    }
    await discardScenarioDraft();
    router.back();
  };

  const handleCancel = useCallback(async () => {
    await discardScenarioDraft();
    router.back();
  }, [discardScenarioDraft]);

  const isNextDisabled = () => {
    if (step === 1) return !selectedRoomId;
    if (step === 3) {
      return !scenarioName.trim() || !description.trim() || !scenarioImage;
    }
    return false;
  };

  const handlePlaylistSelect = (playlist: PlaylistItem) => {
    setSelectedPlaylistId(playlist.id);
    setSelectedPlaylistName(playlist.name);
  };

  const clearPlaylistSelection = () => {
    setSelectedPlaylistId('');
    setSelectedPlaylistName('');
  };

  const toggleDeviceSelection = (deviceId: number) => {
    setSelectedDeviceIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(deviceId)) newSet.delete(deviceId);
      else newSet.add(deviceId);
      return newSet;
    });

    setDeviceDrafts((prev) => {
      if (prev[deviceId]) return prev;
      const device = roomDevices.find((item) => item.id === deviceId);
      if (!device) return prev;
      return {
        ...prev,
        [deviceId]: getDefaultDeviceDraft(device),
      };
    });
  };

  const ensureDeviceDraft = (deviceId: number) => {
    setDeviceDrafts((prev) => {
      if (prev[deviceId]) return prev;
      const device = roomDevices.find((item) => item.id === deviceId);
      if (!device) return prev;
      return {
        ...prev,
        [deviceId]: getDefaultDeviceDraft(device),
      };
    });
  };

  const updateDeviceDraft = (
    deviceId: number,
    updater: (current: DeviceControlDraft, device: RoomDeviceRow) => DeviceControlDraft,
  ) => {
    const device = roomDevices.find((item) => item.id === deviceId);
    if (!device) return;

    setDeviceDrafts((prev) => {
      const current = prev[deviceId] ?? getDefaultDeviceDraft(device);
      return {
        ...prev,
        [deviceId]: updater(current, device),
      };
    });
  };

  const openDeviceConfig = (deviceId: number) => {
    ensureDeviceDraft(deviceId);
    setActiveConfigDeviceId(deviceId);
    panelTranslateX.setValue(PANEL_WIDTH);
    Animated.spring(panelTranslateX, {
      toValue: 0,
      useNativeDriver: true,
      speed: 18,
      bounciness: 0,
    }).start();
  };

  const closeDeviceConfig = () => {
    Animated.timing(panelTranslateX, {
      toValue: PANEL_WIDTH,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) setActiveConfigDeviceId(null);
    });
  };

  const setDeviceDraftFromPercentage = (deviceId: number, percentage: number) => {
    const device = roomDevices.find((item) => item.id === deviceId);
    if (!device) return;

    const control = getDeviceControlConfig(device.type);
    const boundedPercentage = clamp(percentage, 0, 100);
    const rawValue =
      control.min + (boundedPercentage / 100) * (control.max - control.min);
    const steppedValue =
      Math.round(rawValue / control.step) * control.step;
    const nextNumericValue = clamp(steppedValue, control.min, control.max);

    updateDeviceDraft(deviceId, (current) => ({
          ...current,
          value: formatControlValue(nextNumericValue, control.unit),
          brightness:
            normalizeScenarioDeviceType(device.type) === 'light'
              ? `${nextNumericValue}%`
              : current.brightness,
    }));
  };

  const applyLightTemperaturePreset = (
    deviceId: number,
    preset: { temperature: number; mode: string },
  ) => {
    updateDeviceDraft(deviceId, (current) => ({
      ...current,
      temperature: preset.temperature,
      mode: preset.mode,
    }));
  };

  const applyDevicePreset = (deviceId: number, preset: Record<string, string | number>) => {
    updateDeviceDraft(deviceId, (current, device) => {
      const nextDraft: DeviceControlDraft = {
        ...current,
        ...preset,
      };

      if (typeof preset.color === 'string') {
        nextDraft.color = preset.color;
        nextDraft.value = preset.color;
      }

      if (typeof preset.value === 'number') {
        const control = getDeviceControlConfig(device.type);
        nextDraft.value = formatControlValue(preset.value, control.unit);
      }

      return nextDraft;
    });
  };

  const handleSliderLayout = (sliderKey: string, event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setSliderWidths((prev) => (prev[sliderKey] === width ? prev : { ...prev, [sliderKey]: width }));
  };

  const handleSave = async () => {
    if (isSaving || !selectedRoomId || !selectedRoom) return;

    setIsSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to create a scenario.');

      let imageUrl = getImageUri(scenarioImage);
      if (
        imageUrl &&
        (imageUrl.startsWith('data:') || imageUrl.startsWith('file:') || imageUrl.startsWith('blob:'))
      ) {
        const uploadedUrl = await uploadImage(imageUrl);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      const persistedImage = imageUrl || getDefaultScenarioImageKey(selectedRoom.name);

      const scenarioDevices = roomDevices
        .filter(d => selectedDeviceIds.has(d.id))
        .map(d => ({
          deviceId: `db-${d.id}`,
          ...(deviceDrafts[d.id] ?? getDefaultDeviceDraft(d)),
          deviceName: d.name,
          deviceType: d.type
        }));

      const basePayload = {
        name: scenarioName.trim(),
        room_id: selectedRoomId,
        playlist_id: selectedPlaylistId || null,
        devices: scenarioDevices
      };

      const fullPayload = {
        ...basePayload,
        description: description.trim(),
        playlist_name: selectedPlaylistName || null,
        image: persistedImage,
        focus_mode_enabled: focusMode,
        shortcuts: false,
      };

      let payloadToInsert: Record<string, unknown> = fullPayload;
      let insertResult = await supabase
        .from('scenarios')
        .insert(payloadToInsert)
        .select('id')
        .single();

      const unsupportedColumnErrorCodes = new Set(['42703', 'PGRST204']);
      const fallbackColumnOrder = [
        'devices',
        'playlist_name',
        'description',
        'image',
        'focus_mode_enabled',
        'shortcuts',
      ];

      while (insertResult.error && unsupportedColumnErrorCodes.has(insertResult.error.code ?? '')) {
        const missingColumn = getMissingColumnName(insertResult.error);
        const columnsToRemove = missingColumn
          ? [missingColumn]
          : fallbackColumnOrder.filter(column => column in payloadToInsert);

        if (columnsToRemove.length === 0) break;

        payloadToInsert = omitKeys(payloadToInsert, columnsToRemove);

        insertResult = await supabase
          .from('scenarios')
          .insert(payloadToInsert)
          .select('id')
          .single();
      }

      if (insertResult.error?.code === '42501') {
        throw new Error('The database still needs the scenarios permission update. Run `supabase db push` and try again.');
      }

      if (insertResult.error || !insertResult.data?.id) {
        throw insertResult.error || new Error('Could not create the scenario.');
      }

      await AsyncStorage.removeItem(NEW_SCENARIO_DRAFT_KEY);

      addNotification(
        'New Scenario Created',
        `"${scenarioName.trim()}" is ready to use in ${selectedRoom.name}.`,
        'creation',
      );

      trackEvent('scenario-created', {
        area: 'scenarios',
        screen: 'new-scenario',
        action: 'create-scenario',
        userId: user.id,
        metadata: {
          scenarioId: insertResult.data.id,
          roomId: selectedRoomId,
          playlistId: selectedPlaylistId || null,
          focusMode,
        },
      });

      router.push({
        pathname: '/activity-details',
        params: {
          id: `scenario:${insertResult.data.id}`,
          isNew: 'true',
          itemType: 'scenario',
        },
      });
    } catch (error) {
      console.error('Failed to create scenario:', error);
      captureException(error, {
        area: 'scenarios',
        screen: 'new-scenario',
        action: 'create-scenario',
      });
      AccessibilityInfo.announceForAccessibility(
        error instanceof Error ? error.message : 'Could not create the scenario.',
      );
    } finally {
      setIsSaving(false);
    }
  };

  const renderSoftSlider = ({
    sliderKey,
    device,
    value,
    minLabel,
    maxLabel,
    colors,
    onChange,
    sensitivity = 0.45,
  }: {
    sliderKey: string;
    device: RoomDeviceRow;
    value: number;
    minLabel: string;
    maxLabel: string;
    colors: string[];
    onChange: (percentage: number) => void;
    sensitivity?: number;
  }) => {
    const fillPercentage = clamp(value, 0, 100);
    const sliderPanResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 4,
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        Math.abs(gestureState.dx) > Math.abs(gestureState.dy) && Math.abs(gestureState.dx) > 4,
      onPanResponderGrant: () => {
        const width = sliderWidths[sliderKey];
        if (!width || width <= 0) return;
        sliderDragStartRef.current[sliderKey] = clamp(value, 0, 100);
      },
      onPanResponderMove: (_, gestureState) => {
        const width = sliderWidths[sliderKey];
        if (!width || width <= 0) return;
        const startValue = sliderDragStartRef.current[sliderKey] ?? clamp(value, 0, 100);
        const delta = (gestureState.dx / width) * 100 * sensitivity;
        onChange(clamp(startValue + delta, 0, 100));
      },
    });

    return (
      <View>
        <View
          className="h-11 justify-center"
          onLayout={(event) => handleSliderLayout(sliderKey, event)}
          {...sliderPanResponder.panHandlers}
          accessibilityRole="adjustable"
          accessibilityLabel={`${device.name} slider`}
          accessibilityValue={{ min: 0, max: 100, now: Math.round(fillPercentage) }}
        >
          <LinearGradient
            colors={colors as [string, string, ...string[]]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={{ height: 14, borderRadius: 999, overflow: 'hidden' }}
          >
            <View className="flex-1 bg-white/20" />
          </LinearGradient>
          <View
            className="absolute w-8 h-8 rounded-full bg-white border border-[#E6E1C7]"
            style={{
              left: `${fillPercentage}%`,
              marginLeft: -16,
              shadowColor: '#8A8A6D',
              shadowOpacity: 0.18,
              shadowRadius: 10,
              shadowOffset: { width: 0, height: 6 },
              elevation: 4,
            }}
          />
        </View>

        <View className="flex-row justify-between mt-2">
          <Text className="text-[#6C7A74] text-xs" style={{ fontFamily: 'Nunito_600SemiBold' }}>
            {minLabel}
          </Text>
          <Text className="text-[#6C7A74] text-xs" style={{ fontFamily: 'Nunito_600SemiBold' }}>
            {maxLabel}
          </Text>
        </View>
      </View>
    );
  };

  const renderDeviceConfigPanel = () => {
    if (!activeConfigDevice) return null;

    const draft = deviceDrafts[activeConfigDevice.id] ?? getDefaultDeviceDraft(activeConfigDevice);
    const control = getDeviceControlConfig(activeConfigDevice.type);
    const normalizedType = normalizeScenarioDeviceType(activeConfigDevice.type);
    const numericValue = parseDraftNumericValue(draft, control.max);
    const heroValue =
      normalizedType === 'light'
        ? draft.brightness || '0%'
        : normalizedType === 'thermostat'
          ? `${numericValue}º`
          : typeof draft.value === 'number'
            ? `${draft.value}${control.unit}`
            : `${draft.value ?? 'On'}`;
    const accentColor = draft.color || '#FFD65A';
    const presets = getDevicePresetOptions(activeConfigDevice);
    const lightLevel = parseDraftNumericValue(draft, 70);
    const lightBrightnessPanResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) =>
        normalizedType === 'light' &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
        Math.abs(gestureState.dy) > 8,
      onMoveShouldSetPanResponderCapture: (_, gestureState) =>
        normalizedType === 'light' &&
        Math.abs(gestureState.dy) > Math.abs(gestureState.dx) &&
        Math.abs(gestureState.dy) > 8,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        setIsAdjustingLightHero(true);
        sliderDragStartRef.current[`light-hero-${activeConfigDevice.id}`] = parseDraftNumericValue(draft, 70);
      },
      onPanResponderMove: (_, gestureState) => {
        if (normalizedType !== 'light') return;
        const startValue = sliderDragStartRef.current[`light-hero-${activeConfigDevice.id}`] ?? parseDraftNumericValue(draft, 70);
        const nextValue = clamp(startValue - gestureState.dy / 1.4, 0, 100);
        setDeviceDraftFromPercentage(activeConfigDevice.id, nextValue);
      },
      onPanResponderRelease: () => {
        setIsAdjustingLightHero(false);
      },
      onPanResponderTerminate: () => {
        setIsAdjustingLightHero(false);
      },
    });

    return (
      <View
        pointerEvents={activeConfigDeviceId ? 'auto' : 'none'}
        style={{ position: 'absolute', inset: 0, zIndex: 60 }}
      >
        <Animated.View
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            bottom: 0,
            width: PANEL_WIDTH,
            transform: [{ translateX: panelTranslateX }],
            backgroundColor: '#F5F4EB',
            paddingTop: insets.top + 14,
            paddingHorizontal: 22,
            paddingBottom: Math.max(insets.bottom, 18),
          }}
        >
          <View className="flex-row items-center justify-between mb-6">
            <TouchableOpacity onPress={closeDeviceConfig} accessibilityRole="button" accessibilityLabel="Close device settings">
              <Ionicons name="chevron-back" size={30} color="#3E545C" />
            </TouchableOpacity>
            <Text className="text-[#3E545C] text-2xl" style={{ fontFamily: 'Nunito_700Bold' }}>
              {activeConfigDevice.name}
            </Text>
            <View style={{ width: 30 }} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            scrollEnabled={!isAdjustingLightHero}
            contentContainerStyle={{ paddingBottom: 12 }}
          >
            {normalizedType === 'light' ? (
              <>
                <View className="items-center mb-8">
                  <View
                    {...lightBrightnessPanResponder.panHandlers}
                    style={{
                      width: 148,
                      height: 272,
                      borderRadius: 74,
                      backgroundColor: '#E9E0A9',
                      overflow: 'hidden',
                      justifyContent: 'center',
                      alignItems: 'center',
                      shadowColor: accentColor,
                      shadowOpacity: 0.28,
                      shadowRadius: 28,
                      shadowOffset: { width: 0, height: 14 },
                      elevation: 8,
                    }}
                  >
                    <View
                      style={{
                        position: 'absolute',
                        left: 0,
                        right: 0,
                        bottom: 0,
                        height: `${lightLevel}%`,
                        backgroundColor: accentColor,
                      }}
                    />
                    <MaterialIcons name="lightbulb" size={42} color="#3E545C" />
                    <Text className="text-[#3E545C] text-3xl mt-4" style={{ fontFamily: 'Nunito_700Bold' }}>
                      {heroValue}
                    </Text>
                    <Text className="text-[#3E545C] text-sm mt-2" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                      {draft.mode || getTemperatureTone(draft.temperature)}
                    </Text>
                    <Text className="text-[#3E545C] text-xs mt-3 opacity-70" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                      Slide here up or down
                    </Text>
                  </View>
                </View>

                <View className="mb-7">
                  <Text className="text-[#3E545C] text-lg mb-3" style={{ fontFamily: 'Nunito_700Bold' }}>
                    Brightness
                  </Text>
                  <Text className="text-[#6C7A74] text-sm mb-3" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                    Use the big lamp above and drag up or down.
                  </Text>
                  {renderSoftSlider({
                    sliderKey: `device-${activeConfigDevice.id}-brightness`,
                    device: activeConfigDevice,
                    value: lightLevel,
                    minLabel: '0%',
                    maxLabel: '100%',
                    colors: getSliderColors(activeConfigDevice.type, accentColor),
                    onChange: (percentage) => setDeviceDraftFromPercentage(activeConfigDevice.id, percentage),
                    sensitivity: 0.32,
                  })}
                  <View className="flex-row gap-3">
                    {[25, 50, 75, 100].map((level) => {
                      const selected = lightLevel === level;
                      return (
                        <TouchableOpacity
                          key={level}
                          onPress={() => setDeviceDraftFromPercentage(activeConfigDevice.id, level)}
                          className={`rounded-full px-4 py-3 ${selected ? 'bg-[#5B9853]' : 'bg-white border border-[#DDE5D7]'}`}
                          accessibilityRole="button"
                          accessibilityLabel={`Set brightness to ${level} percent`}
                        >
                          <Text
                            className={selected ? 'text-white' : 'text-[#3E545C]'}
                            style={{ fontFamily: 'Nunito_700Bold' }}
                          >
                            {level}%
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View className="mb-7">
                  <Text className="text-[#3E545C] text-lg mb-3" style={{ fontFamily: 'Nunito_700Bold' }}>
                    Temperature
                  </Text>
                  <View className="flex-row gap-3">
                    {LIGHT_TEMPERATURE_PRESETS.map((preset) => {
                      const selected = getTemperatureTone(draft.temperature) === preset.label;
                      return (
                        <TouchableOpacity
                          key={preset.label}
                          onPress={() => applyLightTemperaturePreset(activeConfigDevice.id, preset)}
                          className={`flex-1 rounded-[24px] px-4 py-4 ${selected ? 'bg-[#E8F3E8] border border-[#BFD9B9]' : 'bg-white border border-[#DDE5D7]'}`}
                          accessibilityRole="button"
                          accessibilityLabel={`Set light temperature to ${preset.label}`}
                        >
                          <Text className="text-[#3E545C] text-center" style={{ fontFamily: 'Nunito_700Bold' }}>
                            {preset.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>

                <View className="mb-7">
                  <Text className="text-[#3E545C] text-lg mb-4" style={{ fontFamily: 'Nunito_700Bold' }}>
                    Colors
                  </Text>
                  <View className="flex-row flex-wrap justify-between gap-y-4">
                    {LIGHT_COLOR_OPTIONS.map((color) => {
                      const selected = (draft.color || draft.value) === color;
                      return (
                        <TouchableOpacity
                          key={color}
                          onPress={() =>
                            updateDeviceDraft(activeConfigDevice.id, (current) => ({
                              ...current,
                              color,
                              value: color,
                              mode: 'Custom glow',
                            }))
                          }
                          style={{
                            width: 56,
                            height: 56,
                            borderRadius: 28,
                            backgroundColor: color,
                            borderWidth: selected ? 3 : 0,
                            borderColor: '#3E545C',
                          }}
                          accessibilityRole="button"
                          accessibilityLabel={`Select light color ${color}`}
                        />
                      );
                    })}
                  </View>
                </View>
              </>
            ) : (
              <View className="flex-1">
                <View className="rounded-[40px] bg-white border border-[#E2E6DA] px-6 py-8 items-center mb-7">
                  <View className="w-20 h-20 rounded-full bg-[#EDF4E7] items-center justify-center mb-4">
                    {getDeviceIcon(activeConfigDevice.type)}
                  </View>
                  <Text className="text-[#3E545C] text-4xl" style={{ fontFamily: 'Nunito_700Bold' }}>
                    {heroValue}
                  </Text>
                  <Text className="text-[#6C7A74] text-sm mt-2" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                    {draft.mode || control.label}
                  </Text>
                </View>

                <View className="mb-7">
                  <Text className="text-[#3E545C] text-lg mb-3" style={{ fontFamily: 'Nunito_700Bold' }}>
                    {control.label}
                  </Text>
                  {renderSoftSlider({
                    sliderKey: `device-${activeConfigDevice.id}-main`,
                    device: activeConfigDevice,
                    value: getControlFillPercentage(numericValue, control.min, control.max),
                    minLabel: `${control.min}${control.unit}`,
                    maxLabel: `${control.max}${control.unit}`,
                    colors: getSliderColors(activeConfigDevice.type),
                    onChange: (percentage) => setDeviceDraftFromPercentage(activeConfigDevice.id, percentage),
                  })}
                </View>
              </View>
            )}

            <View className="mb-7">
              <Text className="text-[#3E545C] text-lg mb-3" style={{ fontFamily: 'Nunito_700Bold' }}>
                Quick presets
              </Text>
              <View className="flex-row flex-wrap gap-3">
                {presets.map((preset) => (
                  <TouchableOpacity
                    key={preset.label}
                    onPress={() => applyDevicePreset(activeConfigDevice.id, preset)}
                    className="rounded-full bg-white border border-[#DDE5D7] px-4 py-3"
                    accessibilityRole="button"
                    accessibilityLabel={`Apply preset ${preset.label}`}
                  >
                    <Text className="text-[#3E545C]" style={{ fontFamily: 'Nunito_700Bold' }}>
                      {preset.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <TouchableOpacity
              onPress={closeDeviceConfig}
              className="h-14 rounded-full items-center justify-center"
              style={{ backgroundColor: '#5B9853' }}
              accessibilityRole="button"
              accessibilityLabel="Save device settings"
            >
              <Text className="text-white text-2xl" style={{ fontFamily: 'Nunito_700Bold' }}>
                Save
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    );
  };

  if (!fontsLoaded) return null;

  if (isInitializing) {
    return (
      <View style={{ flex: 1, backgroundColor: '#F9FAF7' }} accessibilityLanguage="en-US">
        <Stack.Screen
          options={{
            title: 'New Scenario',
            headerShown: false,
          }}
        />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAF7' }} accessibilityLanguage="en-US">
      <Stack.Screen
        options={{
          title: `New Scenario - Step ${displayedStep} of ${displayedTotalSteps}`,
          headerShown: false,
        }}
      />

      <View style={{ height: insets.top, backgroundColor: '#F9FAF7' }} />
      <View className="px-5 pt-2">
        <FlowHeader
          title="New scenario"
          step={displayedStep}
          totalSteps={displayedTotalSteps}
          onBack={prevStep}
          onCancel={handleCancel}
        />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View className="flex-1 relative">
          <ScrollView
            ref={scrollViewRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{
              paddingHorizontal: 20,
              paddingBottom: 120 + insets.bottom,
            }}
            keyboardShouldPersistTaps="handled"
          >
            {loadError ? (
              <StepWrapper title="Scenario setup" subtitle="There is one thing to fix first.">
                <View className="bg-white rounded-3xl border border-[#DDE5D7] p-5">
                  <Text
                    className="text-[#354F52] text-lg mb-2"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    Scenario creation is not ready yet
                  </Text>
                  <Text
                    className="text-[#6C7A74] text-base"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  >
                    {loadError}
                  </Text>
                </View>
              </StepWrapper>
            ) : (
              <>
                {step === 1 && (
                  <StepWrapper
                    title="Where should it happen?"
                    subtitle="Choose the room this scenario belongs to."
                  >
                    <View
                      className="flex-row flex-wrap gap-3 justify-between"
                      accessible={true}
                      accessibilityRole="radiogroup"
                      accessibilityLabel="Room options"
                    >
                      {rooms.map((room) => (
                        <SelectionCard
                          key={room.id}
                          label={room.name}
                          icon={getRoomIconName(room.name)}
                          isSelected={selectedRoomId === room.id}
                          onPress={() => setSelectedRoomId(room.id)}
                        />
                      ))}
                    </View>
                  </StepWrapper>
                )}

                {step === 2 && (
                  <StepWrapper
                    title="Devices and mood"
                    subtitle="Select the devices to control and optionally connect a Spotify playlist."
                  >
                    {roomDevices.length > 0 && (
                      <View className="bg-white rounded-3xl border border-[#DDE5D7] p-5 mb-5">
                        <Text
                          className="text-[#354F52] text-lg mb-3"
                          style={{ fontFamily: 'Nunito_700Bold' }}
                        >
                          Devices to control
                        </Text>
                        <View className="gap-y-3">
                          {roomDevices.map((device) => (
                            <TouchableOpacity
                              key={device.id}
                              onPress={() => toggleDeviceSelection(device.id)}
                              className="flex-row items-center justify-between"
                            >
                              <View className="flex-row items-center flex-1 pr-3">
                                <View className="w-10 h-10 rounded-full bg-[#EDF5EA] items-center justify-center mr-3">
                                  {getDeviceIcon(device.type)}
                                </View>
                                <View className="flex-1">
                                  <Text
                                    className="text-[#354F52] text-base"
                                    style={{ fontFamily: 'Nunito_600SemiBold' }}
                                  >
                                    {device.name}
                                  </Text>
                                  <Text
                                    className="text-[#7A8C85] text-xs capitalize"
                                    style={{ fontFamily: 'Nunito_400Regular' }}
                                  >
                                    {normalizeScenarioDeviceType(device.type) ?? device.type}
                                  </Text>
                                </View>
                              </View>
                              <Switch
                                value={selectedDeviceIds.has(device.id)}
                                onValueChange={() => toggleDeviceSelection(device.id)}
                                trackColor={{ false: '#D1D9C5', true: '#BFD9B9' }}
                                thumbColor={selectedDeviceIds.has(device.id) ? '#548F53' : '#F4F6F1'}
                                accessibilityLabel={`Toggle ${device.name}`}
                              />
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    )}

                    {selectedDevices.length > 0 && (
                      <View className="bg-[#F6F8F3] rounded-3xl border border-[#DDE5D7] p-5 mb-5">
                        <Text
                          className="text-[#354F52] text-lg mb-3"
                          style={{ fontFamily: 'Nunito_700Bold' }}
                        >
                          Device adjustments
                        </Text>
                        <View className="gap-y-3">
                          {selectedDevices.map((device) => {
                            const control = getDeviceControlConfig(device.type);
                            const draft = deviceDrafts[device.id] ?? getDefaultDeviceDraft(device);
                            const numericValue = parseDraftNumericValue(draft, control.max);
                            const fillPercentage = getControlFillPercentage(numericValue, control.min, control.max);
                            const summary = getScenarioDeviceSummary(device, draft);
                            const accentColor = draft.color || '#548F53';

                            return (
                              <View
                                key={`draft-${device.id}`}
                                className="rounded-[28px] border border-[#DDE5D7] bg-white px-4 py-4"
                              >
                                <View className="flex-row items-center justify-between mb-4">
                                  <View className="flex-row items-center flex-1 pr-3">
                                    <View className="w-12 h-12 rounded-2xl bg-[#EDF5EA] items-center justify-center mr-3">
                                      {getDeviceIcon(device.type)}
                                    </View>
                                    <View className="flex-1">
                                      <Text
                                        className="text-[#354F52] text-base"
                                        style={{ fontFamily: 'Nunito_700Bold' }}
                                      >
                                        {device.name}
                                      </Text>
                                      <Text
                                        className="text-[#7A8C85] text-sm"
                                        style={{ fontFamily: 'Nunito_400Regular' }}
                                      >
                                        {summary}
                                      </Text>
                                    </View>
                                  </View>
                                  <View className="rounded-2xl bg-[#EEF6EC] px-3 py-2 min-w-[78px] items-center">
                                    <Text
                                      className="text-[#548F53] text-base"
                                      style={{ fontFamily: 'Nunito_700Bold' }}
                                    >
                                      {normalizeScenarioDeviceType(device.type) === 'light'
                                        ? draft.brightness || '0%'
                                        : typeof draft.value === 'number'
                                          ? `${draft.value}${control.unit}`
                                          : draft.value}
                                    </Text>
                                  </View>
                                </View>

                                <View className="mb-4">
                                  {renderSoftSlider({
                                    sliderKey: `preview-device-${device.id}`,
                                    device,
                                    value: fillPercentage,
                                    minLabel: `${control.min}${control.unit}`,
                                    maxLabel: `${control.max}${control.unit}`,
                                    colors: getSliderColors(device.type, accentColor),
                                    onChange: (percentage) => setDeviceDraftFromPercentage(device.id, percentage),
                                    sensitivity: normalizeScenarioDeviceType(device.type) === 'light' ? 0.32 : 0.42,
                                  })}
                                </View>

                                <TouchableOpacity
                                  onPress={() => openDeviceConfig(device.id)}
                                  className="px-4 py-3 rounded-2xl bg-[#F8FAF6] border border-[#E4EBE0] flex-row items-center justify-between"
                                  accessibilityRole="button"
                                  accessibilityLabel={`Configure ${device.name}`}
                                >
                                  <View>
                                    <Text
                                      className="text-[#354F52] text-base"
                                      style={{ fontFamily: 'Nunito_700Bold' }}
                                    >
                                      Open device settings
                                    </Text>
                                    <Text
                                      className="text-[#6C7A74] text-xs mt-1"
                                      style={{ fontFamily: 'Nunito_600SemiBold' }}
                                    >
                                      Opens from the right with full controls
                                    </Text>
                                  </View>
                                  <Ionicons name="chevron-forward" size={22} color="#548F53" />
                                </TouchableOpacity>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    )}

                    <View className="bg-white rounded-3xl border border-[#DDE5D7] p-5 mb-5">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1 pr-4">
                          <Text
                            className="text-[#354F52] text-lg"
                            style={{ fontFamily: 'Nunito_700Bold' }}
                          >
                            Focus mode
                          </Text>
                          <Text
                            className="text-[#6C7A74] text-sm mt-1"
                            style={{ fontFamily: 'Nunito_400Regular' }}
                          >
                            Mark this scenario as a calmer, lower-distraction environment.
                          </Text>
                        </View>
                        <Switch
                          value={focusMode}
                          onValueChange={setFocusMode}
                          trackColor={{ false: '#D1D9C5', true: '#BFD9B9' }}
                          thumbColor={focusMode ? '#548F53' : '#F4F6F1'}
                          accessibilityLabel="Toggle focus mode"
                        />
                      </View>
                    </View>

                    <View className="bg-[#EEF4EA] rounded-3xl border border-[#DDE5D7] p-4 mb-5">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-1 pr-4">
                          <Text
                            className="text-[#354F52] text-base"
                            style={{ fontFamily: 'Nunito_700Bold' }}
                          >
                            {selectedPlaylistName || 'No playlist selected'}
                          </Text>
                          <Text
                            className="text-[#6C7A74] text-sm mt-1"
                            style={{ fontFamily: 'Nunito_400Regular' }}
                          >
                            {selectedPlaylistId
                              ? 'This playlist will be used when the scenario starts.'
                              : 'You can skip Spotify and keep this scenario music-free.'}
                          </Text>
                        </View>
                        {selectedPlaylistId ? (
                          <TouchableOpacity
                            onPress={clearPlaylistSelection}
                            className="bg-white rounded-full px-4 py-2"
                            accessibilityRole="button"
                            accessibilityLabel="Remove selected playlist"
                          >
                            <Text
                              className="text-[#548F53]"
                              style={{ fontFamily: 'Nunito_700Bold' }}
                            >
                              Clear
                            </Text>
                          </TouchableOpacity>
                        ) : (
                          <View className="bg-white rounded-full px-4 py-2">
                            <Text
                              className="text-[#6C7A74]"
                              style={{ fontFamily: 'Nunito_700Bold' }}
                            >
                              Optional
                            </Text>
                          </View>
                        )}
                      </View>
                    </View>

                    <SpotifyPlaylistSelector
                      onSelect={handlePlaylistSelect}
                      selectedId={selectedPlaylistId}
                      onBeforeConnect={saveScenarioDraftForSpotify}
                    />
                  </StepWrapper>
                )}

                {step === 3 && (
                  <View>
                    <Step5_Details
                      name={scenarioName}
                      setName={setScenarioName}
                      desc={description}
                      setDesc={setDescription}
                      image={scenarioImage}
                      setImage={setScenarioImage}
                      defaultImage={defaultScenarioImage}
                    />

                    <View className="mt-6 bg-white rounded-3xl border border-[#DDE5D7] p-5">
                      <Text
                        className="text-[#354F52] text-lg"
                        style={{ fontFamily: 'Nunito_700Bold' }}
                      >
                        Scenario vibe
                      </Text>
                      <Text
                        className="text-[#6C7A74] text-sm mt-1 mb-4"
                        style={{ fontFamily: 'Nunito_400Regular' }}
                      >
                        This helps Nidush present it as a calmer environment for this room.
                      </Text>

                      <TouchableOpacity
                        onPress={() => setFocusMode((current) => !current)}
                        className={`rounded-2xl border px-4 py-4 flex-row items-center justify-between ${
                          focusMode
                            ? 'bg-[#E8F3E8] border-[#BFD9B9]'
                            : 'bg-[#F6F8F3] border-[#DDE5D7]'
                        }`}
                        accessibilityRole="switch"
                        accessibilityState={{ checked: focusMode }}
                        accessibilityLabel="Focus mode"
                      >
                        <View className="flex-row items-center flex-1 pr-3">
                          <View className="w-10 h-10 rounded-full bg-white items-center justify-center mr-3">
                            <Ionicons
                              name={focusMode ? 'moon' : 'sunny-outline'}
                              size={20}
                              color={focusMode ? '#548F53' : '#7A8C85'}
                            />
                          </View>
                          <View className="flex-1">
                            <Text
                              className="text-[#354F52] text-base"
                              style={{ fontFamily: 'Nunito_700Bold' }}
                            >
                              Focus mode {focusMode ? 'enabled' : 'disabled'}
                            </Text>
                            <Text
                              className="text-[#6C7A74] text-sm mt-1"
                              style={{ fontFamily: 'Nunito_400Regular' }}
                            >
                              {focusMode
                                ? 'Great for meditation, reading, and low-distraction moments.'
                                : 'A more open, flexible scenario for general use.'}
                            </Text>
                          </View>
                        </View>

                        <MaterialIcons
                          name={focusMode ? 'toggle-on' : 'toggle-off'}
                          size={34}
                          color={focusMode ? '#548F53' : '#AEB9A7'}
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {step === 4 && (
                  <StepWrapper
                    title="Review and save"
                    subtitle="Check the room, playlist, and final details before saving."
                  >
                    <ReviewCard label="Room" onEdit={() => setStep(1)}>
                      <View className="flex-row items-center">
                        <View className="w-11 h-11 rounded-lg bg-[#C8E2C8] justify-center items-center mr-3">
                          <MaterialIcons
                            name={getRoomIconName(selectedRoom?.name || '')}
                            size={24}
                            color="#354F52"
                          />
                        </View>
                        <Text
                          className="text-lg text-[#2F4F4F]"
                          style={{ fontFamily: 'Nunito_600SemiBold' }}
                        >
                          {selectedRoom?.name || 'Not selected'}
                        </Text>
                      </View>
                    </ReviewCard>

                    <ScenarioReviewCard
                      environment={{
                        id: 'draft',
                        title: scenarioName || 'Untitled scenario',
                        playlist: selectedPlaylistName || undefined,
                        focusMode,
                        devices: roomDevices
                          .filter(d => selectedDeviceIds.has(d.id))
                          .map(d => ({
                            deviceId: `db-${d.id}`,
                            ...(deviceDrafts[d.id] ?? getDefaultDeviceDraft(d)),
                            deviceName: d.name,
                            deviceType: d.type
                          })),
                      }}
                      onEdit={() => setStep(2)}
                    />

                    <ReviewCard label="Details" onEdit={() => setStep(3)}>
                      <View className="flex-row items-start">
                        <View className="w-11 h-11 rounded-lg bg-[#C8E2C8] justify-center items-center mr-3">
                          <MaterialIcons name="edit-note" size={24} color="#354F52" />
                        </View>
                        <View className="flex-1">
                          <Text
                            className="text-lg text-[#2F4F4F]"
                            style={{ fontFamily: 'Nunito_600SemiBold' }}
                          >
                            {scenarioName || 'Untitled scenario'}
                          </Text>
                          <Text
                            className="text-[#6C7A74] text-sm mt-1"
                            style={{ fontFamily: 'Nunito_400Regular' }}
                          >
                            {description || 'No description yet.'}
                          </Text>
                        </View>
                      </View>
                    </ReviewCard>
                  </StepWrapper>
                )}
              </>
            )}
          </ScrollView>

          {renderDeviceConfigPanel()}

          {!isKeyboardVisible && !loadError && (
            <View
              className="absolute left-0 right-0 items-center bg-transparent pointer-events-box-none"
              style={{
                bottom: 15,
                paddingBottom: insets.bottom > 0 ? insets.bottom : 20,
                paddingTop: 10,
              }}
            >
              <TouchableOpacity
                className={`h-14 w-[210px] rounded-full justify-center items-center ${
                  isNextDisabled()
                    ? 'bg-gray-400 opacity-60 shadow-none'
                    : 'bg-[#548F53] shadow-lg'
                }`}
                onPress={step === TOTAL_STEPS ? handleSave : nextStep}
                disabled={isNextDisabled() || isSaving}
                accessibilityRole="button"
                accessibilityState={{ disabled: isNextDisabled() || isSaving }}
                accessibilityLabel={step === TOTAL_STEPS ? 'Save scenario' : 'Continue to next step'}
                accessibilityHint={
                  isNextDisabled()
                    ? 'Please complete the required fields before continuing.'
                    : 'Double tap to proceed.'
                }
              >
                {isSaving ? (
                  <View className="flex-row items-center">
                    <ActivityIndicator color="white" />
                    <Text
                      className="text-white text-xl ml-3"
                      style={{ fontFamily: 'Nunito_700Bold' }}
                    >
                      Saving...
                    </Text>
                  </View>
                ) : (
                  <Text
                    className="text-white text-2xl"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    {step === TOTAL_STEPS ? 'Save' : 'Continue'}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

export default function NewScenarioScreen() {
  return (
    <SafeAreaProvider>
      <NewScenarioContent />
    </SafeAreaProvider>
  );
}
