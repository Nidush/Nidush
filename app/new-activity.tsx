import { Content, CONTENTS } from '@/constants/data';
import { resolveCatalogImage } from '@/constants/data/catalogAssets';
import { Activity, Scenario } from '@/constants/data/types';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { apiLog, supabase, uploadImage } from '../utils/supabase';

import { useNotifications } from '@/context/NotificationsContext';
import {
  fetchScenarioTemplates,
  fetchUserScenarios,
  parseUserScenarioDbId,
  resolvePossibleUserScenarioDbIds,
} from '@/utils/catalogTemplates';
import { captureException, trackEvent } from '@/utils/observability';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  ImageSourcePropType,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

import {
  FlowHeader,
  Step1_Type,
  Step2_Content,
  Step3_Room,
  Step4_Environment,
  Step5_Details,
  Step6_Review,
} from '@/components/newActivityFlow';

const dbTypeToActivityType = (
  type: string | null | undefined,
): Activity['type'] => {
  const normalized = String(type ?? 'other').toLowerCase();
  if (normalized === 'audiobook') return 'audiobooks';
  if (
    [
      'cooking',
      'meditation',
      'workout',
      'audiobooks',
      'general',
      'reading',
      'yoga',
      'other',
    ].includes(normalized)
  ) {
    return normalized as Activity['type'];
  }
  return 'other';
};

const scenarioIdToTemplateId = (value: unknown) => {
  if (value === null || value === undefined || value === '') return '';
  const raw = String(value);
  if (raw.startsWith('scenario:')) return raw;
  return raw.startsWith('s') ? raw : `s${raw}`;
};

type ActivityDraftPayload = {
  step: number;
  activityType: Activity['type'];
  selectedContentId: string;
  room_id: string;
  selectedScenarioId: string;
  activityName: string;
  description: string;
  activityImageUri: string | null;
};

type ContentRow = {
  id: string;
  title: string;
  type: string;
  category: string;
  description: string;
  duration: string;
  image?: string | null;
  instructions?: unknown;
  ingredients?: unknown;
  video_url?: string | null;
  author?: string | null;
};

const normalizeContentInstructions = (
  value: unknown,
): Content['instructions'] => {
  if (!Array.isArray(value)) return undefined;
  return value as Content['instructions'];
};

const normalizeContentIngredients = (
  value: unknown,
): Content['ingredients'] => {
  if (!Array.isArray(value)) return undefined;
  return value as Content['ingredients'];
};

const getImageUri = (value: ImageSourcePropType | string | null) =>
  typeof value === 'string'
    ? value
    : value && typeof value === 'object' && 'uri' in value
      ? value.uri
      : undefined;

const resolveScenarioDbId = (value: string) => {
  if (typeof parseUserScenarioDbId === 'function') {
    return parseUserScenarioDbId(value);
  }

  const raw = String(value ?? '');
  return raw.startsWith('scenario:') ? raw.replace(/^scenario:/, '') : raw;
};

