import { ScenarioReviewCard } from '@/components/newActivityFlow/ScenarioReviewCard';
import { FlowHeader } from '@/components/newActivityFlow/FlowHeader';
import { ReviewCard } from '@/components/newActivityFlow/ReviewCard';
import { SelectionCard } from '@/components/newActivityFlow/SelectionCard';
import { Step5_Details } from '@/components/newActivityFlow/steps/Step5_Details';
import { StepWrapper } from '@/components/newActivityFlow/StepWrapper';
import SpotifyPlaylistSelector from '@/components/UI/SpotifyPlaylistSelector';
import { resolveCatalogImage } from '@/constants/data/catalogAssets';
import { ROOMS } from '@/constants/data/rooms';
import { useNotifications } from '@/context/NotificationsContext';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  ImageSourcePropType,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';

import { captureException, trackEvent } from '@/utils/observability';
import { ensureDefaultHomeRooms } from '@/utils/homeSetup';
import { supabase, uploadImage } from '@/utils/supabase';

type RoomRow = {
  id: number;
  name: string;
};

type PlaylistItem = {
  id: string;
  name: string;
};

const SCENARIO_DEFAULT_IMAGES: Record<string, string> = {
  bedroom: 'Scenarios/lavender_dream.png',
  kitchen: 'Scenarios/slow_cooking.png',
  'living room': 'Scenarios/moonlight_bay.png',
  bathroom: 'Scenarios/rose_garden.png',
};

const TOTAL_STEPS = 4;

const getRoomIcon = (roomName: string) => {
  const fallback = ROOMS.find((room) => room.name.toLowerCase() === roomName.toLowerCase());
  if (fallback) return fallback.icon;

  const normalized = roomName.toLowerCase();
  if (normalized.includes('bed')) return 'bed';
  if (normalized.includes('kitchen') || normalized.includes('cook')) return 'restaurant';
  if (normalized.includes('living') || normalized.includes('lounge')) return 'weekend';
  if (normalized.includes('bath')) return 'bathtub';
  if (normalized.includes('office') || normalized.includes('desk')) return 'computer';
  return 'room';
};

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

function NewScenarioContent() {
  const [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Nunito_600SemiBold,
    Nunito_400Regular,
  });

  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const previousDefaultImageRef = useRef<string | ImageSourcePropType | null>(null);

  const { addNotification } = useNotifications();

  const [step, setStep] = useState(1);
  const [rooms, setRooms] = useState<RoomRow[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState('');
  const [selectedPlaylistName, setSelectedPlaylistName] = useState('');
  const [scenarioName, setScenarioName] = useState('');
  const [description, setDescription] = useState('');
  const [scenarioImage, setScenarioImage] = useState<string | ImageSourcePropType | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const selectedRoom = useMemo(
    () => rooms.find((room) => room.id === selectedRoomId) ?? null,
    [rooms, selectedRoomId],
  );

  const defaultScenarioImage = useMemo(
    () => getDefaultScenarioImage(selectedRoom?.name ?? null),
    [selectedRoom?.name],
  );

  useEffect(() => {
    const previousDefault = previousDefaultImageRef.current;
    const shouldAdoptNewDefault =
      !scenarioImage || scenarioImage === previousDefault;

    if (shouldAdoptNewDefault) {
      setScenarioImage(defaultScenarioImage);
    }

    previousDefaultImageRef.current = defaultScenarioImage;
  }, [defaultScenarioImage, scenarioImage]);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`Step ${step} of ${TOTAL_STEPS}`);
  }, [step]);

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
          setLoadError('Connect this profile to a home before creating scenarios.');
          return;
        }

        const { data: roomRows, error: roomsError } = await supabase
          .from('rooms')
          .select('id, name')
          .eq('home_id', userHome.home_id)
          .order('id', { ascending: true });

        if (roomsError) throw roomsError;

        let safeRooms = roomRows ?? [];
        if (safeRooms.length === 0) {
          safeRooms = await ensureDefaultHomeRooms(userHome.home_id);
        }
        setRooms(safeRooms);
        setSelectedRoomId((current) => current ?? safeRooms[0]?.id ?? null);
        setLoadError(safeRooms.length === 0 ? 'Create at least one room before creating a scenario.' : null);
      } catch (error) {
        console.error('Failed to load rooms for scenario creation:', error);
        setLoadError('We could not load your home rooms right now.');
      }
    };

    loadRooms();
  }, []);

  const nextStep = () => {
    if (step < TOTAL_STEPS) setStep((current) => current + 1);
  };

  const prevStep = () => {
    if (step > 1) {
      setStep((current) => current - 1);
      return;
    }
    router.back();
  };

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

      const basePayload = {
        name: scenarioName.trim(),
        room_id: selectedRoomId,
        playlist_id: selectedPlaylistId || null,
      };

      const fullPayload = {
        ...basePayload,
        description: description.trim(),
        playlist_name: selectedPlaylistName || null,
        image: persistedImage,
        focus_mode_enabled: focusMode,
        shortcuts: false,
      };

      let insertResult = await supabase
        .from('scenarios')
        .insert(fullPayload)
        .select('id')
        .single();

      if (
        insertResult.error &&
        (insertResult.error.code === '42703' || insertResult.error.code === 'PGRST204')
      ) {
        insertResult = await supabase
          .from('scenarios')
          .insert(basePayload)
          .select('id')
          .single();
      }

      if (insertResult.error?.code === '42501') {
        throw new Error('The database still needs the scenarios permission update. Run `supabase db push` and try again.');
      }

      if (insertResult.error || !insertResult.data?.id) {
        throw insertResult.error || new Error('Could not create the scenario.');
      }

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

  if (!fontsLoaded) return null;

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAF7' }} accessibilityLanguage="en-US">
      <Stack.Screen
        options={{
          title: `New Scenario - Step ${step} of ${TOTAL_STEPS}`,
          headerShown: false,
        }}
      />

      <View style={{ height: insets.top, backgroundColor: '#F9FAF7' }} />
      <View className="px-5 pt-2">
        <FlowHeader
          title="New scenario"
          step={step}
          totalSteps={TOTAL_STEPS}
          onBack={prevStep}
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
                          icon={getRoomIcon(room.name)}
                          isSelected={selectedRoomId === room.id}
                          onPress={() => setSelectedRoomId(room.id)}
                        />
                      ))}
                    </View>
                  </StepWrapper>
                )}

                {step === 2 && (
                  <StepWrapper
                    title="Music and mood"
                    subtitle="Optionally connect a Spotify playlist to launch with the scenario."
                  >
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
                            name={getRoomIcon(selectedRoom?.name || '')}
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
                        devices: [],
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
