import { CarouselSection } from '@/components/activitiesScenarios/CarouselSection';
import { FabMenu } from '@/components/activitiesScenarios/FabMenu';
import { FilterBar } from '@/components/activitiesScenarios/FilterBar';
import { HeaderSection } from '@/components/activitiesScenarios/HeaderSection';
import { useBiometrics } from '@/context/BiometricsContext';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  ACTIVITIES,
  Activity,
  CONTENTS,
  Scenario,
  SCENARIOS,
} from '@/constants/data';
import { getDynamicRecommendations } from '@/utils/recommendationEngine';

const UnifiedActivitiesScreen = () => {
  const { currentState } = useBiometrics();

  const [viewMode, setViewMode] = useState<'activities' | 'scenarios'>(
    'activities',
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [myActivities, setMyActivities] = useState<Activity[]>([]);

  useFocusEffect(
    useCallback(() => {
      const loadActivities = async () => {
        const stored = await AsyncStorage.getItem('@myActivities');
        if (stored) setMyActivities(JSON.parse(stored));
      };
      loadActivities();
    }, []),
  );

  let [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Nunito_600SemiBold,
    Nunito_400Regular,
  });

  const filterOptions =
    viewMode === 'activities'
      ? ['All', 'Cooking', 'Audiobooks', 'Meditation', 'Workout']
      : ['All', 'Bedroom', 'Living Room', 'Kitchen'];

  const isActivity = (item: Activity | Scenario): item is Activity => {
    return 'type' in item;
  };

  const getActivityTime = (activity: Activity) => {
    if (activity.contentId && CONTENTS[activity.contentId]) {
      return CONTENTS[activity.contentId].duration;
    }
    return undefined;
  };

  const processedData = useMemo(() => {
    const baseData =
      viewMode === 'activities' ? [...myActivities, ...ACTIVITIES] : SCENARIOS;

    const filteredBase = baseData.filter((item) => {
      const matchesSearch = item.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      if (activeFilter === 'All') return matchesSearch;

      let matchesFilter = false;
      if (viewMode === 'activities' && isActivity(item)) {
        matchesFilter = item.type?.toLowerCase() === activeFilter.toLowerCase();
      } else {
        matchesFilter = item.room === activeFilter;
      }
      return matchesFilter && matchesSearch;
    });

    const myCreationsList = filteredBase.filter(
      (item) => item.category === 'My creations',
    );
    const appPool = filteredBase.filter(
      (item) => item.category !== 'My creations',
    );

    const recommendedList = getDynamicRecommendations(appPool, currentState);

    const simpleRecipesList = appPool.filter(
      (item) => item.category === 'Simple recipes',
    );

    return {
      myCreations: myCreationsList,
      recommended: recommendedList,
      simpleRecipes: simpleRecipesList,
      isEmpty: filteredBase.length === 0,
    };
  }, [viewMode, activeFilter, searchQuery, myActivities, currentState]);

  const handleViewModeChange = (mode: 'activities' | 'scenarios') => {
    setViewMode(mode);
    setActiveFilter('All');
    setSearchQuery('');
  };

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView className="flex-1 bg-[#F0F2EB]" edges={['top']}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: Platform.OS === 'ios' ? 20 : 10,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        <HeaderSection
          viewMode={viewMode}
          setViewMode={handleViewModeChange}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        <FilterBar
          options={filterOptions}
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
        />

        {processedData.isEmpty ? (
          <View className="mt-10 px-8 items-center">
            <Ionicons
              name="search-outline"
              size={40}
              color="#8E8E93"
              style={{ marginBottom: 10 }}
            />
            <Text
              className="text-center text-[#8E8E93] text-[16px]"
              style={{ fontFamily: 'Nunito_400Regular' }}
            >
              No {viewMode} found matching &quot;{activeFilter}&quot;.
            </Text>
          </View>
        ) : (
          <>
            {processedData.myCreations.length > 0 && (
              <CarouselSection
                title="My creations"
                data={processedData.myCreations.map((item) => ({
                  ...item,
                  time: isActivity(item) ? getActivityTime(item) : undefined,
                }))}
                showTime={viewMode === 'activities'}
              />
            )}

            {processedData.recommended.length > 0 && (
              <CarouselSection
                title="Recommended"
                data={processedData.recommended.slice(0, 5).map((item) => ({
                  ...item,
                  time: isActivity(item) ? getActivityTime(item) : undefined,
                }))}
                showTime={viewMode === 'activities'}
              />
            )}

            {viewMode === 'activities' &&
              activeFilter === 'Cooking' &&
              processedData.simpleRecipes.length > 0 && (
                <CarouselSection
                  title="Simple recipes"
                  data={processedData.simpleRecipes.map((item) => ({
                    ...item,
                    time: isActivity(item) ? getActivityTime(item) : undefined,
                  }))}
                  showTime={true}
                />
              )}
          </>
        )}
      </ScrollView>
      <FabMenu isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />
    </SafeAreaView>
  );
};

export default UnifiedActivitiesScreen;