export default function NewActivityFlow() {
  let [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Nunito_600SemiBold,
    Nunito_400Regular,
  });

  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEditMode = Boolean(editId);
  const draftKey = useMemo(
    () => `@new_activity_draft:${editId ?? 'create'}`,
    [editId],
  );
  const [step, setStep] = useState(1);
  const { addNotification } = useNotifications();
  const totalSteps = 6;
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [didRestoreDraft, setDidRestoreDraft] = useState(false);

  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);
  const hasHydratedDraftRef = useRef(false);

  const [activityType, setActivityType] = useState<Activity['type']>('other');
  const [selectedContentId, setSelectedContentId] = useState('');
  const [room_id, setRoomId] = useState('');
  const [selectedScenarioId, setSelectedScenarioId] = useState('');
  const [activityName, setActivityName] = useState('');
  const [description, setDescription] = useState('');
  const [activityImage, setActivityImage] = useState<
    ImageSourcePropType | string | null
  >(null);
  const [dbContent, setDbContent] = useState<Content[]>([]);
  const [scenarioTemplates, setScenarioTemplates] = useState<Scenario[]>([]);
  const [homeRooms, setHomeRooms] = useState<HomeRoomRow[]>([]);
  const [roomDeviceTypes, setRoomDeviceTypes] = useState<string[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const linkRoomTvDevices = async (
    activityId: number,
    homeId: number,
    roomId: number | null,
  ) => {
    if (!roomId) return;

    try {
      const { data: roomDevices, error: devicesError } = await supabase
        .from('devices')
        .select('id')
        .eq('home_id', homeId)
        .eq('room_id', roomId);

      if (devicesError) throw devicesError;
      if (!roomDevices?.length) return;

      const { data: existingLinks, error: existingError } = await supabase
        .from('activity_devices')
        .select('device_id')
        .eq('activity_id', activityId);

      if (existingError) throw existingError;

      const linkedDeviceIds = new Set(
        (existingLinks || []).map((link) => link.device_id),
      );
      const linksToInsert = tvDevices
        .filter((device) => !linkedDeviceIds.has(device.id))
        .map((device) => ({
          activity_id: activityId,
          device_id: device.id,
        }));

      if (linksToInsert.length === 0) return;

      const { error: insertError } = await supabase
        .from('activity_devices')
        .insert(linksToInsert);

      if (insertError) throw insertError;
    } catch (error) {
      console.warn('Could not auto-link room devices to activity:', error);
    }
  };

  useEffect(() => {
    const loadDraft = async () => {
      try {
        const raw = await AsyncStorage.getItem(draftKey);
        if (!raw) return;

        const draft = JSON.parse(raw) as ActivityDraftPayload;
        setStep(typeof draft.step === 'number' ? draft.step : 1);
        setActivityType(draft.activityType ?? 'other');
        setSelectedContentId(draft.selectedContentId ?? '');
        setRoomId(draft.room_id ?? '');
        setSelectedScenarioId(draft.selectedScenarioId ?? '');
        setActivityName(draft.activityName ?? '');
        setDescription(draft.description ?? '');
        if (draft.activityImageUri) {
          setActivityImage(draft.activityImageUri);
        }
        setDidRestoreDraft(true);
      } catch (error) {
        console.error('Failed to restore activity draft:', error);
      } finally {
        hasHydratedDraftRef.current = true;
      }
    };

    void loadDraft();
  }, [draftKey]);

  useEffect(() => {
    if (!editId) return;

    const fetchActivityForEdit = async () => {
      apiLog('SELECT', 'activities', { id: editId });
      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('id', editId)
        .single();

      if (error || !data) {
        console.error('Failed to load activity for edit:', error);
        router.back();
        return;
      }

      setActivityType(dbTypeToActivityType(data.type));
      setSelectedContentId(data.content_id || '');
      setRoomId(data.room_id || '');
      setSelectedScenarioId(scenarioIdToTemplateId(data.scenario_id));
      setActivityName(data.title || '');
      setDescription(data.description || '');
      setActivityImage(data.image || null);
    };

    fetchActivityForEdit();
  }, [editId]);

  useEffect(() => {
    const fetchContent = async () => {
      const { data, error } = await supabase.from('contents').select('*');

      if (data && !error) {
        setDbContent(
          (data as ContentRow[]).map((c) => {
            const localContent = CONTENTS[c.id as keyof typeof CONTENTS];

            return {
              id: c.id,
              title: c.title || localContent?.title,
              type: c.type || localContent?.type,
              category: c.category || localContent?.category,
              description: c.description || localContent?.description,
              duration: c.duration || localContent?.duration,
              image: resolveCatalogImage(c.image || localContent?.image),
              instructions:
                normalizeContentInstructions(c.instructions) ||
                localContent?.instructions,
              ingredients:
                normalizeContentIngredients(c.ingredients) ||
                localContent?.ingredients,
              videoUrl: localContent?.videoUrl || c.video_url || undefined,
              author: c.author || localContent?.author,
            };
          }),
        );
      }
    };
    fetchContent();
  }, []);

  useEffect(() => {
    const fetchHomeSetup = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoadError('You need to be logged in to create an activity.');
          return;
        }

        const { data: userHome, error: userHomeError } = await supabase
          .from('user_homes')
          .select('home_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (userHomeError) throw userHomeError;

        if (!userHome?.home_id) {
          setLoadError('Connect this profile to a home before creating activities.');
          return;
        }

        const { data: roomRows, error: roomsError } = await supabase
          .from('rooms')
          .select('id, name')
          .eq('home_id', userHome.home_id)
          .order('id', { ascending: true });

        if (roomsError) throw roomsError;

        const safeRooms = roomRows ?? [];
        setHomeRooms(safeRooms);
        if (safeRooms.length === 0) {
          setLoadError('Create at least one room before creating an activity.');
          return;
        }

        const { count: assignedDevicesCount, error: devicesError } = await supabase
          .from('devices')
          .select('id', { count: 'exact', head: true })
          .eq('home_id', userHome.home_id)
          .not('room_id', 'is', null);

        if (devicesError) throw devicesError;
        if (!assignedDevicesCount) {
          setLoadError('Assign at least one device to a room before creating an activity.');
          return;
        }

        setLoadError(null);
      } catch (error) {
        console.error('Failed to load home setup for activity creation:', error);
        setLoadError('We could not load your home setup right now.');
      }
    };

    fetchHomeSetup();
  }, []);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const [templateScenarios, userScenarios] = await Promise.all([
          fetchScenarioTemplates(),
          fetchUserScenarios().catch(() => []),
        ]);

        const mergedScenarios = [...userScenarios, ...templateScenarios];
        const uniqueScenarios = mergedScenarios.filter(
          (scenario, index, list) =>
            list.findIndex((item) => item.id === scenario.id) === index,
        );

        setScenarioTemplates(uniqueScenarios);
      } catch (error) {
        console.error('Failed to load scenario templates:', error);
        setScenarioTemplates([]);
      }
    };

    fetchScenarios();
  }, []);

  useEffect(() => {
    if (
      !isEditMode ||
      room_id ||
      !selectedScenarioId ||
      scenarioTemplates.length === 0
    ) {
      return;
    }

    const selectedScenario = scenarioTemplates.find(
      (scenario) => scenario.id === selectedScenarioId,
    );
    if (selectedScenario?.room || selectedScenario?.room_id) {
      setRoomId(selectedScenario.room || selectedScenario.room_id || '');
    }
  }, [isEditMode, room_id, selectedScenarioId, scenarioTemplates]);

  useEffect(() => {
    if (!homeRooms.length) return;

    const rawRoomValue = String(room_id ?? '');
    if (!/^\d+$/.test(rawRoomValue)) return;

    const matchedRoom = homeRooms.find((room) => String(room.id) === rawRoomValue);
    if (matchedRoom) {
      setRoomId(matchedRoom.name);
    }
  }, [homeRooms, room_id]);

  useEffect(() => {
    const fetchRoomDevices = async () => {
      if (!room_id || homeRooms.length === 0) {
        setRoomDeviceTypes([]);
        return;
      }
      
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data: homeAssoc } = await supabase.from('user_homes').select('home_id').eq('user_id', user.id).maybeSingle();
        if (!homeAssoc?.home_id) return;

        const matchedRoom = homeRooms.find((r) => r.name === room_id || String(r.id) === room_id);
        if (!matchedRoom) return;

        const { data: devices } = await supabase
          .from('devices')
          .select('type')
          .eq('home_id', homeAssoc.home_id)
          .eq('room_id', matchedRoom.id);

        if (devices) {
          const types = Array.from(new Set(devices.map(d => String(d.type).toLowerCase())));
          setRoomDeviceTypes(types);
        } else {
          setRoomDeviceTypes([]);
        }
      } catch (e) {
        console.error('Error fetching room devices:', e);
      }
    };
    fetchRoomDevices();
  }, [room_id, homeRooms]);

  const allContent = useMemo(() => {
    const combined = [...dbContent];
    Object.values(CONTENTS).forEach((local: Content) => {
      if (!combined.find((db: Content) => db.id === local.id)) {
        combined.push(local);
      }
    });
    return combined;
  }, [dbContent]);

  useEffect(() => {
    AccessibilityInfo.announceForAccessibility(`Step ${step} of ${totalSteps}`);
  }, [step]);

  useEffect(() => {
    if (!hasHydratedDraftRef.current) return;

    const shouldPersist =
      step > 1 ||
      !!selectedContentId ||
      !!room_id ||
      !!selectedScenarioId ||
      !!activityName.trim() ||
      !!description.trim() ||
      !!activityImage;

    const persistDraft = async () => {
      try {
        if (!shouldPersist) {
          await AsyncStorage.removeItem(draftKey);
          return;
        }

        await saveActivityDraft();
      } catch (error) {
        console.error('Failed to persist activity draft:', error);
      }
    };

    void persistDraft();
  }, [
    activityImage,
    activityName,
    activityType,
    description,
    draftKey,
    room_id,
    saveActivityDraft,
    selectedContentId,
    selectedScenarioId,
    step,
  ]);

  useEffect(() => {
    const keyboardShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        if (step === 5 && scrollViewRef.current) {
          setTimeout(
            () => scrollViewRef.current?.scrollToEnd({ animated: true }),
            100,
          );
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

  const handleContentSelect = (id: string) => {
    setSelectedContentId(id);
    const content = allContent.find((c) => c.id === id);
    if (content) {
      setActivityName(content.title);
      setDescription(content.description || '');
      setActivityImage(content.image);
    }
  };

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };
  const prevStep = async () => {
    if (step > 1) setStep(step - 1);
    else {
      await discardActivityDraft();
      router.back();
    }
  };

  const handleCancel = useCallback(async () => {
    await discardActivityDraft();
    router.back();
  }, [discardActivityDraft]);

  const isNextDisabled = () => {
    if (step === 1 && !activityType) return true;

    if (step === 2 && !selectedContentId) return true;

    if (step === 3 && !room_id) return true;

    if (step === 4 && !selectedScenarioId) return true;

    if (step === 5) {
      const hasName = activityName && activityName.trim().length > 0;
      const hasDesc = description && description.trim().length > 0;
      const hasImage = !!activityImage;

      if (!hasName || !hasDesc || !hasImage) return true;
    }

    return false;
  };

  const handleSave = async () => {
    if (isSaving || loadError) return;

    const contentObj = allContent.find((c) => c.id === selectedContentId);

    let finalImage;

    if (activityImage) {
      finalImage =
        typeof activityImage === 'string'
          ? { uri: activityImage }
          : activityImage;
    } else if (contentObj?.image) {
      finalImage = contentObj.image;
    } else {
      finalImage = { uri: 'https://picsum.photos/400/600' };
    }

    try {
      setIsSaving(true);
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilizador não autenticado!');

      // 1. Upload da imagem para o Storage (se for uma nova imagem local)
      let imageUrl = getImageUri(finalImage) || finalImage;
      if (
        typeof imageUrl === 'string' &&
        (imageUrl.startsWith('data:') ||
          imageUrl.startsWith('file:') ||
          imageUrl.startsWith('blob:'))
      ) {
        const uploadedUrl = await uploadImage(imageUrl);
        if (uploadedUrl) imageUrl = uploadedUrl;
      }

      // Formatar o tipo para bater com a constraint da base de dados ('Cooking', 'Audiobooks', etc)
      const typeMapping: Record<string, string> = {
        cooking: 'Cooking',
        audiobooks: 'Audiobooks',
        meditation: 'Meditation',
        workout: 'Workout',
        reading: 'Reading',
        yoga: 'Yoga',
        other: 'other',
        general: 'other',
      };
      const formattedType = typeMapping[activityType] || 'other';

      // 2. Resolve room_id string to database room integer ID
      let dbRoomId = null;
      let currentHomeId: number | null = null;
      if (room_id) {
        const { data: homeAssoc } = await supabase
          .from('user_homes')
          .select('home_id')
          .eq('user_id', user.id)
          .maybeSingle();

        currentHomeId = homeAssoc?.home_id ?? null;

        if (currentHomeId) {
          const { data: roomData } = await supabase
            .from('rooms')
            .select('id')
            .eq('home_id', currentHomeId)
            .eq('name', room_id)
            .maybeSingle();
          dbRoomId = roomData?.id || null;
        }
      } else {
        const { data: homeAssoc } = await supabase
          .from('user_homes')
          .select('home_id')
          .eq('user_id', user.id)
          .maybeSingle();

        currentHomeId = homeAssoc?.home_id ?? null;
      }

      // 3. Tentar inserir/atualizar na DB
      const saveData = {
        title: activityName || 'Untitled Activity',
        description,
        image: imageUrl,
        category: 'My creations',
        type: formattedType,
        content_id: selectedContentId || null,
        scenario_id: selectedScenarioId
          ? parseInt(selectedScenarioId.toString().replace(/\D/g, ''))
          : 1,
        room_id: dbRoomId,
        home_id: currentHomeId,
      };

      const { data, error } =
        isEditMode && editId
          ? await supabase
              .from('activities')
              .update(saveData)
              .eq('id', editId)
              .eq('user_id', user.id)
              .select('*, id')
              .single()
          : await supabase
              .from('activities')
              .insert({ ...saveData, user_id: user.id })
              .select('*, id')
              .single();

      apiLog(isEditMode ? 'UPDATE' : 'INSERT', 'activities', {
        id: editId,
        ...saveData,
      });

      if (error) {
        console.error('Erro no Supabase:', error);
        captureException(error, {
          area: 'activities',
          screen: 'new-activity',
          action: isEditMode ? 'update-activity' : 'create-activity',
        });
        return;
      }

      if (data?.id && currentHomeId) {
        await linkRoomTvDevices(Number(data.id), currentHomeId, dbRoomId);
      }

      await AsyncStorage.removeItem(draftKey);

      // 3. Trigger Notification
      addNotification(
        isEditMode ? 'Activity Updated' : 'New Activity Created',
        isEditMode
          ? `"${activityName || 'Untitled Activity'}" has been updated.`
          : `Great job! "${activityName || 'Untitled Activity'}" has been added to your creations.`,
        'creation',
      );
      trackEvent(isEditMode ? 'activity-updated' : 'activity-created', {
        area: 'activities',
        screen: 'new-activity',
        action: isEditMode ? 'update-activity' : 'create-activity',
        userId: user.id,
        metadata: {
          activityId: data.id,
          roomId: dbRoomId,
          homeId: currentHomeId,
        },
      });

      // Se tudo correu bem, avançar para os detalhes usando o ID gerado pelo Supabase
      router.push({
        pathname: '/activity-details',
        params: {
          id: data.id.toString(),
          isNew: isEditMode ? 'false' : 'true',
        },
      });
    } catch (e) {
      console.error('Erro ao salvar:', e);
      captureException(e, {
        area: 'activities',
        screen: 'new-activity',
        action: isEditMode ? 'update-activity' : 'create-activity',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!fontsLoaded) return null;

  const reviewContent = allContent.find((c) => c.id === selectedContentId);
  const reviewScenario = scenarioTemplates.find(
    (s) => s.id === selectedScenarioId,
  );

  return (
    <SafeAreaProvider>
      <View
        style={{ flex: 1, backgroundColor: '#F9FAF7' }}
        accessibilityLanguage="en-US"
      >
        <Stack.Screen
          options={{
            title: `${isEditMode ? 'Edit' : 'New'} Activity - Step ${step} of ${totalSteps}`,
            headerShown: false,
          }}
        />
        <View style={{ height: insets.top, backgroundColor: '#F9FAF7' }} />
        <View className="px-5 pt-2">
          <FlowHeader
            title={isEditMode ? 'Edit activity' : 'New activity'}
            step={step}
            totalSteps={totalSteps}
            onBack={prevStep}
            onCancel={handleCancel}
          />
        </View>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
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
              {step === 1 && (
                <Step1_Type
                  selected={activityType}
                  onSelect={setActivityType}
                />
              )}
              {step === 2 && (
                <Step2_Content
                  activityType={activityType}
                  selectedContentId={selectedContentId}
                  onSelect={handleContentSelect}
                />
              )}
              {step === 3 && (
                <Step3_Room selected={room_id} onSelect={setRoomId} />
              )}
              {step === 4 && (
                <Step4_Environment
                  roomName={room_id}
                  selected={selectedScenarioId}
                  onSelect={setSelectedScenarioId}
                  scenarios={scenarioTemplates}
                />
              )}
              {step === 5 && (
                <Step5_Details
                  name={activityName}
                  setName={setActivityName}
                  desc={description}
                  setDesc={setDescription}
                  image={activityImage}
                  setImage={setActivityImage}
                  defaultImage={reviewContent?.image || null}
                />
              )}
              {step === 6 && (
                <Step6_Review
                  data={{
                    activityType,
                    content: reviewContent || null,
                    room: room_id,
                    environment: reviewScenario || null,
                    activityName,
                    description,
                    activityImage,
                  }}
                  onJumpToStep={setStep}
                />
              )}
            </ScrollView>

            {/* Mantemos apenas a verificação do teclado para não o esconder */}
            {!isKeyboardVisible && (
              <View
                className="absolute left-0 right-0 items-center bg-transparent pointer-events-box-none"
                style={{
                  bottom: 15,
                  paddingBottom: insets.bottom > 0 ? insets.bottom : 20,
                  paddingTop: 10,
                }}
              >
                <TouchableOpacity
                  // Se estiver desativado, fica cinzento/translúcido e sem sombra
                  className={`h-14 w-[210px] rounded-full justify-center items-center transition-all ${
                    isNextDisabled() || Boolean(loadError)
                      ? 'bg-gray-400 opacity-60 shadow-none'
                      : 'bg-[#548F53] shadow-lg'
                  }`}
                  onPress={step === 6 ? handleSave : nextStep}
                  disabled={isNextDisabled() || isSaving || Boolean(loadError)} // Impede o clique físico
                  accessible={true}
                  accessibilityRole="button"
                  // Informa o leitor de ecrã (VoiceOver/TalkBack) que o botão está inativo
                  accessibilityState={{
                    disabled: isNextDisabled() || isSaving,
                  }}
                  accessibilityLabel={
                    step === 6
                      ? isEditMode
                        ? 'Update activity'
                        : 'Save activity'
                      : 'Continue to next step'
                  }
                  // Uma dica extra para utilizadores com leitores de ecrã saberem o que falta fazer
                  accessibilityHint={
                    isNextDisabled()
                      ? 'Please complete all required fields on this step to enable this button.'
                      : 'Double tap to proceed.'
                  }
                >
                  <Text
                    maxFontSizeMultiplier={1.2}
                    className="text-white text-2xl"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    {step === 6
                      ? isSaving
                        ? 'Saving...'
                        : isEditMode
                          ? 'Update'
                          : 'Save'
                      : 'Continue'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaProvider>
  );
}
