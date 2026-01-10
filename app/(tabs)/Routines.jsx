import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ScrollView, StatusBar, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AddRoomDevice from '../../components/rooms/AddRoomDevice';
import CategoryPill from '../../components/rooms/CategoryPill';
import RoutineCard from '../../components/routines/RoutineCard';

export default function Routines() {
  const [activeCategoryId, setActiveCategoryId] = useState(1);

  // Estado para as rotinas (para que o switch funcione)
  const [routines, setRoutines] = useState([
    {
      id: 1,
      title: 'Sunrise Awakening',
      days: 'Mon-Fri',
      time: '7:15 am',
      room: 'Bedroom',
      active: true,
      image: require('../../assets/Scenarios/routines/sunrise_awakening.png'),
    },
    {
      id: 2,
      title: 'Gym Hour',
      days: 'Tue & Thu',
      time: '6:00 pm',
      room: 'Living Room',
      active: false,
      image: require('../../assets/Scenarios/routines/gym_hour.png'),
    },
    {
      id: 3,
      title: 'Morning Kitchen Prep',
      days: 'Mon-Fri',
      time: '8:00 am',
      room: 'Kitchen',
      active: true,
      image: require('../../assets/Scenarios/routines/morning_kitchen_prep.png'),
    },
    {
      id: 4,
      title: 'Weekend Sleep-In',
      days: 'Sat & Sun',
      time: '10:30 am',
      room: 'Bedroom',
      active: false,
      image: require('../../assets/Scenarios/routines/weekend_sleep_in.png'),
    },
    {
      id: 5,
      title: 'Deep Sleep Transition',
      days: 'Daily',
      time: '11:30 pm',
      room: 'Bedroom',
      active: true,
      image: require('../../assets/Scenarios/routines/deep_sleep_transition.png'),
    },
  ]);

  const toggleRoutine = (id) => {
    setRoutines((currentRoutines) =>
      currentRoutines.map((r) =>
        r.id === id ? { ...r, active: !r.active } : r,
      ),
    );
  };

  const ROUTINE_CATEGORIES = [
    { id: 1, name: 'All' },
    { id: 2, name: 'Morning' },
    { id: 3, name: 'Afternoon' },
    { id: 4, name: 'Evening' },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F1F3EA]" edges={['top']}>
      <StatusBar barStyle="dark-content" />

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
            placeholder="Search..."
            placeholderTextColor="#7A8C85"
            className="flex-1 h-full text-base text-[#2C3A35]"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          />
        </View>
      </View>

      <View className="h-10 mb-9 flex justify-center items-center">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
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

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 120 }}
      >
        {routines.map((item) => (
          <RoutineCard
            key={item.id}
            title={item.title}
            days={item.days}
            time={item.time}
            room={item.room}
            isActive={item.active}
            image={item.image} // Passamos a imagem aqui
            onToggle={() => toggleRoutine(item.id)}
          />
        ))}
      </ScrollView>

      <AddRoomDevice actions={[{ label: 'Routine', onPress: () => {} }]} />
    </SafeAreaView>
  );
}
