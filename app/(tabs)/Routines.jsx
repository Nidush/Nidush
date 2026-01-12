import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import CategoryPill from '../../components/rooms/CategoryPill';
import RoutineCard from '../../components/routines/RoutineCard';

export default function Routines() {
  const [activeCategoryId, setActiveCategoryId] = useState(1);
  const [routines, setRoutines] = useState([
    { id: 1, title: 'Sunrise Awakening', days: 'Mon-Fri', time: '7:15 am', room: 'Bedroom', active: true, image: require('../../assets/Scenarios/routines/sunrise_awakening.png') },
    { id: 2, title: 'Gym Hour', days: 'Tue & Thu', time: '6:00 pm', room: 'Living Room', active: false, image: require('../../assets/Scenarios/routines/gym_hour.png') },
    { id: 3, title: 'Morning Kitchen Prep', days: 'Mon-Fri', time: '8:00 am', room: 'Kitchen', active: true, image: require('../../assets/Scenarios/routines/morning_kitchen_prep.png') },
    { id: 4, title: 'Weekend Sleep-In', days: 'Sat & Sun', time: '10:30 am', room: 'Bedroom', active: false, image: require('../../assets/Scenarios/routines/weekend_sleep_in.png') },
    { id: 5, title: 'Deep Sleep Transition', days: 'Daily', time: '11:30 pm', room: 'Bedroom', active: true, image: require('../../assets/Scenarios/routines/deep_sleep_transition.png') },
  ]);

  const toggleRoutine = (id) => {
    setRoutines((current) => current.map((r) => r.id === id ? { ...r, active: !r.active } : r));
  };

  const ROUTINE_CATEGORIES = [{ id: 1, name: 'All' }, { id: 2, name: 'Morning' }, { id: 3, name: 'Afternoon' }, { id: 4, name: 'Evening' }];

  return (
    <SafeAreaView className="flex-1 bg-[#F1F3EA]" edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="items-center mt-2 mb-6">
        <Text className="text-3xl font-semibold text-[#354F52]" style={{ fontFamily: 'Nunito_600SemiBold' }}>
          Routines
        </Text>
      </View>

      {/* Search Bar */}
      <View className="px-5 mb-6">
        <View className="flex-row items-center border border-[#BDC7C2] rounded-full px-4 h-12 bg-transparent">
          <MaterialIcons name="search" size={24} color="#7A8C85" />
          <TextInput
            placeholder="Search..."
            placeholderTextColor="#7A8C85"
            className="flex-1 h-full text-base text-[#2C3A35] ml-2"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          />
        </View>
      </View>

      {/* Categorias */}
      <View className="h-10 mb-9">
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {ROUTINE_CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat.id}
              item={cat}
              isActive={activeCategoryId === cat.id}
              onPress={setActiveCategoryId}
            />
          ))}
        </ScrollView>
      </View>

      {/* Lista */}
      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }} 
        showsVerticalScrollIndicator={false}
      >
        {routines.map((item) => (
          <RoutineCard
            key={item.id}
            {...item}
            onToggle={() => toggleRoutine(item.id)}
          />
        ))}
      </ScrollView>

      {/* Botão de Adição Direto */}
      <TouchableOpacity
        activeOpacity={0.9}
        className="absolute bottom-10 right-6 bg-[#548F53] w-[64px] h-[64px] rounded-full justify-center items-center shadow-lg shadow-black/30"
        onPress={() => console.log("Navegar para Create Routine")}
      >
        <Ionicons name="add" size={38} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}