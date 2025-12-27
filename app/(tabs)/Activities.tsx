import React, { useState } from 'react';
import {
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Platform,
  Pressable,
  Text,
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
    title: 'Romantic Dinner',
    room: 'Kitchen',
    time: '50 min',
    image: require('@/assets/cooking_activities/my_creations_cooking/romantic_dinner.png'),
    category: 'My creations',
  },
  {
    id: '3',
    title: 'Brownies',
    room: 'Kitchen',
    time: '15 min',
    image: require('@/assets/cooking_activities/recommended/brownies.png'),
    category: 'Recommended',
  },
  {
    id: '4',
    title: 'Pikelets',
    room: 'Kitchen',
    time: '50 min',
    image: require('@/assets/cooking_activities/recommended/eggs_benedict.png'),
    category: 'Recommended',
  },
];

export default function ActivitiesScreen() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  let [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Nunito_600SemiBold,
    Nunito_400Regular,
  });

  if (!fontsLoaded) return null;

  const filteredData = ALL_ACTIVITIES.filter((item) => {
    const matchesFilter = activeFilter === 'All' || item.room === activeFilter;
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const myCreations = filteredData.filter((item) => item.category === 'My creations');
  const recommended = filteredData.filter((item) => item.category === 'Recommended');

  return (
    <SafeAreaView className="flex-1 bg-[#F0F2EB]" edges={['top']}>
      <ScrollView
        contentContainerStyle={{ 
          paddingHorizontal: 16, 
          paddingTop: Platform.OS === 'ios' ? 20 : 10,
          paddingBottom: 120 
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* TABS SELETOR  */}
        <View className="flex-row bg-[#F0F2EB] rounded-[30px] p-1 border border-[#354F52] mb-[15px] h-[50px] mt-4">
          <TouchableOpacity className="flex-1 justify-center items-center rounded-[25px] bg-[#548F53]">
            <Text className="text-white text-[14px]" style={{ fontFamily: 'Nunito_600SemiBold' }}>
              Activities
            </Text>
          </TouchableOpacity>
          <TouchableOpacity className="flex-1 justify-center items-center rounded-[25px]">
            <Text className="text-[#2D3E27] text-[14px]" style={{ fontFamily: 'Nunito_600SemiBold' }}>
              Scenarios
            </Text>
          </TouchableOpacity>
        </View>

        {/* BARRA DE PESQUISA  */}
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

        {/* FILTROS HORIZONTAIS */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          {['All', 'Bedroom', 'Living Room', 'Kitchen'].map((filter) => (
            <TouchableOpacity
              key={filter}
              onPress={() => setActiveFilter(filter)}
              className={`px-4 h-9 rounded-[18px] border mr-2 justify-center items-center ${
                activeFilter === filter ? 'bg-[#BBE6BA] border-[#354F52]' : 'bg-[#F0F2EB] border-[#354F52]'
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

        {/* SEÇÃO: MY CREATIONS */}
        {myCreations.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-4">
              <Text className="text-[20px] text-[#354F52] mr-1" style={{ fontFamily: 'Nunito_700Bold' }}>
                My creations
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#548F53" />
            </View>
            <View className="flex-row flex-wrap justify-between">
              {myCreations.map((item) => (
                <ScenarioCard key={item.id} {...item} />
              ))}
            </View>
          </View>
        )}

        {/* SEÇÃO: RECOMMENDED */}
        {recommended.length > 0 && (
          <View className="mb-6">
            <View className="flex-row items-center mb-4">
              <Text className="text-[20px] text-[#354F52] mr-1" style={{ fontFamily: 'Nunito_700Bold' }}>
                Recommended
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#548F53" />
            </View>
            <View className="flex-row flex-wrap justify-between">
              {recommended.map((item) => (
                <ScenarioCard key={item.id} {...item} />
              ))}
            </View>
          </View>
        )}

        {/* Mensagem de vazio do comentário */}
        {filteredData.length === 0 && (
          <Text className="text-center mt-[50%] text-[#8E8E93]" style={{ fontFamily: 'Nunito_400Regular' }}>
            No activities found.
          </Text>
        )}
      </ScrollView>

      {/* FAB MENU - Logica do comentário */}
      {isMenuOpen && (
        <>
          <Pressable 
            className="absolute inset-0 bg-black/20 z-[5]" 
            onPress={() => setIsMenuOpen(false)} 
          />
          <View className="absolute bottom-[110px] right-[25px] items-end z-[11]">
            <TouchableOpacity 
              className="mb-4" 
              onPress={() => {
                setIsMenuOpen(false);
                router.push('/new-activity');
              }}
            >
              <Text className="bg-[#548F53] px-5 py-2 rounded-xl text-white overflow-hidden shadow-md" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                Activity
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setIsMenuOpen(false)}>
              <Text className="bg-[#548F53] px-5 py-2 rounded-xl text-white overflow-hidden shadow-md" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                Scenario
              </Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* FAB PRINCIPAL */}
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

function ScenarioCard({ title, room, image, time }: any) {
  return (
    <View className="w-[48%] aspect-square mb-4">
      <ImageBackground
        source={image}
        className="flex-1 justify-end overflow-hidden"
        imageStyle={{ borderRadius: 20 }}
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          className="p-3 h-full justify-end rounded-[20px]"
        >
          <Text className="text-white text-[16px] mb-1" style={{ fontFamily: 'Nunito_700Bold' }} numberOfLines={1}>
            {title}
          </Text>
          <View className="flex-row items-center mt-1">
            <Ionicons name="time-outline" size={14} color="white" />
            <Text className="text-white text-[12px] ml-1" style={{ fontFamily: 'Nunito_400Regular' }}>
              {time}
            </Text>
          </View>
          <View className="flex-row items-center mt-1">
            <MaterialCommunityIcons name="door-open" size={14} color="white" />
            <Text className="text-white text-[12px] ml-1" style={{ fontFamily: 'Nunito_400Regular' }}>
              {room}
            </Text>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}