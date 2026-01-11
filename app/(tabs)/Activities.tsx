import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Platform, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- IMPORTS ---
import { CarouselSection } from '@/components/activitiesScenarios/CarouselSection';
import { FabMenu } from '@/components/activitiesScenarios/FabMenu';
import { FilterBar } from '@/components/activitiesScenarios/FilterBar';
import { HeaderSection } from '@/components/activitiesScenarios/HeaderSection';

// --- DADOS ---
import { ACTIVITIES, Activity, CONTENTS, SCENARIOS } from '@/constants/data';

const UnifiedActivitiesScreen = () => {
  // --- STATE ---
  const [viewMode, setViewMode] = useState<'activities' | 'scenarios'>(
    'activities',
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [myActivities, setMyActivities] = useState<Activity[]>([]);

  // --- EFEITOS ---
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

  if (!fontsLoaded) return null;

  // --- LÓGICA DE NEGÓCIO ---

  const filterOptions =
    viewMode === 'activities'
      ? ['All', 'Cooking', 'Audiobooks', 'Meditation', 'Workout']
      : ['All', 'Bedroom', 'Living Room', 'Kitchen'];

  const handleViewModeChange = (mode: 'activities' | 'scenarios') => {
    setViewMode(mode);
    setActiveFilter('All');
    setSearchQuery('');
  };

  // Filtragem
  const currentBaseData =
    viewMode === 'activities' ? [...myActivities, ...ACTIVITIES] : SCENARIOS;

  const filteredData = currentBaseData.filter((item: any) => {
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    if (activeFilter === 'All') return matchesSearch;

    let matchesFilter = false;
    if (viewMode === 'activities') {
      const itemType = item.type ? item.type.toLowerCase() : '';
      const filterName = activeFilter.toLowerCase();
      matchesFilter = itemType === filterName;
    } else {
      matchesFilter = item.room === activeFilter;
    }
    return matchesFilter && matchesSearch;
  });

  // Categorização
  const myCreations = filteredData.filter(
    (item) => item.category === 'My creations',
  );
  const recommended = filteredData.filter(
    (item) => item.category === 'Recommended',
  );
  const simpleRecipes = filteredData.filter(
    (item) => item.category === 'Simple recipes',
  );

  // Lógica de visualização limitada para 'Recommended' quando filtro é All
  const displayedRecommended =
    activeFilter === 'All' ? recommended.slice(0, 10) : recommended;

  // --- HELPER PARA OBTER O TEMPO DO CONTEÚDO ---
  const getActivityTime = (activity: Activity) => {
    if (activity.contentId && CONTENTS[activity.contentId]) {
      return CONTENTS[activity.contentId].duration;
    }
    return undefined;
  };

  const isActivity = (item: Activity | any): item is Activity => {
    return 'type' in item;
  };

  // --- RENDER ---
  return (
    <SafeAreaView className="flex-1 bg-[#F0F2EB]" edges={['top']}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: Platform.OS === 'ios' ? 20 : 10,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Header */}
        <HeaderSection
          viewMode={viewMode}
          setViewMode={handleViewModeChange}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />

        {/* 2. Filtros */}
        <FilterBar
          options={filterOptions}
          activeFilter={activeFilter}
          onSelectFilter={setActiveFilter}
        />

        {/* 3. Conteúdo Principal */}
        {viewMode === 'activities' ? (
          // --- MODO ATIVIDADES ---
          <>
            <CarouselSection
              title="My creations"
              // AQUI ESTÁ A MUDANÇA: Injetamos o tempo usando .map()
              data={myCreations.map((item) => ({
                ...item,
                time: isActivity(item) ? getActivityTime(item) : undefined,
              }))}
              showTime={true}
            />
            <CarouselSection
              title="Recommended"
              // AQUI TAMBÉM
              data={displayedRecommended.map((item) => ({
                ...item,
                time: isActivity(item) ? getActivityTime(item) : undefined,
              }))}
              showTime={true}
            />
            {activeFilter !== 'All' && (
              <CarouselSection
                title="Simple recipes"
                // E AQUI TAMBÉM
                data={simpleRecipes.map((item) => ({
                  ...item,
                  time: isActivity(item) ? getActivityTime(item) : undefined,
                }))}
                showTime={true}
              />
            )}
          </>
        ) : (
          // --- MODO CENÁRIOS ---
          <>
            <CarouselSection
              title="My creations"
              data={myCreations}
              showTime={false}
            />
            <CarouselSection
              title="Recommended"
              data={displayedRecommended}
              showTime={false}
            />
          </>
        )}

        {/* 4. Estado Vazio */}
        {filteredData.length === 0 && (
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
        )}
      </ScrollView>

      {/* 5. Menu Flutuante */}
      <FabMenu isOpen={isMenuOpen} setIsOpen={setIsMenuOpen} />
    </SafeAreaView>
  );
};

export default UnifiedActivitiesScreen;
