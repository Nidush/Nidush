import { CarouselSection } from '@/components/activitiesScenarios/CarouselSection';
import { FabMenu } from '@/components/activitiesScenarios/FabMenu';
import { FilterBar } from '@/components/activitiesScenarios/FilterBar';
import { HeaderSection } from '@/components/activitiesScenarios/HeaderSection';
import { useBiometrics } from '@/context/BiometricsContext';
import { supabase } from '@/utils/supabase';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState('');
  const [myActivities, setMyActivities] = useState<Activity[]>([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const isLoadingRef = useRef(false);
  const PAGE_SIZE = 10;

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const loadActivities = useCallback(async (isNextPage = false) => {
    if (isLoadingRef.current) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMyActivities([]);
      return;
    }

    isLoadingRef.current = true;
    const currentPage = isNextPage ? page + 1 : 0;
    const start = currentPage * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    console.log(`[API] Página ${currentPage}: A pedir do item ${start} ao ${end}...`);

    let query = supabase
      .from('activities')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .range(start, end);


    if (debouncedSearchQuery) {
      query = query.ilike('title', `%${debouncedSearchQuery}%`);
    }

    const { data, error, count } = await query;

    if (!error && data) {
      const mapped = data.map(d => ({
        id: d.id,
        title: d.title,
        description: d.description,
        room_id: d.room_id,
        image: d.image,
        category: d.category,
        type: d.type,
        content_id: d.content_id,
        scenario_id: d.scenario_id,
        shortcuts: d.shortcuts === true || d.shortcuts === 'true',
      }));

      if (isNextPage) {
        setMyActivities(prev => [...prev, ...mapped as any]);
      } else {
        setMyActivities(mapped as any);
      }

      setPage(currentPage);
      if (count !== null) {
        setHasMore(start + mapped.length < count);
      }
    } else {
      if (!isNextPage) setMyActivities([]);
    }
    isLoadingRef.current = false;
  }, [debouncedSearchQuery, page]);

  useFocusEffect(
    useCallback(() => {
      loadActivities();
    }, [debouncedSearchQuery]) // Only fetch again if search changes
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
    const cId = activity.content_id || activity.contentId;
    if (cId && CONTENTS[cId]) {
      return CONTENTS[cId].duration;
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
        matchesFilter = item.room_id === activeFilter;
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
    <SafeAreaView
      className="flex-1 bg-[#F0F2EB]"
      edges={['top']}
      accessibilityLanguage="en-US"
    >
      <ScrollView
        scrollEventThrottle={16}
        importantForAccessibility={isMenuOpen ? 'no-hide-descendants' : 'auto'}
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
          <View
            className="mt-10 px-8 items-center"
            accessible={true}
            accessibilityLabel={`No ${viewMode} found matching "${activeFilter}"`}
          >
            <Ionicons
              name="search-outline"
              size={40}
              color="#8E8E93"
              style={{ marginBottom: 10 }}
              importantForAccessibility="no"
              accessibilityElementsHidden={true}
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
                  room: item.room || (item as any).room_id,
                }))}
                showTime={viewMode === 'activities'}
                onEndReached={() => {
                  if (viewMode === 'activities' && hasMore && !isLoadingRef.current) {
                    loadActivities(true);
                  }
                }}

              />
            )}

            {processedData.recommended.length > 0 && (
              <CarouselSection
                title="Recommended"
                data={processedData.recommended.slice(0, 5).map((item) => ({
                  ...item,
                  time: isActivity(item) ? getActivityTime(item) : undefined,
                  room: item.room || (item as any).room_id,
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
                    room: item.room || (item as any).room_id,
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
