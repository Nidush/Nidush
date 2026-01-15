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

import { ACTIVITIES, CONTENTS } from '@/constants/data';
import { useBiometrics } from '@/context/BiometricsContext';
import { getDynamicRecommendations } from '@/utils/recommendationEngine';

export default function Index() {
  const [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Nunito_600SemiBold,
    Nunito_400Regular,
  });

  const { currentState } = useBiometrics();
  const dynamicActivities = useMemo(() => {
    // 1. Filtrar
    const appActivities = ACTIVITIES.filter(
      (item) => item.category !== 'My creations',
    );

    // 2. Ordenar
    const sortedList = getDynamicRecommendations(
      appActivities,
      currentState,
    ).slice(0, 5);

    // 3. Mapear (Com as correções de TypeScript)
    return sortedList.map((item) => {
      let duration: string | undefined = undefined;
      if ('contentId' in item && item.contentId) {
        const contentData = (CONTENTS as any)[item.contentId];

        if (contentData) {
          duration = contentData.duration;
        }
      }

      return {
        ...item,
        time: duration,
      };
    });
  }, [currentState]);

  const dynamicTitle = useMemo(() => {
    return 'Activities for you';
  }, []);
  const shortcuts = [
    {
      id: 's1',
      title: 'Cooking Time',
      time: '50min',
      room: 'Kitchen',
      image: require('../../assets/shortcuts/cooking_time.png'),
    },
    {
      id: 's2',
      title: 'Meditation Time',
      time: '15min',
      room: 'Bedroom',
      image: require('../../assets/shortcuts/meditation_time.png'),
    },
    {
      id: 's3',
      title: 'Skincare Time',
      time: '10min',
      room: 'Bathroom',
      image: require('../../assets/shortcuts/skincare_time.png'),
    },
    {
      id: 's4',
      title: 'Reading Time',
      time: '45min',
      room: 'Living Room',
      image: require('../../assets/shortcuts/reading_time.png'),
    },
  ];

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
          {shortcuts.map((item) => (
            <View key={item.id} className="w-[48%] mb-4">
              <UnifiedCard
                id={item.id}
                title={item.title}
                image={item.image}
                time={item.time}
                room={item.room}
                width="100%"
                aspectRatio={1.1}
                onPress={() =>
                  router.push({
                    pathname: '/activity-details',
                    params: { id: item.id },
                  })
                }
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
