import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useMemo, useCallback } from 'react'; 
import {
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
  Alert,
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

interface Routine {
  id: number;
  title: string;
  days: string;
  time: string;
  room: string;
  active: boolean;
  image: ImageSourcePropType;
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

export default function Routines() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const PAGE_SIZE = 10;
  const [searchQuery, setSearchQuery] = useState('');
  const [userHomeId, setUserHomeId] = useState<number | null>(null);
  const [isAddRoutineModalVisible, setIsAddRoutineModalVisible] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineTime, setNewRoutineTime] = useState('07:30');
  const [newRoutineRoomId, setNewRoutineRoomId] = useState<number | null>(null);
  const [newRoutineDays, setNewRoutineDays] = useState<string[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
  const [newRoutineImageKey, setNewRoutineImageKey] = useState<string>(ROUTINE_IMAGE_OPTIONS[0].key);
  const [isSavingRoutine, setIsSavingRoutine] = useState(false);
  const [selectedRoutine, setSelectedRoutine] = useState<Routine | null>(null);
  const [isDeletingRoutine, setIsDeletingRoutine] = useState(false);

  const loadRoutines = useCallback(async (isNextPage = false) => {
    try {
      if (isNextPage) {
        if (loadingMore || !hasMore) return;
        setLoadingMore(true);
      } else {
        setLoading(!hasLoadedOnce);
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
        return;
      }

      const homeId = userHome.home_id;
      setUserHomeId(homeId);

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
      setNewRoutineRoomId((current) => current ?? loadedRooms[0]?.id ?? null);
      setLoadError(null);

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
          active: item.is_active,
          image: resolveRoutineImage(item.image, item.name),
        }));

        if (isNextPage) {
          setRoutines(current => [...current, ...mappedRoutines]);
        } else {
          setRoutines(mappedRoutines);
        }

        setPage(currentPage);
        if (count !== null) {
          setHasMore(start + mappedRoutines.length < count);
        }
      }
    } catch (err) {
      console.error('Error loading routines:', err);
      setLoadError('We could not load your routines right now. Try again in a moment.');
    } finally {
      setHasLoadedOnce(true);
      setLoading(false);
      setLoadingMore(false);
    }
  }, [hasLoadedOnce, page, hasMore, loadingMore]);

  useFocusEffect(
    useCallback(() => {
      loadRoutines();
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
    setSelectedRoutine(null);
    setIsDeletingRoutine(false);
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
      closeRoutineDetails();
    } catch (err: unknown) {
      console.error('Error deleting routine:', err);
      Alert.alert(
        'Could not remove routine',
        err instanceof Error ? err.message : 'Please try again.',
      );
      setIsDeletingRoutine(false);
    }
  };

  const filteredRoutines = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    return routines.filter((r) => r.title.toLowerCase().includes(searchLower) || r.room.toLowerCase().includes(searchLower));
  }, [routines, searchQuery]);

  const toggleRoutineDay = (day: string) => {
    setNewRoutineDays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day],
    );
  };

  const openAddRoutineModal = () => {
    if (rooms.length === 0) {
      Alert.alert('No rooms yet', 'Create or sync a room first so we can attach this routine to your home.');
      return;
    }

    setNewRoutineName('');
    setNewRoutineTime('07:30');
    setNewRoutineDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    setNewRoutineImageKey(ROUTINE_IMAGE_OPTIONS[0].key);
    setNewRoutineRoomId(rooms[0]?.id ?? null);
    setIsAddRoutineModalVisible(true);
  };

  const closeAddRoutineModal = () => {
    setIsAddRoutineModalVisible(false);
    setIsSavingRoutine(false);
  };

  const handleCreateRoutine = async () => {
    if (!newRoutineName.trim()) {
      Alert.alert('Missing name', 'Give your routine a name first.');
      return;
    }

    if (!newRoutineRoomId) {
      Alert.alert('Missing room', 'Choose the room for this routine.');
      return;
    }

    if (newRoutineDays.length === 0) {
      Alert.alert('Missing days', 'Choose at least one day for this routine.');
      return;
    }

    if (!userHomeId) {
      Alert.alert('Missing home', 'We could not find your home right now.');
      return;
    }

    const executionTime = toDatabaseTime(newRoutineTime);
    if (!executionTime) {
      Alert.alert('Invalid time', 'Use the HH:MM format, for example 07:30.');
      return;
    }

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
          active: savedRoutine.is_active,
          image: resolveRoutineImage(savedRoutine.image ?? newRoutineImageKey, savedRoutine.name),
        },
        ...current,
      ]);

      closeAddRoutineModal();
    } catch (err: unknown) {
      console.error('Error creating routine:', err);
      captureException(err, {
        area: 'routines',
        screen: 'routines',
        action: 'create-routine',
      });
      Alert.alert(
        'Could not create routine',
        err instanceof Error ? err.message : 'Please try again.',
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
        animationType="slide"
        onRequestClose={closeAddRoutineModal}
      >
        <KeyboardAvoidingView
          className="flex-1 bg-black/40 px-5 pt-14 pb-6"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
          <View className="bg-white rounded-[34px] px-6 pt-5 pb-6 max-h-[82%] shadow-xl">
            <View className="items-center mb-4">
              <View className="w-12 h-1.5 rounded-full bg-[#D7DED6]" />
            </View>

            <ScrollView
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 16 }}
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
                className="text-[#6B7C76] text-sm mb-5"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                Save a routine for your home so everyone in the house can see and use it.
              </Text>

              <Text className="text-[#354F52] text-sm mb-2" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                Routine Name
              </Text>
              <TextInput
                placeholder="e.g. Morning Kitchen Prep"
                placeholderTextColor="#6B7C76"
                value={newRoutineName}
                onChangeText={setNewRoutineName}
                className="bg-[#F1F3EA] border border-[#BDC7C2] rounded-2xl px-4 py-4 text-base text-[#2C3A35] mb-5"
                style={{ fontFamily: 'Nunito_700Bold', color: '#1F2A24' }}
                selectionColor="#548F53"
              />

              <Text className="text-[#354F52] text-sm mb-3" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                Cover Image
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 8 }}
              >
                {ROUTINE_IMAGE_OPTIONS.map((option) => {
                  const isSelected = newRoutineImageKey === option.key;

                  return (
                    <TouchableOpacity
                      key={option.key}
                      onPress={() => setNewRoutineImageKey(option.key)}
                      className="mr-3 w-[116px]"
                    >
                      <View
                        className={`rounded-[24px] overflow-hidden border-2 ${
                          isSelected ? 'border-[#548F53]' : 'border-[#D8DFD5]'
                        }`}
                      >
                        <Image source={option.source} className="w-full h-[82px]" resizeMode="cover" />
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

              <Text className="text-[#354F52] text-sm mb-2" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                Time
              </Text>
              <TextInput
                placeholder="07:30"
                placeholderTextColor="#6B7C76"
                value={newRoutineTime}
                onChangeText={(value) => setNewRoutineTime(normalizeTimeInput(value))}
                keyboardType="number-pad"
                maxLength={5}
                className="bg-[#F1F3EA] border border-[#BDC7C2] rounded-2xl px-4 py-4 text-base text-[#2C3A35] mb-5"
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

              <Text className="text-[#354F52] text-sm mb-3" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                Room
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 8 }}
              >
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
            </ScrollView>

            <View className="flex-row justify-between mt-4">
              <TouchableOpacity
                onPress={closeAddRoutineModal}
                className="w-[48%] py-4 bg-[#F1F3EA] rounded-full items-center"
              >
                <Text className="text-[#354F52] text-base font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                  Cancel
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleCreateRoutine}
                disabled={isSavingRoutine}
                className="w-[48%] py-4 bg-[#548F53] rounded-full items-center flex-row justify-center"
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
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal
        visible={selectedRoutine !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={closeRoutineDetails}
      >
        <View className="flex-1 justify-center bg-black/45 px-5">
          <View className="bg-white rounded-[34px] overflow-hidden shadow-xl">
            <View className="relative">
              <Image
                source={selectedRoutine?.image ?? DEFAULT_IMAGE}
                className="w-full h-[190px]"
                resizeMode="cover"
              />
              <View className="absolute inset-0 bg-black/25" />
              <TouchableOpacity
                onPress={closeRoutineDetails}
                className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/90 items-center justify-center"
                hitSlop={8}
              >
                <MaterialIcons name="close" size={22} color="#354F52" />
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

            <View className="px-6 pt-5 pb-6">
              <Text
                className="text-[#354F52] text-lg mb-1"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                Routine Details
              </Text>
              <Text
                className="text-[#6B7C76] text-sm mb-5"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                Runs on {selectedRoutine?.days || 'N/A'} and is shared with your home.
              </Text>

              <View className="rounded-[26px] bg-[#F4F7F1] p-4 mb-5 border border-[#E0E7DD]">
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

              <View className="flex-row justify-between">
                <TouchableOpacity
                  onPress={closeRoutineDetails}
                  className="w-[38%] py-4 bg-[#F1F3EA] rounded-full items-center"
                >
                  <Text className="text-[#354F52] text-base font-bold" style={{ fontFamily: 'Nunito_700Bold' }}>
                    Close
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleDeleteRoutine}
                  disabled={isDeletingRoutine}
                  className="w-[58%] py-4 bg-[#D7655C] rounded-full items-center flex-row justify-center"
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
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
} 
