import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useMemo } from 'react'; 
import { ScrollView, StatusBar, Text, TextInput, View, TouchableOpacity } from 'react-native';
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
  // 1. Estado para as rotinas
  const [routines, setRoutines] = useState<Routine[]>([
    { id: 1, title: 'Sunrise Awakening', days: 'Mon-Fri', time: '7:15 am', room: 'Bedroom', active: true, image: require('../../assets/Scenarios/routines/sunrise_awakening.png') },
    { id: 2, title: 'Gym Hour', days: 'Tue & Thu', time: '6:00 pm', room: 'Living Room', active: false, image: require('../../assets/Scenarios/routines/gym_hour.png') },
    { id: 3, title: 'Morning Kitchen Prep', days: 'Mon-Fri', time: '8:00 am', room: 'Kitchen', active: true, image: require('../../assets/Scenarios/routines/morning_kitchen_prep.png') },
    { id: 4, title: 'Weekend Sleep-In', days: 'Sat & Sun', time: '10:30 am', room: 'Bedroom', active: false, image: require('../../assets/Scenarios/routines/weekend_sleep_in.png') },
    { id: 5, title: 'Deep Sleep Transition', days: 'Daily', time: '11:30 pm', room: 'Bedroom', active: true, image: require('../../assets/Scenarios/routines/deep_sleep_transition.png') },
  ]);

  const [searchQuery, setSearchQuery] = useState('');

  const toggleRoutine = (id: number) => {
    setRoutines((current) =>
      current.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  };

  const filteredRoutines = useMemo(() => {
    return routines.filter((routine) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        routine.title.toLowerCase().includes(searchLower) ||
        routine.room.toLowerCase().includes(searchLower)
      );
    });
  }, [routines, searchQuery]);

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

      <View className="px-5 mb-6">
        <View className="flex-row items-center border border-[#BDC7C2] rounded-full px-4 h-12 bg-transparent">
          <MaterialIcons 
            name="search" 
            size={24} 
            color="#7A8C85" 
            style={{ marginRight: 10 }} 
          />
          <TextInput
            placeholder="Search routines..."
            placeholderTextColor="#7A8C85"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 h-full text-base text-[#2C3A35]"
            style={{ 
              fontFamily: 'Nunito_600SemiBold', 
              paddingVertical: 0 
            }}
            textAlignVertical="center"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <MaterialIcons name="close" size={20} color="#7A8C85" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 130 }} 
        showsVerticalScrollIndicator={false}
      >
        {filteredRoutines.length > 0 ? (
          filteredRoutines.map((item) => (
            <RoutineCard
              key={item.id}
              title={item.title}
              days={item.days}
              time={item.time}
              room={item.room}
              isActive={item.active}
              image={item.image}
              onToggle={() => toggleRoutine(item.id)}
            />
          ))
        ) : (
          <View className="items-center mt-20">
            <Text className="text-[#7A8C85] text-lg" style={{ fontFamily: 'Nunito_600SemiBold' }}>
              No routines found.
            </Text>
          </View>
        )}
      </ScrollView>

      <AddRoomDevice actions={[]} isStatic={true} />
    </SafeAreaView>
  );
}