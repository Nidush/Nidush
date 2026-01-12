import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router'; // Importante para a navegação
import React, { useState } from 'react';
import { ScrollView, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import RoutineCard from '../../components/routines/RoutineCard';

export default function Routines() {
  const router = useRouter(); // Hook de navegação
  const [activeCategoryId, setActiveCategoryId] = useState(1);
  
  const [routines, setRoutines] = useState([
    { id: 1, title: 'Sunrise Awakening', days: 'Mon-Fri', time: '7:15 am', room: 'Bedroom', active: true, image: require('../../assets/Scenarios/routines/sunrise_awakening.png') },
    { id: 2, title: 'Gym Hour', days: 'Tue & Thu', time: '6:00 pm', room: 'Living Room', active: false, image: require('../../assets/Scenarios/routines/gym_hour.png') },
    { id: 3, title: 'Morning Kitchen Prep', days: 'Mon-Fri', time: '8:00 am', room: 'Kitchen', active: true, image: require('../../assets/Scenarios/routines/morning_kitchen_prep.png') },
    { id: 4, title: 'Weekend Sleep-In', days: 'Sat & Sun', time: '10:30 am', room: 'Bedroom', active: false, image: require('../../assets/Scenarios/routines/weekend_sleep_in.png') },
    { id: 5, title: 'Deep Sleep Transition', days: 'Daily', time: '11:30 pm', room: 'Bedroom', active: true, image: require('../../assets/Scenarios/routines/deep_sleep_transition.png') },
  ]);

  const toggleRoutine = (id: number) => {
    setRoutines((current) =>
      current.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F0F2EB]" edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="items-center mt-2 mb-6">
        <Text className="text-3xl font-semibold text-[#354F52]" style={{ fontFamily: 'Nunito_600SemiBold' }}>
          Routines
        </Text>
      </View>

      {/* Search Bar */}
      <View className="px-5 mb-6">
        <View className="flex-row items-center border border-[#BDC7C2] rounded-full px-4 h-12 bg-[#F8F9F5]">
          <MaterialIcons name="search" size={24} color="#7A8C85" />
          <TextInput
            placeholder="Search..."
            placeholderTextColor="#7A8C85"
            className="flex-1 h-full text-base text-[#2C3A35] ml-2"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          />
        </View>
      </View>

      {/* Lista de Rotinas */}
      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
        {routines.map((item) => (
          <RoutineCard
            isActive={false} key={item.id}
            {...item}
            onToggle={() => toggleRoutine(item.id)}          />
        ))}
      </ScrollView>

      {/* Botão + Ligado à página New Scenario */}
      <TouchableOpacity
        activeOpacity={0.9}
        className="absolute bottom-10 right-6 bg-[#548F53] w-[65px] h-[65px] rounded-full justify-center items-center shadow-lg shadow-black/40"
        onPress={() => router.push('/new-scenario')} // Certifica-te que o caminho coincide com o nome do ficheiro
      >
        <Ionicons name="add" size={40} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}