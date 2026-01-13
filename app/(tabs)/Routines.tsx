import { MaterialIcons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AddRoomDevice from '../../components/rooms/AddRoomDevice';
import RoutineCard from '../../components/routines/RoutineCard';


interface Routine {
  id: number;
  title: string;
  days: string;
  time: string;
  room: string;
  active: boolean;
  image: any;
}

export default function Routines() {
  // Estado das rotinas
  const [routines, setRoutines] = useState<Routine[]>([
    { id: 1, title: 'Sunrise Awakening', days: 'Mon-Fri', time: '7:15 am', room: 'Bedroom', active: true, image: require('../../assets/Scenarios/routines/sunrise_awakening.png') },
    { id: 2, title: 'Gym Hour', days: 'Tue & Thu', time: '6:00 pm', room: 'Living Room', active: false, image: require('../../assets/Scenarios/routines/gym_hour.png') },
    { id: 3, title: 'Morning Kitchen Prep', days: 'Mon-Fri', time: '8:00 am', room: 'Kitchen', active: true, image: require('../../assets/Scenarios/routines/morning_kitchen_prep.png') },
    { id: 4, title: 'Weekend Sleep-In', days: 'Sat & Sun', time: '10:30 am', room: 'Bedroom', active: false, image: require('../../assets/Scenarios/routines/weekend_sleep_in.png') },
    { id: 5, title: 'Deep Sleep Transition', days: 'Daily', time: '11:30 pm', room: 'Bedroom', active: true, image: require('../../assets/Scenarios/routines/deep_sleep_transition.png') },
  ]);

  // Função para ligar/desligar o switch da rotina
  const toggleRoutine = (id: number) => {
    setRoutines((current) =>
      current.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  };

 return (
    <SafeAreaView className="flex-1 bg-[#F1F3EA]" edges={['top']}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View className="items-center mt-2 mb-6">
        <Text 
          className="text-3xl font-semibold text-[#354F52]" 
          style={{ fontFamily: 'Nunito_600SemiBold' }}
        >
          Routines
        </Text>
      </View>

      {/* Search Bar */}
      <View className="px-5 mb-6">
        <View className="flex-row items-center border border-[#BDC7C2] rounded-full px-4 h-12 bg-transparent">
          <MaterialIcons name="search" size={24} color="#7A8C85" style={{ marginRight: 10 }} />
          <TextInput
            testID="search-input" // ADICIONADO
            placeholder="Search..."
            placeholderTextColor="#7A8C85"
            className="flex-1 h-full text-base text-[#2C3A35]"
            style={{ fontFamily: 'Nunito_600SemiBold', paddingVertical: 0 }}
            textAlignVertical="center"
          />
        </View>
      </View>

      {/* Lista de rotinas */}
      <ScrollView 
        testID="routines-scrollview" // ADICIONADO
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 130 }} 
        showsVerticalScrollIndicator={false}
      >
        {routines.map((item) => (
          <RoutineCard
            key={item.id}
            testID={`routine-card-${item.id}`} // ADICIONADO
            title={item.title}
            days={item.days}
            time={item.time}
            room={item.room}
            isActive={item.active}
            image={item.image}
            onToggle={() => toggleRoutine(item.id)}
          />
        ))}
      </ScrollView>

      {/* Botão + */}
      <View testID="add-routine-container">
         <AddRoomDevice actions={[]} isStatic={true} />
      </View>

    </SafeAreaView>
  );
}