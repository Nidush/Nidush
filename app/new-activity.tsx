import { CONTENTS, SCENARIOS } from '@/constants/data'; // Importa dados para lookup
import { Activity } from '@/constants/data/types';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

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
  // 1. Carregar Fontes
  let [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Nunito_600SemiBold,
    Nunito_400Regular,
  });

  // 2. State Management
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  // Estados atualizados para guardar IDs e Tipos corretos
  const [activityType, setActivityType] = useState<Activity['type']>('general');
  const [selectedContentId, setSelectedContentId] = useState('');
  const [room, setRoom] = useState('');
  const [selectedScenarioId, setSelectedScenarioId] = useState(''); // Antes era 'environment'

  const [activityName, setActivityName] = useState('');
  const [description, setDescription] = useState('');
  const [activityImage, setActivityImage] = useState<string | null>(null);

  // 3. Navegação
  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  // 4. Validação
  const isNextDisabled = () => {
    if (step === 1 && !activityType) return true;
    if (step === 2 && !selectedContentId) return true;
    if (step === 3 && !room) return true;
    // Opcional: Validar se cenário foi escolhido no step 4
    // if (step === 4 && !selectedScenarioId) return true;
    return false;
  };

  // 5. Salvar
  // 5. Salvar Dados
  const handleSave = async () => {
    const contentObj = Object.values(CONTENTS).find(
      (c) => c.id === selectedContentId,
    );

    // LÓGICA DE IMAGEM CORRIGIDA
    let finalImage;

    if (activityImage) {
      // 1. Se o user fez upload, usamos essa imagem
      finalImage = { uri: activityImage };
    } else if (contentObj?.image) {
      // 2. Se não fez upload, tentamos usar a imagem do conteúdo selecionado
      finalImage = contentObj.image;
    } else {
      // 3. Se não houver nada, usamos um placeholder (embrulhado em objeto uri)
      finalImage = { uri: 'https://picsum.photos/400/600' };
    }

    const newActivity: Activity = {
      id: Date.now().toString(),
      title: activityName || 'Untitled Activity',
      description,
      room,
      image: finalImage, // Agora isto é sempre do tipo correto
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

      const updatedActivities = [newActivity, ...parsedActivities];

      await AsyncStorage.setItem(
        '@myActivities',
        JSON.stringify(updatedActivities),
      );

      router.push({
        pathname: '/activity-details',
        params: { id: newActivity.id },
      });
    } catch (e) {
      console.log('Erro ao salvar atividade', e);
    }
  };
  if (!fontsLoaded) return null;

  // 6. Preparar dados legíveis para o Review (Step 6)
  // Converte IDs (ex: 'c1', 's2') em Títulos (ex: 'Italian Pasta', 'Deep Focus')
  const reviewContent = Object.values(CONTENTS).find(
    (c) => c.id === selectedContentId,
  );
  const reviewScenario = SCENARIOS.find((s) => s.id === selectedScenarioId);

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-[#F9FAF7] px-5">
        <FlowHeader
          title="New activity"
          step={step}
          totalSteps={totalSteps}
          onBack={prevStep}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
        >
          {step === 1 && (
            <Step1_Type selected={activityType} onSelect={setActivityType} />
          )}

          {step === 2 && (
            <Step2_Content
              activityType={activityType} // Passa o tipo para filtrar a lista
              selectedContentId={selectedContentId}
              onSelect={setSelectedContentId}
            />
          )}

          {step === 3 && <Step3_Room selected={room} onSelect={setRoom} />}

          {step === 4 && (
            <Step4_Environment
              roomName={room} // Passa a sala para filtrar a lista
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
            />
          )}

          {step === 6 && (
            <Step6_Review
              data={{
                activityType,
                content: reviewContent || null,
                room,

                // ALTERAÇÃO AQUI: Passa o objeto completo 'reviewScenario' (ou null)
                environment: reviewScenario || null,

                activityName,
                description,
                activityImage,
              }}
              onJumpToStep={setStep}
            />
          )}
        </ScrollView>

        <View className="absolute bottom-10 left-0 right-0 items-center">
          <TouchableOpacity
            className={`h-14 w-[210px] rounded-full justify-center items-center ${
              isNextDisabled() ? 'bg-gray-300' : 'bg-[#548F53]'
            }`}
            onPress={step === 6 ? handleSave : nextStep}
            disabled={isNextDisabled()}
          >
            <Text
              className="text-white text-lg"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              {step === 6 ? 'Save' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
