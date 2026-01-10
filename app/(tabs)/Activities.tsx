import React, { useState, useCallback } from 'react';
import {
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Platform,
  Pressable,
  Text,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  useFonts,
  Nunito_700Bold,
  Nunito_600SemiBold,
  Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from 'expo-router';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 48) / 2;

const ALL_ACTIVITIES = [
  {
    id: '1',
    title: 'Italian Night',
    room: 'Kitchen',
    time: '45 min',
    image: require('@/assets/cooking_activities/my_creations_cooking/italian_night.png'),
    category: 'My creations',
  },
  {
    id: '2',
    title: 'Sunrise Flow',
    room: 'Living Room',
    time: '15 min',
    image: require('@/assets/activities_for_you/sunrise_flow.png'),
    category: 'My creations',
  },
  {
    id: '3',
    title: 'Gratitude Flow',
    room: 'Living Room',
    time: '10 min',
    image: require('@/assets/meditation_activities/my_creations/gratitude_flow.png'),
    category: 'My creations',
  },
  {
    id: '4',
    title: 'Forest Bathing',
    room: 'Living Room',
    time: '20 min',
    image: require('@/assets/Scenarios/forest_bathing.png'),
    category: 'Recommended',
  },
  {
    id: '5',
    title: 'Morning Zen',
    room: 'Living Room',
    time: '12 min',
    image: require('@/assets/meditation_content/video_sessions/morning_zen.png'),
    category: 'Recommended',
  },
  {
    id: '6',
    title: 'Eggs Benedict',
    room: 'Kitchen',
    time: '20 min',
    image: require('@/assets/cooking_activities/recommended/eggs_benedict.png'),
    category: 'Recommended',
  },
  {
    id: '7',
    title: 'Vodka Pasta',
    room: 'Kitchen',
    time: '25 min',
    image: require('@/assets/cooking_activities/simple_recipes/vodka_pasta.png'),
    category: 'Simple recipes',
  },
  {
    id: '8',
    title: 'Chicken Rice',
    room: 'Kitchen',
    time: '30 min',
    image: require('@/assets/cooking_activities/simple_recipes/chicken_rice.png'),
    category: 'Simple recipes',
  },
  {
    id: '9',
    title: 'Chocolate Cake',
    room: 'Kitchen',
    time: '45 min',
    image: require('@/assets/cooking_activities/simple_recipes/chocolate_cake.png'),
    category: 'Simple recipes',
  },
  {
    id: '10',
    title: 'Pasta Primo',
    room: 'Kitchen',
    time: '15 min',
    image: require('@/assets/cooking_activities/simple_recipes/pasta.png'),
    category: 'Simple recipes',
  },
];

const SCENARIOS_DATA = [
  {
    id: 's1',
    title: 'Desert Heat',
    room: 'Living Room',
    image: require('@/assets/Scenarios/desert_heat.png'),
    category: 'My creations',
  },
  {
    id: 's2',
    title: 'Deep Focus',
    room: 'Bedroom',
    image: require('@/assets/Scenarios/deep_focus.png'),
    category: 'My creations',
  },
  {
    id: 's3',
    title: 'Forest Bathing',
    room: 'Bedroom',
    image: require('@/assets/Scenarios/forest_bathing.png'),
    category: 'Recommended',
  },
  {
    id: 's4',
    title: 'Slow Cooking',
    room: 'Kitchen',
    image: require('@/assets/Scenarios/slow_cooking.png'),
    category: 'Recommended',
  },
];

