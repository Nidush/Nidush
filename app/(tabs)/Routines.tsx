import { MaterialIcons } from '@expo/vector-icons';
import React, { useState, useMemo, useCallback } from 'react'; 
import { ScrollView, StatusBar, Text, TextInput, View, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../utils/supabase';

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

// Mapeamento de imagens para as rotinas padrão
const ROUTINE_IMAGES: Record<string, any> = {
  'Sunrise Awakening': require('../../assets/Scenarios/routines/sunrise_awakening.png'),
  'Gym Hour': require('../../assets/Scenarios/routines/gym_hour.png'),
  'Morning Kitchen Prep': require('../../assets/Scenarios/routines/morning_kitchen_prep.png'),
  'Weekend Sleep-In': require('../../assets/Scenarios/routines/weekend_sleep_in.png'),
  'Deep Sleep Transition': require('../../assets/Scenarios/routines/deep_sleep_transition.png'),
};

const DEFAULT_IMAGE = require('../../assets/Scenarios/routines/sunrise_awakening.png');

const formatTime = (timeStr: string) => {
  if (!timeStr) return '--:--';
  const [hours, minutes] = timeStr.split(':').map(Number);
  const ampm = hours >= 12 ? 'pm' : 'am';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${ampm}`;
};

export default function Routines() {
  const [routines, setRoutines] = useState<Routine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const loadRoutines = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('routine')
        .select(`
          idroutine,
          name,
          execution_time,
          days_of_week,
          is_active,
          scenario:scenario_idscenario (
            idscenario,
            rooms:rooms_idrooms (
              name
            )
          )
        `);

      if (error) throw error;

      if (data) {
        const mappedRoutines: Routine[] = data.map((item: any) => ({
          id: item.idroutine,
          title: item.name,
          days: item.days_of_week || 'N/A',
          time: formatTime(item.execution_time),
          room: item.scenario?.rooms?.name || 'Unknown',
          active: item.is_active,
          image: ROUTINE_IMAGES[item.name] || DEFAULT_IMAGE,
        }));
        setRoutines(mappedRoutines);
      }
    } catch (err) {
      console.error('Error loading routines:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadRoutines();
    }, [loadRoutines])
  );

  const toggleRoutine = async (id: number) => {
    const routineToToggle = routines.find(r => r.id === id);
    if (!routineToToggle) return;

    const newStatus = !routineToToggle.active;

    // Atualização otimista
    setRoutines(current =>
      current.map(r => (r.id === id ? { ...r, active: newStatus } : r))
    );

    try {
      const { error } = await supabase
        .from('routine')
        .update({ is_active: newStatus })
        .eq('idroutine', id);

      if (error) throw error;
    } catch (err) {
      console.error('Error toggling routine:', err);
      // Reverter em caso de erro
      setRoutines(current =>
        current.map(r => (r.id === id ? { ...r, active: !newStatus } : r))
      );
    }
  };

  const filteredRoutines = useMemo(() => {
    const searchLower = searchQuery.toLowerCase();
    return routines.filter((r) => r.title.toLowerCase().includes(searchLower) || r.room.toLowerCase().includes(searchLower));
  }, [routines, searchQuery]);

  return (
    <SafeAreaView className="flex-1 bg-[#F1F3EA]" edges={['top']}>
      <StatusBar barStyle="dark-content" />

      <View className="items-center mt-2 mb-6 px-4">
        <Text 
          className="text-3xl text-[#354F52]" 
          style={{ fontFamily: 'Nunito_600SemiBold' }}
          maxFontSizeMultiplier={1.3}
        >Routines</Text>
      </View>

      <View className="px-5 mb-6">
        <View className="flex-row items-center border border-[#BDC7C2] rounded-full px-4 min-h-[48px]">
          <MaterialIcons name="search" size={22} color="#7A8C85" style={{ marginRight: 10 }} />
          <TextInput
            testID="search-input"
            placeholder="Search routines..."
            placeholderTextColor="#7A8C85"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-base text-[#2C3A35]"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
            maxFontSizeMultiplier={1.3}
            accessible={true}
            accessibilityLabel="Search routines"
            accessibilityHint="Type to search for a specific routine"
            accessibilityRole="search"
          />
        </View>
      </View>

      {loading ? (
        <View className="flex-1 justify-center items-center">
          <ActivityIndicator size="large" color="#548F53" />
        </View>
      ) : (
        <ScrollView 
          testID="routines-scrollview" 
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 130 }} 
          showsVerticalScrollIndicator={false}
        >
          {filteredRoutines.map((item) => (
            <RoutineCard
              key={item.id}
              testID={`routine-card-${item.id}`}
              title={item.title}
              days={item.days}
              time={item.time}
              room={item.room}
              isActive={item.active}
              image={item.image}
              onToggle={() => toggleRoutine(item.id)}
            />
          ))}
          {filteredRoutines.length === 0 && (
            <Text className="text-center text-[#7A8C85] mt-10" style={{ fontFamily: 'Nunito_600SemiBold' }}>
              No routines found.
            </Text>
          )}
        </ScrollView>
      )}

      {/* Botão para adicionar (estático neste exemplo) */}
      <View testID="add-routine-container">
        <AddRoomDevice actions={[]} isStatic={true} />
      </View>
    </SafeAreaView>
  );
} 