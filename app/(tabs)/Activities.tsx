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
  Activity,
  CONTENTS,
  Scenario,
} from '@/constants/data';
import {
  fetchActivityTemplates,
  fetchScenarioTemplates,
  mapUserActivity,
} from '@/utils/catalogTemplates';
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
  const [activityTemplates, setActivityTemplates] = useState<Activity[]>([]);
  const [scenarioTemplates, setScenarioTemplates] = useState<Scenario[]>([]);
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

  const loadTemplates = useCallback(async () => {
    try {
      const [activities, scenarios] = await Promise.all([
        fetchActivityTemplates(),
        fetchScenarioTemplates(),
      ]);
      setActivityTemplates(activities);
      setScenarioTemplates(scenarios);
    } catch (error) {
      console.error('Failed to load activity/scenario templates:', error);
      setActivityTemplates([]);
      setScenarioTemplates([]);
    }
  }, []);

  const loadActivities = useCallback(async (isNextPage = false) => {
    if (isLoadingRef.current) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setMyActivities([]);
      return;
    }

    const { data: homeAssoc } = await supabase
      .from('user_homes')
      .select('home_id')
      .eq('user_id', user.id)
      .maybeSingle();

    isLoadingRef.current = true;
    const currentPage = isNextPage ? page + 1 : 0;
    const start = currentPage * PAGE_SIZE;
    const end = start + PAGE_SIZE - 1;

    console.log(`[API] Página ${currentPage}: A pedir do item ${start} ao ${end}...`);

    let query = supabase
      .from('activities')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(start, end);

    if (homeAssoc?.home_id) {
      query = query.eq('home_id', homeAssoc.home_id);
    } else {
      query = query.eq('user_id', user.id);
    }


    if (debouncedSearchQuery) {
      query = query.ilike('title', `%${debouncedSearchQuery}%`);
    }

    const { data, error, count } = await query;

    if (!error && data) {
      const mapped = data.map(mapUserActivity);

      if (isNextPage) {
        setMyActivities(prev => [...prev, ...mapped]);
      } else {
        setMyActivities(mapped);
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
      loadTemplates();
      loadActivities();
    }, [debouncedSearchQuery, loadTemplates])
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
    const dedupeById = (items: (Activity | Scenario)[]) => {
      const seen = new Set<string | number>();
      return items.filter((item) => {
        const key = String(item.id);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    };

    const userActivityData = viewMode === 'activities' ? dedupeById(myActivities) : [];
    const catalogData = dedupeById(
      viewMode === 'activities' ? activityTemplates : scenarioTemplates,
    );

    const matchesActiveView = (item: Activity | Scenario) => {
      const matchesSearch = item.title
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      if (activeFilter === 'All') return matchesSearch;

      let matchesFilter = false;
      if (viewMode === 'activities' && isActivity(item)) {
        matchesFilter = item.type?.toLowerCase() === activeFilter.toLowerCase();
      } else {
        matchesFilter = ((item as Scenario).room || item.room_id)?.toLowerCase() === activeFilter.toLowerCase();
      }
      return matchesFilter && matchesSearch;
    };

    const filteredUserActivities = userActivityData.filter(matchesActiveView);
    const filteredCatalog = catalogData.filter(matchesActiveView);

    const myCreationsList =
      viewMode === 'activities'
        ? filteredUserActivities
        : filteredCatalog.filter((item) => item.category === 'My creations');

    const appPool =
      viewMode === 'activities'
        ? filteredCatalog
        : filteredCatalog.filter((item) => item.category !== 'My creations');

    const recommendedPool = appPool.filter(
      (item) => item.category !== 'Simple recipes',
    );

    const recommendedList = getDynamicRecommendations(recommendedPool, currentState);

    const simpleRecipesList = appPool.filter(
      (item) => item.category === 'Simple recipes',
    );

    return {
      myCreations: myCreationsList,
      recommended: recommendedList,
      simpleRecipes: simpleRecipesList,
      isEmpty: filteredUserActivities.length + filteredCatalog.length === 0,
    };
  }, [viewMode, activeFilter, searchQuery, myActivities, activityTemplates, scenarioTemplates, currentState]);

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