export default function UnifiedActivitiesScreen() {
  const [viewMode, setViewMode] = useState<'activities' | 'scenarios'>(
    'activities',
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [myActivities, setMyActivities] = useState<any[]>([]);

  // Carregar atividades do AsyncStorage
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

  // Filtros Dinâmicos
  const currentBaseData =
    viewMode === 'activities'
      ? [...myActivities, ...ALL_ACTIVITIES]
      : SCENARIOS_DATA;

  const filteredData = currentBaseData.filter((item) => {
    const matchesFilter = activeFilter === 'All' || item.room === activeFilter;
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const myCreations = filteredData.filter(
    (item) => item.category === 'My creations',
  );
  const recommended = filteredData.filter(
    (item) => item.category === 'Recommended',
  );
  const simpleRecipes = filteredData.filter(
    (item) => item.category === 'Simple recipes',
  );

  return (
    <SafeAreaView className="flex-1 bg-[#F0F2EB]" edges={['top']}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: Platform.OS === 'ios' ? 20 : 10,
          paddingBottom: 120,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* HEADER SELECTOR */}
        <View className="px-4">
          <View className="flex-row bg-[#F0F2EB] rounded-[30px] p-1 border border-[#354F52] mb-[15px] h-[50px] mt-4">
            <TouchableOpacity
              onPress={() => setViewMode('activities')}
              className={`flex-1 justify-center items-center rounded-[25px] ${viewMode === 'activities' ? 'bg-[#548F53]' : ''}`}
            >
              <Text
                className={`${viewMode === 'activities' ? 'text-white' : 'text-[#2D3E27]'} text-[14px]`}
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                Activities
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setViewMode('scenarios')}
              className={`flex-1 justify-center items-center rounded-[25px] ${viewMode === 'scenarios' ? 'bg-[#548F53]' : ''}`}
            >
              <Text
                className={`${viewMode === 'scenarios' ? 'text-white' : 'text-[#2D3E27]'} text-[14px]`}
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                Scenarios
              </Text>
            </TouchableOpacity>
          </View>

          {/* SEARCH BAR */}
          <View className="flex-row items-center bg-[#F0F2EB] rounded-[12px] px-3 h-[42px] border border-[#354F52] mb-4">
            <Ionicons name="search" size={18} color="#8E8E93" />
            <TextInput
              placeholder="Search..."
              placeholderTextColor="#8E8E93"
              className="flex-1 text-[14px] ml-2 h-full"
              style={{ fontFamily: 'Nunito_400Regular' }}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {/* FILTERS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mb-6"
          >
            {['All', 'Bedroom', 'Living Room', 'Kitchen'].map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                className={`px-4 h-9 rounded-[18px] border mr-2 justify-center items-center ${
                  activeFilter === filter
                    ? 'bg-[#BBE6BA] border-[#354F52]'
                    : 'bg-[#F0F2EB] border-[#354F52]'
                }`}
              >
                <Text
                  className={`text-[13px] ${activeFilter === filter ? 'text-[#2D3E27]' : 'text-[#354F52]'}`}
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* CONTEÚDO DINÂMICO BASEADO NO VIEWMODE */}
        {viewMode === 'activities' ? (
          <>
            <CarouselSection
              title="My creations"
              data={myCreations}
              showTime={true}
            />
            <CarouselSection
              title="Recommended"
              data={recommended}
              showTime={true}
            />
            <CarouselSection
              title="Simple recipes"
              data={simpleRecipes}
              showTime={true}
            />
          </>
        ) : (
          <>
            <GridSection title="My creations" data={myCreations} />
            <GridSection title="Recommended" data={recommended} />
          </>
        )}

        {filteredData.length === 0 && (
          <Text
            className="text-center mt-10 text-[#8E8E93] px-4"
            style={{ fontFamily: 'Nunito_400Regular' }}
          >
            No items found.
          </Text>
        )}
      </ScrollView>

      {/* FAB MENU */}
      {isMenuOpen && (
        <>
          <Pressable
            className="absolute inset-0 bg-black/20 z-[5]"
            onPress={() => setIsMenuOpen(false)}
          />
          <View className="absolute bottom-[110px] right-[25px] items-end z-[11]">
            <TouchableOpacity
              onPress={() => {
                setIsMenuOpen(false);
                router.push('/new-scenario');
              }}
            >
              <Text
                className="bg-[#548F53] px-8 py-3 rounded-xl text-[14px] text-white shadow-md mb-4"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                Scenario
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                setIsMenuOpen(false);
                router.push('/new-activity');
              }}
            >
              <Text
                className="bg-[#548F53] px-6 py-3 rounded-xl text-[14px] text-white shadow-md"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                Activity
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      <TouchableOpacity
        activeOpacity={0.9}
        className="absolute bottom-8 right-6 bg-[#548F53] w-[65px] h-[65px] rounded-full justify-center items-center z-[10] shadow-lg shadow-black/40"
        onPress={() => setIsMenuOpen(!isMenuOpen)}
      >
        <Ionicons name={isMenuOpen ? 'close' : 'add'} size={36} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

// --- COMPONENTE DE CARROSSEL (ATIVIDADES) ---
function CarouselSection({
  title,
  data,
  showTime,
}: {
  title: string;
  data: any[];
  showTime?: boolean;
}) {
  if (data.length === 0) return null;
  return (
    <View className="mb-8">
      <View className="flex-row items-center mb-4 px-4">
        <Text
          className="text-[22px] text-[#354F52] mr-1"
          style={{ fontFamily: 'Nunito_700Bold' }}
        >
          {title}
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#548F53" />
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
      >
        {data.map((item) => (
          <TouchableOpacity
            key={item.id}
            className="w-[165px] aspect-square mr-4"
            onPress={() =>
              router.push({
                pathname: '/activity-details',
                params: { id: item.id },
              })
            }
          >
            <ImageBackground
              source={
                typeof item.image === 'string'
                  ? { uri: item.image }
                  : item.image
              }
              className="flex-1 justify-end overflow-hidden"
              imageStyle={{ borderRadius: 20 }}
            >
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.85)']}
                className="p-3 h-full justify-end rounded-[20px]"
              >
                <Text
                  className="text-white text-[15px] mb-0.5"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                {showTime && (
                  <View className="flex-row items-center mt-1">
                    <Ionicons name="time-outline" size={13} color="white" />
                    <Text
                      className="text-white text-[11px] ml-1"
                      style={{ fontFamily: 'Nunito_400Regular' }}
                    >
                      {item.time}
                    </Text>
                  </View>
                )}
                <View className="flex-row items-center mt-0.5">
                  <MaterialCommunityIcons
                    name="door-open"
                    size={13}
                    color="white"
                  />
                  <Text
                    className="text-white text-[11px] ml-1"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  >
                    {item.room}
                  </Text>
                </View>
              </LinearGradient>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

// --- COMPONENTE DE GRADE (SCENARIOS) ---
function GridSection({ title, data }: { title: string; data: any[] }) {
  if (data.length === 0) return null;
  return (
    <View className="mb-8 px-4">
      <View className="flex-row items-center mb-4">
        <Text
          className="text-[22px] text-[#354F52] mr-1"
          style={{ fontFamily: 'Nunito_700Bold' }}
        >
          {title}
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#548F53" />
      </View>
      <View className="flex-row flex-wrap justify-between">
        {data.map((item) => (
          <View
            key={item.id}
            style={{ width: COLUMN_WIDTH }}
            className="aspect-square mb-4"
          >
            <ImageBackground
              source={
                typeof item.image === 'string'
                  ? { uri: item.image }
                  : item.image
              }
              className="flex-1 justify-end p-3 overflow-hidden"
              imageStyle={{ borderRadius: 20 }}
            >
              <View>
                <Text
                  className="text-white text-[16px]"
                  style={{
                    fontFamily: 'Nunito_700Bold',
                    textShadowColor: 'rgba(0, 0, 0, 0.75)',
                    textShadowOffset: { width: 0, height: 1 },
                    textShadowRadius: 3,
                  }}
                >
                  {item.title}
                </Text>
                <View className="flex-row items-center mt-1">
                  <MaterialCommunityIcons
                    name="door-open"
                    size={14}
                    color="white"
                  />
                  <Text
                    className="text-white text-[11px] ml-1"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  >
                    {item.room}
                  </Text>
                </View>
              </View>
            </ImageBackground>
          </View>
        ))}
      </View>
    </View>
  );
}
