import { CONTENTS, SCENARIOS } from '@/constants/data';
import { Activity } from '@/constants/data/types';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
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

export default function NewActivityFlow() {
  let [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Nunito_600SemiBold,
    Nunito_400Regular,
  });

  const [step, setStep] = useState(1);
  const totalSteps = 6;
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef<ScrollView>(null);

  const [activityType, setActivityType] = useState<Activity['type']>('' as any);
  const [selectedContentId, setSelectedContentId] = useState('');
  const [room, setRoom] = useState('');
  const [selectedScenarioId, setSelectedScenarioId] = useState('');
  const [activityName, setActivityName] = useState('');
  const [description, setDescription] = useState('');
  const [activityImage, setActivityImage] = useState<any>(null);

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

  // ... (funções handleContentSelect, nextStep, etc. mantêm-se iguais)
  const handleContentSelect = (id: string) => {
    setSelectedContentId(id);
    const content = Object.values(CONTENTS).find((c) => c.id === id);
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
    // Passo 1: Tipo de atividade obrigatório
    if (step === 1 && !activityType) return true;

    // Passo 2: Conteúdo obrigatório
    if (step === 2 && !selectedContentId) return true;

    // Passo 3: Divisão (Room) obrigatória
    if (step === 3 && !room) return true;

    // Passo 4: Cenário obrigatório (Adicionado agora)
    if (step === 4 && !selectedScenarioId) return true;

    // Passo 5: Nome, Descrição e Imagem obrigatórios
    if (step === 5) {
      const hasName = activityName && activityName.trim().length > 0;
      const hasDesc = description && description.trim().length > 0;
      const hasImage = !!activityImage;

      // Se faltar qualquer um, esconde o botão
      if (!hasName || !hasDesc || !hasImage) return true;
    }

    return false;
  };

  const handleSave = async () => {
    const contentObj = Object.values(CONTENTS).find(
      (c) => c.id === selectedContentId,
    );

    let finalImage;

    // CORREÇÃO LÓGICA DA IMAGEM
    if (activityImage) {
      // Se for string (veio da galeria), tem de ser { uri: ... }
      // Se for number (veio do default/require), usa-se diretamente
      finalImage =
        typeof activityImage === 'string'
          ? { uri: activityImage }
          : activityImage;
    } else if (contentObj?.image) {
      finalImage = contentObj.image;
    } else {
      finalImage = { uri: 'https://picsum.photos/400/600' };
    }

    const newActivity: Activity = {
      id: Date.now().toString(),
      title: activityName || 'Untitled Activity',
      description,
      room,
      image: finalImage, // Agora a imagem vai no formato correto
      category: 'My creations',
      type: activityType,
      contentId: selectedContentId,
      scenarioId: selectedScenarioId,
      keywords: [activityType, room, 'custom'],
    };

    try {
      const storedActivities = await AsyncStorage.getItem('@myActivities');
      const parsedActivities = storedActivities
        ? JSON.parse(storedActivities)
        : [];
      await AsyncStorage.setItem(
        '@myActivities',
        JSON.stringify([newActivity, ...parsedActivities]),
      );
      router.push({
        pathname: '/activity-details',
        params: {
          id: newActivity.id,
          isNew: 'true',
        },
      });
    } catch (e) {
      console.log('Erro ao salvar', e);
    }
  };

  if (!fontsLoaded) return null;

  const reviewContent = Object.values(CONTENTS).find(
    (c) => c.id === selectedContentId,
  );
  const reviewScenario = SCENARIOS.find((s) => s.id === selectedScenarioId);

  return (
    <SafeAreaProvider>
      {/* 1. View Base com a cor do tema. Removemos SafeAreaView wrapper para não cortar o fundo */}
      <View style={{ flex: 1, backgroundColor: '#F9FAF7' }}>
        {/* Espaçador para a Status Bar (Notch) */}
        <View style={{ height: insets.top, backgroundColor: '#F9FAF7' }} />

        {/* Header Fixo */}
        <View className="px-5 pt-2">
          <FlowHeader
            title="New activity"
            step={step}
            totalSteps={totalSteps}
            onBack={prevStep}
          />
        </View>

        {/* Layout do Conteúdo */}
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          // Ajusta isto se o teclado ainda tapar (compensa o header)
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
        >
          <View className="flex-1 relative">
            <ScrollView
              ref={scrollViewRef}
              showsVerticalScrollIndicator={false}
              // Padding horizontal aplicado aqui
              contentContainerStyle={{
                paddingHorizontal: 20,
                // Padding bottom grande para o último item passar por trás do botão
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
              {step === 3 && <Step3_Room selected={room} onSelect={setRoom} />}
              {step === 4 && (
                <Step4_Environment
                  roomName={room}
                  selected={selectedScenarioId}
                  onSelect={setSelectedScenarioId}
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
                  // ADICIONAR ESTA LINHA:
                  defaultImage={reviewContent?.image || null}
                />
              )}
              {step === 6 && (
                <Step6_Review
                  data={{
                    activityType,
                    content: reviewContent || null,
                    room,
                    environment: reviewScenario || null,
                    activityName,
                    description,
                    activityImage,
                  }}
                  onJumpToStep={setStep}
                />
              )}
            </ScrollView>

            {!isKeyboardVisible && !isNextDisabled() && (
              <View
                className="absolute left-0 right-0 items-center bg-transparent pointer-events-box-none"
                style={{
                  bottom: 15,
                  paddingBottom: insets.bottom > 0 ? insets.bottom : 20,
                  paddingTop: 10,
                }}
              >
                <TouchableOpacity
                  className="h-14 w-[210px] rounded-full justify-center items-center shadow-lg bg-[#548F53]"
                  onPress={step === 6 ? handleSave : nextStep}
                >
                  <Text
                    className="text-white text-2xl"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    {step === 6 ? 'Save' : 'Continue'}
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
