import { CarouselSection } from '@/components/activitiesScenarios/CarouselSection';
import { FabMenu } from '@/components/activitiesScenarios/FabMenu';
import { FilterBar } from '@/components/activitiesScenarios/FilterBar';
import { HeaderSection } from '@/components/activitiesScenarios/HeaderSection';
import { CustomAlert } from '@/components/CustomAlert';
import { FeedbackState } from '@/components/UI/FeedbackState';
import { useBiometrics } from '@/context/BiometricsContext';
import { useSpotify } from '@/context/SpotifyContext';
import { supabase } from '@/utils/supabase';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Activity,
  CONTENTS,
  Scenario,
} from '@/constants/data';
import { resolveCatalogImage } from '@/constants/data/catalogAssets';
import {
  fetchActivityTemplates,
  fetchScenarioTemplates,
  fetchUserScenarios,
  mapUserActivity,
} from '@/utils/catalogTemplates';
import {
  AiActivityIdea,
  fetchAiActivityIdeas,
  getNidushAiErrorMessage,
  saveAiActivityIdea,
} from '@/utils/aiActivities';
import { logger } from '@/utils/logger';
import { getDynamicRecommendations } from '@/utils/recommendationEngine';

const UnifiedActivitiesScreen = () => {
  const { currentState } = useBiometrics();
  const { getUserPlaylists, isAuthenticated } = useSpotify();

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
  const [isAiModalVisible, setIsAiModalVisible] = useState(false);
  const [isGeneratingAiIdeas, setIsGeneratingAiIdeas] = useState(false);
  const [isSavingAiIdeaId, setIsSavingAiIdeaId] = useState<string | null>(null);
  const [aiIdeas, setAiIdeas] = useState<AiActivityIdea[]>([]);
  const [aiRecommendedIdeas, setAiRecommendedIdeas] = useState<AiActivityIdea[]>([]);
  const [isLoadingAiRecommendations, setIsLoadingAiRecommendations] = useState(false);
  const [isSavingAiRecommendationId, setIsSavingAiRecommendationId] = useState<string | null>(null);
  const [aiAlert, setAiAlert] = useState<{
    visible: boolean;
    title: string;
    message: string;
    type: 'error' | 'info';
  }>({
    visible: false,
    title: '',
    message: '',
    type: 'info',
  });

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
      const [activities, scenarios, userScenarios] = await Promise.all([
        fetchActivityTemplates(),
        fetchScenarioTemplates(),
        fetchUserScenarios().catch(() => []),
      ]);
      setActivityTemplates(activities);
      setScenarioTemplates([...userScenarios, ...scenarios]);
    } catch (error) {
      logger.error('Failed to load activity/scenario templates:', error);
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

    logger.debug(`[API] Página ${currentPage}: A pedir do item ${start} ao ${end}...`);

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
    }, [loadActivities, loadTemplates])
  );

  useEffect(() => {
    setAiRecommendedIdeas([]);
    setIsLoadingAiRecommendations(false);
  }, [activeFilter, currentState, searchQuery, viewMode]);

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

  const generateAiIdeas = useCallback(async () => {
    setIsAiModalVisible(true);
    setIsGeneratingAiIdeas(true);

    try {
      const spotifyPlaylists = isAuthenticated
        ? (await getUserPlaylists())
            .slice(0, 15)
            .map((playlist) => ({
              id: playlist.id,
              name: playlist.name,
            }))
        : [];

      const ideas = await fetchAiActivityIdeas({
        mood: currentState,
        activeFilter,
        prompt: searchQuery,
        source: 'activities-ai-modal',
        spotifyPlaylists,
      });

      setAiIdeas(ideas);
    } catch (error: unknown) {
      logger.warn('Failed to generate AI activity ideas:', error);
      const message = await getNidushAiErrorMessage(error);
      setAiAlert({
        visible: true,
        title: 'AI guide unavailable',
        message,
        type: 'info',
      });
      setAiIdeas([]);
    } finally {
      setIsGeneratingAiIdeas(false);
    }
  }, [activeFilter, currentState, getUserPlaylists, isAuthenticated, searchQuery]);

  const saveAiIdea = async (idea: AiActivityIdea) => {
    if (isSavingAiIdeaId) return;

    setIsSavingAiIdeaId(idea.id);

    try {
      const mappedActivity = await saveAiActivityIdea(idea);
      setMyActivities((current) => [mappedActivity, ...current]);
      setAiIdeas((current) => current.filter((item) => item.id !== idea.id));
      setIsAiModalVisible(false);
    } catch (error: unknown) {
      logger.warn('Failed to save AI activity:', error);
      const message = await getNidushAiErrorMessage(error);
      setAiAlert({
        visible: true,
        title: 'Could not save activity',
        message,
        type: 'error',
      });
    } finally {
      setIsSavingAiIdeaId(null);
    }
  };

  const saveAiRecommendation = useCallback(async (idea: AiActivityIdea) => {
    if (isSavingAiRecommendationId) return;

    setIsSavingAiRecommendationId(idea.id);

    try {
      const mappedActivity = await saveAiActivityIdea(idea);
      setMyActivities((current) => [mappedActivity, ...current]);
      setAiRecommendedIdeas((current) => current.filter((item) => item.id !== idea.id));
      router.push({
        pathname: '/activity-details',
        params: {
          id: mappedActivity.id,
          isNew: 'true',
        },
      });
    } catch (error: unknown) {
      logger.warn('Failed to save AI recommendation:', error);
      const message = await getNidushAiErrorMessage(error);
      setAiAlert({
        visible: true,
        title: 'Could not save activity',
        message,
        type: 'error',
      });
    } finally {
      setIsSavingAiRecommendationId(null);
    }
  }, [isSavingAiRecommendationId]);

  const recommendedData = useMemo(() => {
    if (viewMode === 'activities' && aiRecommendedIdeas.length > 0) {
      return aiRecommendedIdeas.map((idea) => ({
        id: idea.id,
        title: idea.title,
        image: resolveCatalogImage(idea.image),
        time: isSavingAiRecommendationId === idea.id ? 'Saving...' : `${idea.durationMinutes} min`,
        room: idea.roomName,
        onPress: () => saveAiRecommendation(idea),
      }));
    }

    return processedData.recommended.slice(0, 5).map((item) => ({
      ...item,
      time: isActivity(item) ? getActivityTime(item) : undefined,
      room: item.room || item.room_id,
    }));
  }, [aiRecommendedIdeas, isSavingAiRecommendationId, processedData.recommended, saveAiRecommendation, viewMode]);

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
          <FeedbackState
            icon="search"
            title={`No ${viewMode} found`}
            message={
              searchQuery
                ? `Nothing matched "${searchQuery}" in ${activeFilter.toLowerCase()}. Try another keyword or clear the filters.`
                : `There is nothing in ${activeFilter.toLowerCase()} yet. Try a different filter or create something new.`
            }
            compact
          />
        ) : (
          <>
            {processedData.myCreations.length > 0 && (
              <CarouselSection
                title="My creations"
                data={processedData.myCreations.map((item) => ({
                  ...item,
                  time: isActivity(item) ? getActivityTime(item) : undefined,
                  room: item.room || item.room_id,
                }))}
                showTime={viewMode === 'activities'}
                onEndReached={() => {
                  if (viewMode === 'activities' && hasMore && !isLoadingRef.current) {
                    loadActivities(true);
                  }
                }}

              />
            )}

            {(recommendedData.length > 0 || isLoadingAiRecommendations) && (
              <CarouselSection
                title="Recommended"
                data={recommendedData}
                showTime={viewMode === 'activities'}
                isLoadingMore={isLoadingAiRecommendations}
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
                    room: item.room || item.room_id,
                  }))}
                  showTime={true}
                />
              )}
          </>
        )}
      </ScrollView>
      <FabMenu
        isOpen={isMenuOpen}
        setIsOpen={setIsMenuOpen}
        onAiActivityPress={generateAiIdeas}
      />

      <Modal
        visible={isAiModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsAiModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/45">
          <View className="bg-[#F8FAF4] rounded-t-[34px] max-h-[86%] pt-5 pb-7">
            <View className="items-center mb-4">
              <View className="w-12 h-1.5 rounded-full bg-[#D6DED2]" />
            </View>

            <View className="px-5 mb-4 flex-row items-start justify-between">
              <View className="flex-1 pr-4">
                <Text
                  className="text-[#354F52] text-[28px]"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  AI activity ideas
                </Text>
                <Text
                  className="text-[#6C7A74] text-sm mt-1"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  Gemini is using your rooms, devices, and recent activities.
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setIsAiModalVisible(false)}
                className="w-10 h-10 rounded-full bg-white items-center justify-center"
                accessibilityRole="button"
                accessibilityLabel="Close AI ideas"
              >
                <Ionicons name="close" size={22} color="#354F52" />
              </TouchableOpacity>
            </View>

            {isGeneratingAiIdeas ? (
              <View className="min-h-[360px] items-center justify-center px-8">
                <ActivityIndicator color="#548F53" size="large" />
                <Text
                  className="text-[#354F52] text-base mt-4 text-center"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  Creating ideas for your home...
                </Text>
              </View>
            ) : (
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 18 }}
              >
                {aiIdeas.map((idea) => (
                  <View
                    key={idea.id}
                    className="bg-white rounded-[28px] overflow-hidden mb-4 border border-[#E3E9DF]"
                  >
                    <Image
                      source={resolveCatalogImage(idea.image)}
                      className="w-full h-[150px]"
                      resizeMode="cover"
                    />

                    <View className="p-5">
                      <View className="flex-row items-start justify-between mb-2">
                        <View className="flex-1 pr-3">
                          <Text
                            className="text-[#354F52] text-xl"
                            style={{ fontFamily: 'Nunito_700Bold' }}
                          >
                            {idea.title}
                          </Text>
                          <Text
                            className="text-[#6C7A74] text-sm mt-1"
                            style={{ fontFamily: 'Nunito_600SemiBold' }}
                          >
                            {idea.roomName} · {idea.durationMinutes} min · {idea.type}
                          </Text>
                        </View>
                        <View className="bg-[#E7F1E3] rounded-full px-3 py-2">
                          <Ionicons name="sparkles-outline" size={18} color="#548F53" />
                        </View>
                      </View>

                      <Text
                        className="text-[#354F52] text-sm leading-5 mb-3"
                        style={{ fontFamily: 'Nunito_400Regular' }}
                      >
                        {idea.description}
                      </Text>

                      <Text
                        className="text-[#6C7A74] text-xs mb-4"
                        style={{ fontFamily: 'Nunito_600SemiBold' }}
                      >
                        {idea.reason}
                      </Text>

                      <TouchableOpacity
                        onPress={() => saveAiIdea(idea)}
                        disabled={isSavingAiIdeaId !== null}
                        className="bg-[#548F53] rounded-full py-4 items-center flex-row justify-center"
                      >
                        {isSavingAiIdeaId === idea.id ? (
                          <ActivityIndicator color="white" size="small" />
                        ) : (
                          <>
                            <Ionicons name="add-circle-outline" size={20} color="white" />
                            <Text
                              className="text-white text-base ml-2"
                              style={{ fontFamily: 'Nunito_700Bold' }}
                            >
                              Save activity
                            </Text>
                          </>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {aiIdeas.length === 0 && (
                  <FeedbackState
                    icon="auto-awesome"
                    title="No ideas just yet"
                    message="The AI did not return suggestions this time. Give it another moment and try again."
                    compact
                  />
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
      <CustomAlert
        visible={aiAlert.visible}
        title={aiAlert.title}
        message={aiAlert.message}
        type={aiAlert.type}
        confirmText="OK"
        onClose={() =>
          setAiAlert((current) => ({
            ...current,
            visible: false,
          }))
        }
      />
    </SafeAreaView>
  );
};

export default UnifiedActivitiesScreen;
