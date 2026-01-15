import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UnifiedCard } from '@/components/activitiesScenarios/UnifiedCard';
import { CarouselSection } from '../../components/activitiesScenarios/CarouselSection';
import { HomeHeader } from '../../components/Homepage/HomeHeader';
import { StateWidget } from '../../components/Homepage/StateWidget';

// 1. IMPORTAR TUDO O QUE PRECISAS DOS DADOS
import { ACTIVITIES, CONTENTS, SCENARIOS } from '@/constants/data';
import { useBiometrics } from '@/context/BiometricsContext';
import { getDynamicRecommendations } from '@/utils/recommendationEngine';

export default function Index() {
  const [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Nunito_600SemiBold,
    Nunito_400Regular,
  });

  const { currentState } = useBiometrics();

  // --- LÓGICA DO CARROSSEL (Recomendações) ---
  const dynamicActivities = useMemo(() => {
    const appActivities = ACTIVITIES.filter(
      (item) => item.category !== 'My creations',
    );
    const sortedList = getDynamicRecommendations(
      appActivities,
      currentState,
    ).slice(0, 5);

    return sortedList.map((item) => {
      let duration: string | undefined = undefined;
      if ('contentId' in item && item.contentId) {
        const contentData = (CONTENTS as any)[item.contentId];
        if (contentData) {
          duration = contentData.duration;
        }
      }
      return { ...item, time: duration };
    });
  }, [currentState]);

  const dynamicTitle = useMemo(() => 'Activities for you', []);

  // --- NOVA LÓGICA DOS SHORTCUTS (USANDO 'shortcuts' NO PLURAL) ---
  const shortcuts = useMemo(() => {
    // 1. Filtrar ATIVIDADES onde shortcuts === true
    const favActivities = ACTIVITIES.filter(
      (a: any) => a.shortcuts === true,
    ).map((item) => {
      // Tentar encontrar a duração no CONTENTS
      let duration = undefined;
      if (item.contentId && (CONTENTS as any)[item.contentId]) {
        duration = (CONTENTS as any)[item.contentId].duration;
      }

      return {
        id: item.id,
        title: item.title,
        room: item.room,
        image: item.image,
        time: duration,
        // Adicionamos type activity para ajudar na lógica se precisares
        type: 'activity',
      };
    });

    // 2. Filtrar CENÁRIOS onde shortcuts === true
    const favScenarios = SCENARIOS.filter((s: any) => s.shortcuts === true).map(
      (item) => {
        return {
          id: item.id,
          title: item.title,
          room: item.room,
          image: item.image,
          time: undefined, // Cenários não costumam ter duração definida nos cards
          type: 'scenario',
        };
      },
    );

    // 3. Juntar as duas listas
    return [...favActivities, ...favScenarios];
  }, []); // Dependência vazia (calcula apenas ao montar o componente)

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView className="flex-1 bg-[#F0F2EB]" edges={['top']}>
      <ScrollView
        className="px-5"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        style={{ paddingTop: Platform.OS === 'android' ? 20 : 0 }}
      >
        <HomeHeader userName="Laura" />

        <StateWidget />

        <View className="-mx-5">
          <CarouselSection
            title={dynamicTitle}
            data={dynamicActivities}
            showTime={true}
          />
        </View>

        {/* SECÇÃO SHORTCUTS DINÂMICA */}
        <View className="flex-row justify-between items-center mb-4 mt-2">
          <Text
            style={{ fontFamily: 'Nunito_600SemiBold' }}
            className="text-2xl text-[#354F52]"
          >
            Shortcuts
          </Text>
          <Pressable>
            <Text
              style={{ fontFamily: 'Nunito_600SemiBold' }}
              className="text-[#548F53] underline text-xl"
            >
              Edit
            </Text>
          </Pressable>
        </View>

        <View className="flex-row flex-wrap justify-between pb-10">
          {shortcuts.length > 0 ? (
            shortcuts.map((item) => (
              <View key={item.id} className="w-[48%] mb-4">
                <UnifiedCard
                  id={item.id}
                  title={item.title}
                  image={item.image}
                  time={item.time}
                  room={item.room}
                  width="100%"
                  aspectRatio={0.95}
                  onPress={() =>
                    router.push({
                      pathname: '/activity-details',
                      params: { id: item.id },
                    })
                  }
                />
              </View>
            ))
          ) : (
            // Mensagem caso não haja shortcuts definidos
            <Text
              style={{ fontFamily: 'Nunito_400Regular' }}
              className="text-gray-500 w-full text-center mt-2 italic"
            >
              {'No shortcuts selected yet. Click "Edit" to add some!'}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
