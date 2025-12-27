import React from 'react';
import { ScrollView, TouchableOpacity, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { Ionicons } from '@expo/vector-icons';

import { SearchBar, FilterChip } from '@/components/routines/SearchBar';
import { RoutineCard } from '@/components/routines/RoutineCard';

export default function RoutinesScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#F1F3EA]" edges={['top']}>
      <View className="items-center py-4">
        <Text className="text-[24px] text-[#354F52] font-[Nunito_700Bold]">Routines</Text>
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
      >
        <SearchBar />
        
        <Text className="text-[18px] font-[Nunito_700Bold] text-[#354F52] mb-4">Searche</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-6">
          <FilterChip label="All" active />
          <FilterChip label="Morning" />
          <FilterChip label="Afternoon" />
          <FilterChip label="Evening" />
        </ScrollView>

        <RoutineCard 
          title="Gym Hour" 
          time="Mon-Fri | 7:15 am" 
          location="8 Living Room" 
          room="Bedroom" 
          isActive={false} 
          image={require('@/assets/images/Logo.png')} 
        />

        <RoutineCard 
          title="Morning Kitchen Prep" 
          time="Mon-Fri | 10:30 am" 
          location="Kitchen" 
          room="Prep Area" 
          isActive={true} 
        />
      </ScrollView>

      <TouchableOpacity 
        className="absolute bottom-10 right-6 bg-[#548F53] w-[60px] h-[60px] rounded-full items-center justify-center shadow-lg"
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={35} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}