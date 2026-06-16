import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useState, useMemo, useCallback } from 'react'; 
import {
  Animated,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Image,
  FlatList,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../utils/supabase';
import { captureException, trackEvent } from '../../utils/observability';

import AddRoomDevice from '../../components/rooms/AddRoomDevice';
import RoutineCard from '../../components/routines/RoutineCard';
import { FeedbackState } from '../../components/UI/FeedbackState';
import { SearchAutocomplete } from '../../components/UI/SearchAutocomplete';

interface Routine {
  id: number;
  title: string;
  days: string;
  time: string;
  room: string;
  roomId?: number | null;
  scenarioId?: number | null;
  active: boolean;
  image: ImageSourcePropType;
  imageKey?: string | null;
}

interface Room {
  id: number;
  name: string;
}

interface RoutineImageOption {
  key: string;
  label: string;
  source: ImageSourcePropType;
}

type AddRoutineErrors = {
  name?: string;
  time?: string;
  days?: string;
  room?: string;
};

type RoutineRow = {
  id: number;
  name: string;
  execution_time: string;
  days_of_week: string | null;
  is_active: boolean;
  image?: string | null;
  scenario?: {
    id: number;
    rooms?: {
      name?: string | null;
    } | null;
  } | null;
};

const ROUTINE_IMAGES: Record<string, ImageSourcePropType> = {
  'Sunrise Awakening': require('../../assets/Scenarios/routines/sunrise_awakening.png'),
  'Gym Hour': require('../../assets/Scenarios/routines/gym_hour.png'),
  'Morning Kitchen Prep': require('../../assets/Scenarios/routines/morning_kitchen_prep.png'),
  'Weekend Sleep-In': require('../../assets/Scenarios/routines/weekend_sleep_in.png'),
  'Deep Sleep Transition': require('../../assets/Scenarios/routines/deep_sleep_transition.png'),
};

const DEFAULT_IMAGE = require('../../assets/Scenarios/routines/sunrise_awakening.png');
const DAY_OPTIONS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const ROUTINE_IMAGE_OPTIONS: RoutineImageOption[] = [
  {
    key: 'sunrise_awakening',
    label: 'Sunrise',
    source: require('../../assets/Scenarios/routines/sunrise_awakening.png'),
  },
  {
    key: 'gym_hour',
    label: 'Gym',
    source: require('../../assets/Scenarios/routines/gym_hour.png'),
  },
  {
    key: 'morning_kitchen_prep',
    label: 'Kitchen',
    source: require('../../assets/Scenarios/routines/morning_kitchen_prep.png'),
  },
  {
    key: 'weekend_sleep_in',
    label: 'Weekend',
    source: require('../../assets/Scenarios/routines/weekend_sleep_in.png'),
  },
  {
    key: 'deep_sleep_transition',
    label: 'Sleep',
    source: require('../../assets/Scenarios/routines/deep_sleep_transition.png'),
  },
];
const ROUTINE_IMAGE_BY_KEY = ROUTINE_IMAGE_OPTIONS.reduce<Record<string, ImageSourcePropType>>((acc, option) => {
  acc[option.key] = option.source;
  return acc;
}, {});
const ROUTINE_SELECT = `
  id,
  name,
  execution_time,
  days_of_week,
  is_active,
  image,
  scenario:scenarios (
    id,
    rooms:rooms (
      name
    )
  )
`;
const ROUTINE_SELECT_LEGACY = `
  id,
  name,
  execution_time,
  days_of_week,
  is_active,
  scenario:scenarios (
    id,
    rooms:rooms (
      name
    )
  )
`;

const formatTime = (timeStr: string) => {
  if (!timeStr) return '--:--';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const ampm = hours >= 12 ? 'pm' : 'am';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

const normalizeTimeInput = (value: string) => {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}:${digits.slice(2)}`;
};

const toDatabaseTime = (value: string) => {
  const match = value.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (Number.isNaN(hours) || Number.isNaN(minutes) || hours > 23 || minutes > 59) {
    return null;
  }

  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`;
};

const resolveRoutineImage = (imageKey?: string | null, title?: string) =>
  ROUTINE_IMAGE_BY_KEY[imageKey ?? ''] || ROUTINE_IMAGES[title ?? ''] || DEFAULT_IMAGE;

const routinesScreenCache: {
  routines: Routine[];
  rooms: Room[];
  hasLoadedOnce: boolean;
  loadError: string | null;
  page: number;
  hasMore: boolean;
  userHomeId: number | null;
} = {
  routines: [],
  rooms: [],
  hasLoadedOnce: false,
  loadError: null,
  page: 0,
  hasMore: true,
  userHomeId: null,
};

export default function Routines() {
  const routinePanelTranslateX = React.useRef(new Animated.Value(900)).current;
  const [routines, setRoutines] = useState<Routine[]>(routinesScreenCache.routines);
  const [rooms, setRooms] = useState<Room[]>(routinesScreenCache.rooms);
  const [loading, setLoading] = useState(!routinesScreenCache.hasLoadedOnce);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(routinesScreenCache.hasLoadedOnce);
  const [loadError, setLoadError] = useState<string | null>(routinesScreenCache.loadError);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);
  const [feedbackTone, setFeedbackTone] = useState<'error' | 'success' | 'info'>('info');
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(routinesScreenCache.page);
  const [hasMore, setHasMore] = useState(routinesScreenCache.hasMore);
  const PAGE_SIZE = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [userHomeId, setUserHomeId] = useState<number | null>(routinesScreenCache.userHomeId);
  const [isAddRoutineModalVisible, setIsAddRoutineModalVisible] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineTime, setNewRoutineTime] = useState('07:30');
  const [newRoutineRoomId, setNewRoutineRoomId] = useState<number | null>(null);
  const [newRoutineDays, setNewRoutineDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [newRoutineImageKey, setNewRoutineImageKey] = useState<string>(ROUTINE_IMAGE_OPTIONS[0].key);
  const [addRoutineErrors, setAddRoutineErrors] = useState<AddRoutineErrors>({});
  const [hasSelectedRoutineImage, setHasSelectedRoutineImage] = useState(false);
  const [isSavingRoutine, setIsSavingRoutine] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [isDeletingRoutine, setIsDeletingRoutine] = useState(false);
  const [isEditingRoutine, setIsEditingRoutine] = useState(false);

  const showFeedback = useCallback((message: string, tone: 'error' | 'success' | 'info' = 'info') => {
    setFeedbackMessage(message);
    setFeedbackTone(tone);
  }, []);

  const loadRoutines = useCallback(async (isNextPage = false, options?: { showLoader?: boolean }) => {
    try {
      if (isNextPage) {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
      } else {
        const showLoader = options?.showLoader ?? !hasLoadedOnce;
        setLoading(showLoader);
      }

      const currentPage = isNextPage ? page + 1 : 0;
      const start = currentPage * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setRoutines([]);
        setRooms([]);
        setUserHomeId(null);
        setLoadError('Sign in again to load your routines.');
        routinesScreenCache.routines = [];
        routinesScreenCache.rooms = [];
        routinesScreenCache.userHomeId = null;
        routinesScreenCache.loadError = 'Sign in again to load your routines.';
        return;
      }

      const { data: userHome, error: userHomeError } = await supabase
        .from('user_homes')
        .select('home_id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (userHomeError) throw userHomeError;

      if (!userHome?.home_id) {
        setRoutines([]);
        setRooms([]);
        setUserHomeId(null);
        setLoadError('Connect this profile to a home before creating routines.');
        routinesScreenCache.routines = [];
        routinesScreenCache.rooms = [];
        routinesScreenCache.userHomeId = null;
        routinesScreenCache.loadError = 'Connect this profile to a home before creating routines.';
        return;
      }

      const homeId = userHome.home_id;
      setUserHomeId(homeId);
      routinesScreenCache.userHomeId = homeId;

      const [roomsResult, routinesResult] = await Promise.all([
        supabase
          .from('rooms')
          .select('id, name')
          .eq('home_id', homeId)
          .order('id', { ascending: true }),
        supabase
          .from('routines')
          .select(ROUTINE_SELECT, { count: 'exact' })
          .eq('home_id', homeId)
          .order('id', { ascending: false })
          .range(start, end),
      ]);

      if (roomsResult.error) throw roomsResult.error;

      const loadedRooms = roomsResult.data || [];
      setRooms(loadedRooms);
      routinesScreenCache.rooms = loadedRooms;
      setNewRoutineRoomId((current) => current ?? loadedRooms[0]?.id ?? null);
      setLoadError(null);
      routinesScreenCache.loadError = null;

      let data: RoutineRow[] | null = routinesResult.data as RoutineRow[] | null;
      let error = routinesResult.error;
      let count: number | null = routinesResult.count;

      if (error?.code === '42703' && /image/i.test(error.message || '')) {
        const legacyResult = await supabase
          .from('routines')
          .select(ROUTINE_SELECT_LEGACY, { count: 'exact' })
          .eq('home_id', homeId)
          .order('id', { ascending: false })
          .range(start, end);

        data = legacyResult.data as RoutineRow[] | null;
        error = legacyResult.error;
        count = legacyResult.count;
      }

      if (error) throw error;

      if (data) {
        const mappedRoutines: Routine[] = data.map((item) => ({
          id: item.id,
          title: item.name,
          days: item.days_of_week || 'N/A',
          time: formatTime(item.execution_time),
          room: item.scenario?.rooms?.name || 'Unknown',
          roomId: loadedRooms.find((room) => room.name === (item.scenario?.rooms?.name || ''))?.id ?? null,
          scenarioId: item.scenario?.id ?? null,
          active: item.is_active,
          image: resolveRoutineImage(item.image, item.name),
          imageKey: item.image ?? null,
        }));

        if (isNextPage) {
          setRoutines(current => {
            const next = [...current, ...mappedRoutines];
            routinesScreenCache.routines = next;
            return next;
          });
        } else {
          setRoutines(mappedRoutines);
          routinesScreenCache.routines = mappedRoutines;
        }

        setPage(currentPage);
        routinesScreenCache.page = currentPage;
        if (count !== null) {
          const nextHasMore = start + mappedRoutines.length < count;
          setHasMore(nextHasMore);
          routinesScreenCache.hasMore = nextHasMore;
        }
      }
    } catch (err) {
      console.error('Error loading routines:', err);
      setLoadError('We could not load your routines right now. Try again in a moment.');
      routinesScreenCache.loadError = 'We could not load your routines right now. Try again in a moment.';
    } finally {
      routinesScreenCache.hasLoadedOnce = true;
      setHasLoadedOnce(true);
      setLoading(false);
      setLoadingMore(false);
    }
  }, [hasLoadedOnce, page, hasMore, loadingMore]);

  useFocusEffect(
    useCallback(() => {
      loadRoutines(false, { showLoader: !hasLoadedOnce });
    }, [loadRoutines])
  );

  const toggleRoutine = async (id: number) => {
    const routineToToggle = routines.find(r => r.id === id);
    if (!routineToToggle) return;

    const newStatus = !routineToToggle.active;

    setRoutines(current =>
      current.map(r => (r.id === id ? { ...r, active: newStatus } : r))
    );

    try {
      const { error } = await supabase
        .from('routines')
        .update({ is_active: newStatus })
        .eq('id', id);

      if (error) throw error;
    } catch (err) {
      console.error('Error toggling routine:', err);
      setRoutines(current =>
        current.map(r => (r.id === id ? { ...r, active: !newStatus } : r))
      );
    }
  };

  const openRoutineDetails = (routine: Routine) => {
    setSelectedRoutine(routine);
  };

  const closeRoutineDetails = () => {
    Animated.timing(routinePanelTranslateX, {
      toValue: 900,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setSelectedRoutine(null);
      setIsDeletingRoutine(false);
      setIsEditingRoutine(false);
    });
  };

  const handleDeleteRoutine = async () => {
    if (!selectedRoutine) return;

    setIsDeletingRoutine(true);
    try {
      const { error } = await supabase
        .from('routines')
        .delete()
        .eq('id', selectedRoutine.id);

      if (error) throw error;

      setRoutines((current) => current.filter((item) => item.id !== selectedRoutine.id));
      routinesScreenCache.routines = routinesScreenCache.routines.filter((item) => item.id !== selectedRoutine.id);
      closeRoutineDetails();
    } catch (err: unknown) {
      console.error('Error deleting routine:', err);
      showFeedback(
        err instanceof Error ? err.message : 'Could not remove routine. Please try again.',
        'error',
      );
      setIsDeletingRoutine(false);
    }
  };

  const filteredRoutines = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    return routines.filter((r) => r.title.toLowerCase().includes(searchLower) || r.room.toLowerCase().includes(searchLower));
  }, [routines, searchQuery]);

  const searchSuggestions = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    if (normalizedQuery.length < 2) return [];

    const seen = new Set<string>();
    const suggestions: string[] = [];

    for (const routine of routines) {
      const candidates = [routine.title, routine.room];

      for (const candidate of candidates) {
        const value = candidate.trim();
        if (!value.toLowerCase().includes(normalizedQuery)) continue;
        if (seen.has(value.toLowerCase())) continue;
        seen.add(value.toLowerCase());
        suggestions.push(value);
        if (suggestions.length >= 5) return suggestions;
      }
    }

    return suggestions;
  }, [routines, searchQuery]);

  const toggleRoutineDay = (day: string) => {
    setNewRoutineDays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day],
    );
    setAddRoutineErrors((current) => ({ ...current, days: undefined }));
  };

  const openAddRoutineModal = () => {
    if (rooms.length === 0) {
      showFeedback('Create or sync a room first so we can attach this routine to your home.', 'error');
      return;
    }

    setNewRoutineName('');
    setNewRoutineTime('07:30');
    setNewRoutineDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    setNewRoutineImageKey(ROUTINE_IMAGE_OPTIONS[0].key);
    setNewRoutineRoomId(rooms[0]?.id ?? null);
    setAddRoutineErrors({});
    setHasSelectedRoutineImage(false);
    setIsAddRoutineModalVisible(true);
    routinePanelTranslateX.setValue(900);
    Animated.timing(routinePanelTranslateX, {
      toValue: 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  };

  const closeAddRoutineModal = () => {
    Animated.timing(routinePanelTranslateX, {
      toValue: 900,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      setIsAddRoutineModalVisible(false);
      setIsSavingRoutine(false);
    });
  };

  const handleCreateRoutine = async () => {
    const nextErrors: AddRoutineErrors = {};

    if (!newRoutineName.trim()) {
      nextErrors.name = 'Routine name is required.';
    }

    if (!newRoutineRoomId) {
      nextErrors.room = 'Room selection is required.';
    }

    if (newRoutineDays.length === 0) {
      nextErrors.days = 'Choose at least one day.';
    }

    if (!userHomeId) {
      showFeedback('We could not find your home right now.', 'error');
      return;
    }

    const executionTime = toDatabaseTime(newRoutineTime);
    if (!executionTime) {
      nextErrors.time = 'Use the HH:MM format, for example 07:30.';
    }

    if (Object.keys(nextErrors).length > 0) {
      setAddRoutineErrors(nextErrors);
      return;
    }

    setAddRoutineErrors({});
    setIsSavingRoutine(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('You must be logged in to create a routine.');

      const selectedRoom = rooms.find((room) => room.id === newRoutineRoomId);
      if (!selectedRoom) throw new Error('Selected room not found.');

      const { data: existingScenario, error: existingScenarioError } = await supabase
        .from('scenarios')
        .select('id')
        .eq('room_id', newRoutineRoomId)
        .order('id', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (existingScenarioError) throw existingScenarioError;

      let scenarioId = existingScenario?.id ?? null;

      if (!scenarioId) {
        const { data: createdScenario, error: createdScenarioError } = await supabase
          .from('scenarios')
          .insert({
            name: `${selectedRoom.name} Routine`,
            room_id: newRoutineRoomId,
          })
          .select('id')
          .single();

        if (createdScenarioError?.code === '42501') {
          throw new Error('The database still needs the new scenarios permission update. Run `supabase db push` and try again.');
        }

        if (createdScenarioError) throw createdScenarioError;
        scenarioId = createdScenario.id;
      }

      const orderedDays = DAY_OPTIONS.filter((day) => newRoutineDays.includes(day)).join(',');
      const routinePayload = {
        name: newRoutineName.trim(),
        execution_time: executionTime,
        days_of_week: orderedDays,
        is_active: true,
        scenario_id: scenarioId,
        home_id: userHomeId,
        user_id: user.id,
        image: newRoutineImageKey,
      };
      const legacyRoutinePayload = {
        name: newRoutineName.trim(),
        execution_time: executionTime,
        days_of_week: orderedDays,
        is_active: true,
        scenario_id: scenarioId,
        home_id: userHomeId,
        user_id: user.id,
      };
      const legacyScenarioRoutinePayload = {
        name: newRoutineName.trim(),
        execution_time: executionTime,
        days_of_week: orderedDays,
        is_active: true,
        scenario_idscenario: scenarioId,
        home_id: userHomeId,
        user_id: user.id,
        image: newRoutineImageKey,
      };
      const legacyScenarioRoutinePayloadNoImage = {
        name: newRoutineName.trim(),
        execution_time: executionTime,
        days_of_week: orderedDays,
        is_active: true,
        scenario_idscenario: scenarioId,
        home_id: userHomeId,
        user_id: user.id,
      };
      let usedLegacyScenarioColumn = false;

      let { data: createdRoutine, error: createdRoutineError } = await supabase
        .from('routines')
        .insert(routinePayload)
        .select('id, name, execution_time, days_of_week, is_active, image')
        .single();

      if (
        (createdRoutineError?.code === 'PGRST204' || createdRoutineError?.code === '42703') &&
        /scenario_id/i.test(createdRoutineError.message || '')
      ) {
        const legacyScenarioInsert = await supabase
          .from('routines')
          .insert(legacyScenarioRoutinePayload)
          .select('id, name, execution_time, days_of_week, is_active, image')
          .single();

        usedLegacyScenarioColumn = true;
        createdRoutine = legacyScenarioInsert.data as typeof createdRoutine;
        createdRoutineError = legacyScenarioInsert.error;
      }

      if (createdRoutineError?.code === '42703' && /image/i.test(createdRoutineError.message || '')) {
        const payloadWithoutImage =
          usedLegacyScenarioColumn
            ? legacyScenarioRoutinePayloadNoImage
            : legacyRoutinePayload;

        const legacyInsert = await supabase
          .from('routines')
          .insert(payloadWithoutImage)
          .select('id, name, execution_time, days_of_week, is_active')
          .single();

        createdRoutine = legacyInsert.data as typeof createdRoutine;
        createdRoutineError = legacyInsert.error;
      }

      if (createdRoutineError) throw createdRoutineError;
      if (!createdRoutine) throw new Error('Routine was not returned after creation.');
      const savedRoutine = createdRoutine;

      setRoutines((current) => [
        {
          id: savedRoutine.id,
          title: savedRoutine.name,
          days: savedRoutine.days_of_week || 'N/A',
          time: formatTime(savedRoutine.execution_time),
          room: selectedRoom.name,
          roomId: selectedRoom.id,
          scenarioId,
          active: savedRoutine.is_active,
          image: resolveRoutineImage(savedRoutine.image ?? newRoutineImageKey, savedRoutine.name),
          imageKey: savedRoutine.image ?? newRoutineImageKey,
        },
        ...current,
      ]);
      routinesScreenCache.routines = [
        {
          id: savedRoutine.id,
          title: savedRoutine.name,
          days: savedRoutine.days_of_week || 'N/A',
          time: formatTime(savedRoutine.execution_time),
          room: selectedRoom.name,
          roomId: selectedRoom.id,
          scenarioId,
          active: savedRoutine.is_active,
          image: resolveRoutineImage(savedRoutine.image ?? newRoutineImageKey, savedRoutine.name),
          imageKey: savedRoutine.image ?? newRoutineImageKey,
        },
        ...routinesScreenCache.routines,
      ];

      closeAddRoutineModal();
      showFeedback(`"${savedRoutine.name}" is now part of your routines.`, 'success');
    } catch (err: unknown) {
      console.error('Error creating routine:', err);
      captureException(err, {
        area: 'routines',
        screen: 'routines',
        action: 'create-routine',
      });
      showFeedback(
        err instanceof Error ? err.message : 'Could not create routine. Please try again.',
        'error',
      );
      setIsSavingRoutine(false);
      return;
    }

    trackEvent('routine-created', {
      area: 'routines',
      screen: 'routines',
      action: 'create-routine',
      metadata: {
        roomId: newRoutineRoomId,
        days: newRoutineDays,
        imageKey: newRoutineImageKey,
      },
    });
  };

  const beginEditingRoutine = () => {
    if (!selectedRoutine) return;

    setNewRoutineName(selectedRoutine.title);
    setNewRoutineTime(selectedRoutine.time.replace(' am', '').replace(' pm', ''));
    setNewRoutineDays(
      selectedRoutine.days === 'N/A'
        ? []
        : selectedRoutine.days.split(',').map((day) => day.trim()).filter(Boolean),
    );
    setNewRoutineRoomId(selectedRoutine.roomId ?? rooms.find((room) => room.name === selectedRoutine.room)?.id ?? null);
    setNewRoutineImageKey(selectedRoutine.imageKey ?? ROUTINE_IMAGE_OPTIONS[0].key);
    setIsEditingRoutine(true);
  };

  const handleUpdateRoutine = async () => {
    if (!selectedRoutine) return;
    if (!newRoutineName.trim()) {
      showFeedback('Give your routine a name first.', 'error');
      return;
    }
    if (!newRoutineRoomId) {
      showFeedback('Choose the room for this routine.', 'error');
      return;
    }
    if (newRoutineDays.length === 0) {
      showFeedback('Choose at least one day for this routine.', 'error');
      return;
    }

    const executionTime = toDatabaseTime(newRoutineTime);
    if (!executionTime) {
      showFeedback('Use the HH:MM format, for example 07:30.', 'error');
      return;
    }

    setIsSavingRoutine(true);
    try {
      const selectedRoom = rooms.find((room) => room.id === newRoutineRoomId);
      if (!selectedRoom) throw new Error('Selected room not found.');

      if (selectedRoutine.scenarioId && selectedRoutine.roomId !== selectedRoom.id) {
        const { error: scenarioUpdateError } = await supabase
          .from('scenarios')
          .update({ room_id: selectedRoom.id })
          .eq('id', selectedRoutine.scenarioId);

        if (scenarioUpdateError) throw scenarioUpdateError;
      }

      const orderedDays = DAY_OPTIONS.filter((day) => newRoutineDays.includes(day)).join(',');
      const { data: updatedRoutine, error } = await supabase
        .from('routines')
        .update({
          name: newRoutineName.trim(),
          execution_time: executionTime,
          days_of_week: orderedDays,
          image: newRoutineImageKey,
        })
        .eq('id', selectedRoutine.id)
        .select('id, name, execution_time, days_of_week, is_active, image')
        .single();

      if (error) throw error;
      if (!updatedRoutine) throw new Error('Routine was not returned after update.');

      const nextRoutine: Routine = {
        id: updatedRoutine.id,
        title: updatedRoutine.name,
        days: updatedRoutine.days_of_week || 'N/A',
        time: formatTime(updatedRoutine.execution_time),
        room: selectedRoom.name,
        roomId: selectedRoom.id,
        scenarioId: selectedRoutine.scenarioId ?? null,
        active: updatedRoutine.is_active,
        image: resolveRoutineImage(updatedRoutine.image ?? newRoutineImageKey, updatedRoutine.name),
        imageKey: updatedRoutine.image ?? newRoutineImageKey,
      };

      setRoutines((current) => current.map((item) => (item.id === nextRoutine.id ? nextRoutine : item)));
      routinesScreenCache.routines = routinesScreenCache.routines.map((item) => (item.id === nextRoutine.id ? nextRoutine : item));
      setSelectedRoutine(nextRoutine);
      setIsEditingRoutine(false);
      showFeedback(`"${updatedRoutine.name}" was updated.`, 'success');
    } catch (err: unknown) {
      console.error('Error updating routine:', err);
      showFeedback(
        err instanceof Error ? err.message : 'Could not update routine. Please try again.',
        'error',
      );
    } finally {
      setIsSavingRoutine(false);
    }
  };

  const getRoutineMood = (routine: Routine | null) => {
    const key = routine?.imageKey ?? '';
    if (key.includes('sleep')) return 'Slow lights, calm sounds and wind-down activities fit this routine best.';
    if (key.includes('gym')) return 'Energetic scenes, movement prompts and upbeat activities work well here.';
    if (key.includes('kitchen')) return 'Cooking, breakfast prep and family-start moments match this routine.';
    if (key.includes('weekend')) return 'Soft starts, comfort scenes and relaxed home activities suit this one.';
    return 'Gentle automation, focus moments and welcoming home actions fit this routine.';
  };

  React.useEffect(() => {
    if (selectedRoutine) {
      routinePanelTranslateX.setValue(900);
      Animated.timing(routinePanelTranslateX, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedRoutine, routinePanelTranslateX]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      if (hasMore && !loadingMore && !loading) {
        loadRoutines(true);
      }
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F1F3EA]" edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <View className="items-center mt-2 mb-6 px-4">
        <Text 
          className="text-3xl text-[#354F52]" 
          style={{ fontFamily: 'Nunito_600SemiBold' }}
          maxFontSizeMultiplier={1.3}
        >Routines</Text>
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

      <View className="px-5 mb-6">
        <View className="flex-row items-center border border-[#BDC7C2] rounded-full px-4 min-h-[48px]">
          <MaterialIcons name="search" size={22} color="#7A8C85" style={{ marginRight: 10 }} />
          <TextInput
            testID="search-input"
            placeholder="Search routines..."
            placeholderTextColor="#7A8C85"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-base text-[#2C3A35]"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
            maxFontSizeMultiplier={1.3}
            accessible={true}
            accessibilityLabel="Search routines"
            accessibilityHint="Type to search for a specific routine"
            accessibilityRole="search"
            autoCorrect={false}
            autoCapitalize="none"
          />
          <SearchAutocomplete
            suggestions={searchSuggestions}
            query={searchQuery}
            onSelect={setSearchQuery}
          />
        </View>
      </View>

      {loading && !loadingMore ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#548F53" />
        </View>
      ) : (
        <FlatList
          data={filteredRoutines}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <RoutineCard
              testID={`routine-card-${item.id}`}
              title={item.title}
              days={item.days}
              time={item.time}
              room={item.room}
              isActive={item.active}
              image={item.image}
              onPress={() => openRoutineDetails(item)}
              onToggle={() => toggleRoutine(item.id)}
              onLongPress={() => openRoutineDetails(item)}
            />
          )}
          onScroll={handleScroll}
          scrollEventThrottle={16}
          testID="routines-scrollview"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 130 }}
          showsVerticalScrollIndicator={false}
          initialNumToRender={6}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          ListHeaderComponent={
            <Text
              className="text-[#6B7C76] text-sm mb-4"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
            >
              Search filters the routines already loaded from your home. Long press a card to open its details.
            </Text>
          }
          ListEmptyComponent={
            !loading ? (
              <FeedbackState
                icon={searchQuery ? 'search' : 'autorenew'}
                title={searchQuery ? 'No routines match this search' : 'No routines yet'}
                message={
                  searchQuery
                    ? 'Try a different room or routine name to find what you are looking for.'
                    : rooms.length === 0
                      ? 'Create or sync a room first, then build routines around the spaces in your home.'
                      : 'Create your first routine to automate the atmosphere you want at the right time.'
                }
                compact
              />
            ) : null
          }
          ListFooterComponent={
            loadingMore ? (
              <View className="py-4 items-center">
                <ActivityIndicator color="#548F53" />
              </View>
            ) : null
          }
        />
      )}

      <View testID="add-routine-container">
        <AddRoomDevice actions={[{ label: 'Routine', onPress: openAddRoutineModal }]} />
      </View>

      <Modal
        visible={isAddRoutineModalVisible}
        transparent={true}
        animationType="none"
        onRequestClose={closeAddRoutineModal}
      >
        <View className="flex-1 bg-black/35">
          <Animated.View
            className="absolute inset-0 bg-[#F6F8F2] shadow-2xl"
            style={{ transform: [{ translateX: routinePanelTranslateX }] }}
          >
            <KeyboardAvoidingView
              className="flex-1"
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
            >
              <ScrollView
                className="flex-1"
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 20, paddingTop: 52, paddingBottom: 0 }}
              >
                <View className="flex-row items-center justify-between mb-2">
                  <Text
                    className="text-[26px] text-[#354F52]"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    Add Routine
                  </Text>
                  <TouchableOpacity onPress={closeAddRoutineModal} hitSlop={12}>
                    <MaterialIcons name="close" size={24} color="#7A8C85" />
                  </TouchableOpacity>
                </View>

                <Text
                  className="text-[#6B7C76] text-sm mb-4"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  Save a routine for your home so everyone in the house can see and use it.
                </Text>

                <Text className="text-[#354F52] text-sm mb-1.5" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                  Routine Name
                </Text>
                <TextInput
                  placeholder="e.g. Morning Kitchen Prep"
                  placeholderTextColor="#6B7C76"
                  value={newRoutineName}
                  onChangeText={(value) => {
                    setNewRoutineName(value);
                    setAddRoutineErrors((current) => ({ ...current, name: undefined }));
                  }}
                  className={`bg-white border rounded-2xl px-4 py-3 text-base text-[#2C3A35] ${
                    addRoutineErrors.name ? 'border-[#D7655C]' : 'border-[#BDC7C2]'
                  }`}
                  style={{ fontFamily: 'Nunito_700Bold', color: '#1F2A24' }}
                  selectionColor="#548F53"
                />
                {addRoutineErrors.name ? (
                  <Text className="text-[#D7655C] text-xs mt-1.5 mb-4" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                    {addRoutineErrors.name}
                  </Text>
                ) : (
                  <Text className="text-[#6B7C76] text-xs mt-1.5 mb-4" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                    Required field.
                  </Text>
                )}

                <Text className="text-[#354F52] text-sm mb-2" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                  Cover Image
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ paddingBottom: 6 }}
                >
                  {ROUTINE_IMAGE_OPTIONS.map((option) => {
                    const isSelected = newRoutineImageKey === option.key;

                    return (
                      <TouchableOpacity
                        key={option.key}
                        onPress={() => {
                          setNewRoutineImageKey(option.key);
                          setHasSelectedRoutineImage(true);
                        }}
                        className="mr-2.5 w-[88px]"
                      >
                        <View
                          className={`rounded-[18px] overflow-hidden border-2 ${
                            isSelected ? 'border-[#548F53]' : 'border-[#D8DFD5]'
                          }`}
                        >
                          <View className="relative">
                            <Image source={option.source} className="w-full h-[64px]" resizeMode="cover" />
                            {!isSelected && hasSelectedRoutineImage ? (
                              <View className="absolute inset-0 bg-[#1F2A24]/35" />
                            ) : null}
                          </View>
                        </View>
                        <Text
                          className={`mt-2 text-center text-xs ${isSelected ? 'text-[#354F52]' : 'text-[#6B7C76]'}`}
                          style={{ fontFamily: isSelected ? 'Nunito_700Bold' : 'Nunito_600SemiBold' }}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>

                <Text className="text-[#354F52] text-sm mb-1.5 mt-3" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                  Time
                </Text>
                <TextInput
                  placeholder="07:30"
                  placeholderTextColor="#6B7C76"
                  value={newRoutineTime}
                  onChangeText={(value) => {
                    setNewRoutineTime(normalizeTimeInput(value));
                    setAddRoutineErrors((current) => ({ ...current, time: undefined }));
                  }}
                  keyboardType="number-pad"
                  maxLength={5}
                  className={`bg-white border rounded-2xl px-4 py-3 text-base text-[#2C3A35] ${
                    addRoutineErrors.time ? 'border-[#D7655C]' : 'border-[#BDC7C2]'
                  }`}
                  style={{ fontFamily: 'Nunito_700Bold', color: '#1F2A24' }}
                  selectionColor="#548F53"
                />
                {addRoutineErrors.time ? (
                  <Text className="text-[#D7655C] text-xs mt-1.5 mb-4" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                    {addRoutineErrors.time}
                  </Text>
                ) : (
                  <Text className="text-[#6B7C76] text-xs mt-1.5 mb-4" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                    Required field. Format: HH:MM.
                  </Text>
                )}

                <Text className="text-[#354F52] text-sm mb-2" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                  Days
                </Text>
                <View className="flex-row flex-wrap">
                  {DAY_OPTIONS.map((day) => {
                    const isSelected = newRoutineDays.includes(day);

                    return (
                      <TouchableOpacity
                        key={day}
                        onPress={() => toggleRoutineDay(day)}
                        className={`mr-2 mb-2 px-3 py-2.5 rounded-2xl border ${
                          isSelected ? 'bg-[#BBE6BA] border-transparent' : 'bg-transparent border-[#BDC7C2]'
                        }`}
                      >
                        <Text
                          className="text-[#354F52] font-bold"
                          style={{ fontFamily: 'Nunito_700Bold' }}
                        >
                          {day}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {addRoutineErrors.days ? (
                  <Text className="text-[#D7655C] text-xs mt-1.5 mb-4" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                    {addRoutineErrors.days}
                  </Text>
                ) : (
                  <Text className="text-[#6B7C76] text-xs mt-1.5 mb-4" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                    Required field. Select at least one day.
                  </Text>
                )}

                <Text className="text-[#354F52] text-sm mb-2" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                  Room
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                  contentContainerStyle={{ paddingBottom: 6 }}
                >
                  {rooms.map((room) => {
                    const isSelected = newRoutineRoomId === room.id;

                    return (
                      <TouchableOpacity
                      key={room.id}
                      onPress={() => {
                        setNewRoutineRoomId(room.id);
                        setAddRoutineErrors((current) => ({ ...current, room: undefined }));
                      }}
                      className={`mr-2.5 px-3 py-2.5 rounded-2xl border ${
                        isSelected
                          ? 'bg-[#BBE6BA] border-transparent'
                          : addRoutineErrors.room
                            ? 'bg-transparent border-[#D7655C]'
                            : 'bg-transparent border-[#BDC7C2]'
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
                {addRoutineErrors.room ? (
                  <Text className="text-[#D7655C] text-xs mt-1.5 mb-2" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                    {addRoutineErrors.room}
                  </Text>
                ) : (
                  <Text className="text-[#6B7C76] text-xs mt-1.5 mb-2" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                    Required field.
                  </Text>
                )}

                <View className="flex-row justify-between mt-0">
                  <TouchableOpacity
                    onPress={closeAddRoutineModal}
                    className="w-[48%] py-3.5 bg-[#E9EEE5] rounded-full items-center"
                  >
                    <Text className="text-[#354F52] text-base font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                      Cancel
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleCreateRoutine}
                    disabled={isSavingRoutine}
                    className="w-[48%] py-3.5 bg-[#548F53] rounded-full items-center flex-row justify-center"
                  >
                    {isSavingRoutine ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text className="text-white text-base font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                        Save Routine
                      </Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </Animated.View>
        </View>
      </Modal>

      <Modal
        visible={selectedRoutine !== null}
        transparent={true}
        animationType="none"
        onRequestClose={closeRoutineDetails}
      >
        <View className="flex-1 bg-black/35">
          <Animated.View
            className="absolute inset-0 bg-[#F6F8F2] shadow-2xl"
            style={{ transform: [{ translateX: routinePanelTranslateX }] }}
          >
            <View className="relative">
              <Image
                source={selectedRoutine?.image ?? DEFAULT_IMAGE}
                className="w-full h-[280px]"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-black/30" />
              <TouchableOpacity
                onPress={closeRoutineDetails}
                className="absolute top-5 left-5"
                hitSlop={8}
              >
                <Ionicons name="chevron-back" size={28} color="white" />
              </TouchableOpacity>
              <View className="absolute left-5 right-5 bottom-5">
                <Text
                  className="text-white text-[28px] mb-2"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  {selectedRoutine?.title}
                </Text>
                <View className="flex-row flex-wrap">
                  <View className="mr-2 mb-2 px-3 py-2 rounded-full bg-white/20">
                    <Text className="text-white text-xs" style={{ fontFamily: 'Nunito_700Bold' }}>
                      {selectedRoutine?.time}
                    </Text>
                  </View>
                  <View className="mr-2 mb-2 px-3 py-2 rounded-full bg-white/20">
                    <Text className="text-white text-xs" style={{ fontFamily: 'Nunito_700Bold' }}>
                      {selectedRoutine?.room}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            <ScrollView className="flex-1" contentContainerStyle={{ padding: 24, paddingBottom: 36 }} showsVerticalScrollIndicator={false}>
              {!isEditingRoutine ? (
                <>
                  <Text
                    className="text-[#354F52] text-lg mb-1"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    Routine Overview
                  </Text>
                  <Text
                    className="text-[#6B7C76] text-sm mb-5"
                    style={{ fontFamily: 'Nunito_600SemiBold' }}
                  >
                    Runs on {selectedRoutine?.days || 'N/A'} and is shared with your home.
                  </Text>

                  <View className="rounded-[26px] bg-white p-4 mb-4 border border-[#E0E7DD]">
                    <View className="flex-row items-center mb-3">
                      <MaterialIcons name="event-repeat" size={18} color="#548F53" />
                      <Text className="ml-3 text-[#354F52] text-sm" style={{ fontFamily: 'Nunito_700Bold' }}>
                        {selectedRoutine?.days || 'N/A'}
                      </Text>
                    </View>
                    <View className="flex-row items-center mb-3">
                      <MaterialIcons name="schedule" size={18} color="#548F53" />
                      <Text className="ml-3 text-[#354F52] text-sm" style={{ fontFamily: 'Nunito_700Bold' }}>
                        {selectedRoutine?.time}
                      </Text>
                    </View>
                    <View className="flex-row items-center">
                      <MaterialIcons name="meeting-room" size={18} color="#548F53" />
                      <Text className="ml-3 text-[#354F52] text-sm" style={{ fontFamily: 'Nunito_700Bold' }}>
                        {selectedRoutine?.room}
                      </Text>
                    </View>
                  </View>

                  <View className="rounded-[26px] bg-[#EEF5E8] p-4 mb-5 border border-[#D7E6D2]">
                    <Text className="text-[#3C5642] text-sm mb-2" style={{ fontFamily: 'Nunito_700Bold' }}>
                      Inspired activities
                    </Text>
                    <Text className="text-[#5E7167] text-sm" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                      {getRoutineMood(selectedRoutine)}
                    </Text>
                  </View>

                  <View className="flex-row justify-between mb-3">
                    <TouchableOpacity
                      onPress={beginEditingRoutine}
                      className="w-[48%] py-4 bg-[#548F53] rounded-full items-center"
                    >
                      <Text className="text-white text-base font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                        Edit Routine
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={closeRoutineDetails}
                      className="w-[48%] py-4 bg-[#E9EEE5] rounded-full items-center"
                    >
                      <Text className="text-[#354F52] text-base font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                        Close
                      </Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    onPress={handleDeleteRoutine}
                    disabled={isDeletingRoutine}
                    className="py-4 bg-[#D7655C] rounded-full items-center flex-row justify-center"
                  >
                    {isDeletingRoutine ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <MaterialIcons name="delete-outline" size={18} color="white" />
                        <Text className="text-white text-base font-bold ml-2" style={{ fontFamily: 'Nunito_700Bold' }}>
                          Remove Routine
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View className="flex-row items-center justify-between mb-2">
                    <Text
                      className="text-[26px] text-[#354F52]"
                      style={{ fontFamily: 'Nunito_700Bold' }}
                    >
                      Edit Routine
                    </Text>
                    <TouchableOpacity onPress={() => setIsEditingRoutine(false)} hitSlop={12}>
                      <MaterialIcons name="arrow-forward" size={22} color="#7A8C85" />
                    </TouchableOpacity>
                  </View>

                  <Text
                    className="text-[#6B7C76] text-sm mb-5"
                    style={{ fontFamily: 'Nunito_600SemiBold' }}
                  >
                    Update the timing, room and feel of this routine.
                  </Text>

                  <Text className="text-[#354F52] text-sm mb-2" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                    Routine Name
                  </Text>
                  <TextInput
                    placeholder="e.g. Morning Kitchen Prep"
                    placeholderTextColor="#6B7C76"
                    value={newRoutineName}
                    onChangeText={setNewRoutineName}
                    className="bg-white border border-[#BDC7C2] rounded-2xl px-4 py-4 text-base text-[#2C3A35] mb-5"
                    style={{ fontFamily: 'Nunito_700Bold', color: '#1F2A24' }}
                    selectionColor="#548F53"
                  />

                  <Text className="text-[#354F52] text-sm mb-3" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                    Cover Image
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
                    {ROUTINE_IMAGE_OPTIONS.map((option) => {
                      const isSelected = newRoutineImageKey === option.key;
                      return (
                        <TouchableOpacity
                          key={option.key}
                          onPress={() => setNewRoutineImageKey(option.key)}
                          className="mr-3 w-[104px]"
                        >
                          <View
                            className={`rounded-[22px] overflow-hidden border-2 ${
                              isSelected ? 'border-[#548F53]' : 'border-[#D8DFD5]'
                            }`}
                          >
                            <Image source={option.source} className="w-full h-[78px]" resizeMode="cover" />
                          </View>
                          <Text
                            className={`mt-2 text-center text-xs ${isSelected ? 'text-[#354F52]' : 'text-[#6B7C76]'}`}
                            style={{ fontFamily: isSelected ? 'Nunito_700Bold' : 'Nunito_600SemiBold' }}
                          >
                            {option.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <Text className="text-[#354F52] text-sm mb-2 mt-2" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                    Time
                  </Text>
                  <TextInput
                    placeholder="07:30"
                    placeholderTextColor="#6B7C76"
                    value={newRoutineTime}
                    onChangeText={(value) => setNewRoutineTime(normalizeTimeInput(value))}
                    keyboardType="number-pad"
                    maxLength={5}
                    className="bg-white border border-[#BDC7C2] rounded-2xl px-4 py-4 text-base text-[#2C3A35] mb-5"
                    style={{ fontFamily: 'Nunito_700Bold', color: '#1F2A24' }}
                    selectionColor="#548F53"
                  />

                  <Text className="text-[#354F52] text-sm mb-3" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                    Days
                  </Text>
                  <View className="flex-row flex-wrap mb-5">
                    {DAY_OPTIONS.map((day) => {
                      const isSelected = newRoutineDays.includes(day);
                      return (
                        <TouchableOpacity
                          key={day}
                          onPress={() => toggleRoutineDay(day)}
                          className={`mr-3 mb-3 px-4 py-3 rounded-2xl border ${
                            isSelected ? 'bg-[#BBE6BA] border-transparent' : 'bg-transparent border-[#BDC7C2]'
                          }`}
                        >
                          <Text className="text-[#354F52] font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <Text className="text-[#354F52] text-sm mb-3" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                    Room
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 8 }}>
                    {rooms.map((room) => {
                      const isSelected = newRoutineRoomId === room.id;
                      return (
                        <TouchableOpacity
                          key={room.id}
                          onPress={() => setNewRoutineRoomId(room.id)}
                          className={`mr-3 px-4 py-3 rounded-2xl border ${
                            isSelected ? 'bg-[#BBE6BA] border-transparent' : 'bg-transparent border-[#BDC7C2]'
                          }`}
                        >
                          <Text className="text-[#354F52] font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                            {room.name}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>

                  <View className="flex-row justify-between mt-5">
                    <TouchableOpacity
                      onPress={() => setIsEditingRoutine(false)}
                      className="w-[48%] py-4 bg-[#E9EEE5] rounded-full items-center"
                    >
                      <Text className="text-[#354F52] text-base font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleUpdateRoutine}
                      disabled={isSavingRoutine}
                      className="w-[48%] py-4 bg-[#548F53] rounded-full items-center flex-row justify-center"
                    >
                      {isSavingRoutine ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text className="text-white text-base font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                          Save Changes
                        </Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </SafeAreaView>
  );
} 
