import { Content, CONTENTS } from '@/constants/data';
import { Activity, Scenario } from '@/constants/data/types';
import { resolveCatalogImage } from '@/constants/data/catalogAssets';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { supabase, uploadImage, apiLog } from '../utils/supabase';

import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNotifications } from '@/context/NotificationsContext';
import { fetchScenarioTemplates } from '@/utils/catalogTemplates';
import {
  AccessibilityInfo,
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

const dbTypeToActivityType = (type: string | null | undefined): Activity['type'] => {
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
  return raw.startsWith('s') ? raw : `s${raw}`;
};

export default function NewActivityFlow() {
  let [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Nunito_600SemiBold,
    Nunito_400Regular,
  });

  const { editId } = useLocalSearchParams<{ editId?: string }>();
  const isEditMode = Boolean(editId);
  const [step, setStep] = useState(1);
  const { addNotification } = useNotifications();
  const totalSteps = 6;
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [activityType, setActivityType] = useState<Activity['type']>('' as any);
  const [selectedContentId, setSelectedContentId] = useState('');
  const [room_id, setRoomId] = useState('');
  const [selectedScenarioId, setSelectedScenarioId] = useState('');
  const [activityName, setActivityName] = useState('');
  const [description, setDescription] = useState('');
  const [activityImage, setActivityImage] = useState<any>(null);
  const [dbContent, setDbContent] = useState<Content[]>([]);
  const [scenarioTemplates, setScenarioTemplates] = useState<Scenario[]>([]);
  const [isSaving, setIsSaving] = useState(false);

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
        alert('Não foi possível carregar a atividade para edição.');
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
      const { data, error } = await supabase
        .from('contents')
        .select('*');
      
      if (data && !error) {
        setDbContent(data.map((c: any) => ({
          id: c.id,
          title: c.title,
          type: c.type,
          category: c.category,
          description: c.description,
          duration: c.duration,
          image: resolveCatalogImage(c.image),
          instructions: c.instructions,
          ingredients: c.ingredients,
          videoUrl: c.video_url,
          author: c.author,
        })));
      }
    };
    fetchContent();
  }, []);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        setScenarioTemplates(await fetchScenarioTemplates());
      } catch (error) {
        console.error('Failed to load scenario templates:', error);
        setScenarioTemplates([]);
      }
    };

    fetchScenarios();
  }, []);

  useEffect(() => {
    if (!isEditMode || room_id || !selectedScenarioId || scenarioTemplates.length === 0) {
      return;
    }

    const selectedScenario = scenarioTemplates.find((scenario) => scenario.id === selectedScenarioId);
    if (selectedScenario?.room || selectedScenario?.room_id) {
      setRoomId(selectedScenario.room || selectedScenario.room_id || '');
    }
  }, [isEditMode, room_id, selectedScenarioId, scenarioTemplates]);

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
  const prevStep = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

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
    if (isSaving) return;

    const contentObj = allContent.find(
      (c) => c.id === selectedContentId,
    );

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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Utilizador não autenticado!");

      // 1. Upload da imagem para o Storage (se for uma nova imagem local)
      let imageUrl = finalImage?.uri || finalImage;
      if (typeof imageUrl === 'string' && (imageUrl.startsWith('data:') || imageUrl.startsWith('file:') || imageUrl.startsWith('blob:'))) {
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
        general: 'other'
      };
      const formattedType = typeMapping[activityType] || 'other';

      // 2. Tentar inserir/atualizar na DB
      const saveData = {
        title: activityName || 'Untitled Activity',
        description,
        image: imageUrl,
        category: 'My creations',
        type: formattedType,
        content_id: selectedContentId || null,
        scenario_id: selectedScenarioId ? parseInt(selectedScenarioId.toString().replace(/\D/g, '')) : 1,
      };

      const { data, error } = isEditMode && editId
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
        alert('Erro ao guardar na Base de Dados: ' + error.message);
        return;
      }

      // 3. Trigger Notification
      addNotification(
        isEditMode ? 'Activity Updated' : 'New Activity Created',
        isEditMode
          ? `"${activityName || 'Untitled Activity'}" has been updated.`
          : `Great job! "${activityName || 'Untitled Activity'}" has been added to your creations.`,
        'creation'
      );

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
      alert('Ocorreu um erro ao salvar a tua atividade.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!fontsLoaded) return null;

  const reviewContent = allContent.find(
    (c) => c.id === selectedContentId,
  );
  const reviewScenario = scenarioTemplates.find((s) => s.id === selectedScenarioId);

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
                  contentList={allContent}
                />
              )}
              {step === 3 && <Step3_Room selected={room_id} onSelect={setRoomId} />}
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
                    isNextDisabled()
                      ? 'bg-gray-400 opacity-60 shadow-none'
                      : 'bg-[#548F53] shadow-lg'
                  }`}
                  onPress={step === 6 ? handleSave : nextStep}
                  disabled={isNextDisabled() || isSaving} // Impede o clique físico
                  accessible={true}
                  accessibilityRole="button"
                  // Informa o leitor de ecrã (VoiceOver/TalkBack) que o botão está inativo
                  accessibilityState={{ disabled: isNextDisabled() || isSaving }}
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
                    {step === 6 ? (isSaving ? 'Saving...' : isEditMode ? 'Update' : 'Save') : 'Continue'}
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
