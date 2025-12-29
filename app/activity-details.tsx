import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Feather,
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Tipagem da atividade
type Activity = {
  id: string;
  title: string;
  category: string;
  description: string;
  time: string;
  room: string;
  environment: string;
  content: string;
  image: string | any;
  instructions: string[];
  devices: { icon: React.ReactNode; label: string }[];

};

export default function ActivityDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activity, setActivity] = useState<Activity | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivity = async () => {
      const stored = await AsyncStorage.getItem('@myActivities');
      if (stored) {
        const activities: Activity[] = JSON.parse(stored);
        const found = activities.find((a) => a.id === id) || null;
        setActivity(found);
      }
      setLoading(false);
    };

    loadActivity();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F0F2EB]">
        <ActivityIndicator size="large" color="#548F53" />
      </View>
    );
  }

  if (!activity) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F0F2EB]">
        <Text>Activity not found</Text>
      </View>
    );
  }

  const imageSource =
    typeof activity.image === 'string' ? { uri: activity.image } : activity.image;

  // Se não houver devices ou instructions, usamos default
  const instructions: string[] = activity.instructions || [
    "Sit & breathe sit down. Put your hand on your heart. Take 3 deep breaths.",
    "Find 3 things you have right now. Say 'thank you'.",
    "Think of one happy thought. Feel that happiness.",
    "Thank yourself for today.",
    "Finish with a smile and open your eyes.",
  ];

  const devices: { icon: React.ReactNode; label: string }[] =
    activity.devices || [
      {
        icon: <Feather name="sun" size={16} color="#6A7D5B" />,
        label: 'Bedroom Lights',
      },
      {
        icon: <MaterialCommunityIcons name="sprinkler-variant" size={16} color="#6A7D5B" />,
        label: 'Difuser',
      },
      {
        icon: <MaterialIcons name="speaker" size={16} color="#6A7D5B" />,
        label: 'Speakers',
      },
    ];

  return (
    <View className="flex-1 bg-[#F0F2EB]">
      <ScrollView contentContainerStyle={{ paddingBottom: '35%' }}>
        {/* HEADER IMAGE */}
        <ImageBackground source={imageSource} className="w-full h-[400px]">
          <LinearGradient
            colors={['rgba(0,0,0,0.25)', 'transparent', 'rgba(0,0,0,0.7)']}
            className="flex-1"
          >
            <SafeAreaView edges={['top']} className="flex-row justify-between px-5 pt-2">
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={28} color="white" />
              </TouchableOpacity>
              <TouchableOpacity>
                <MaterialIcons name="more-vert" size={28} color="white" />
              </TouchableOpacity>
            </SafeAreaView>

            <View className="absolute bottom-10 px-6">
              <Text className="text-white text-lg">{activity.category}</Text>
              <Text className="text-white text-4xl mt-1">{activity.title}</Text>

              <View className="flex-row items-center mt-3 space-x-6">
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={20} color="white" />
                  <Text className="text-white ml-2">{activity.time}</Text>
                </View>

                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="door-open" size={20} color="white" />
                  <Text className="text-white ml-2">{activity.room}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>

        {/* DEVICES */}
        <View className="px-6 pt-8">
          <Text className="text-[#354F52] text-xl mb-3">Associated Devices</Text>
          <View className="flex-row flex-wrap gap-y-2 gap-x-4 mb-8">
            {devices.map((d, i) => (
              <View key={i} className="flex-row items-center">
                {d.icon}
                <Text className="text-[#6A7D5B] ml-2">{d.label}</Text>
              </View>
            ))}
          </View>

          {/* DESCRIPTION */}
          <Text className="text-[#354F52] text-xl mb-2">Description</Text>
          <Text className="text-[#6A7D5B] text-[15px] leading-6 mb-8">{activity.description}</Text>

          {/* FOCUS MODE */}
          <Text className="text-[#354F52] text-xl mb-3">Focus Mode</Text>
          <View className="flex-row items-center justify-between bg-[#F0F2EB] border border-[#548F53] p-5 rounded-2xl mb-8">
            <View className="flex-row items-center">
              <Ionicons name="notifications-outline" size={26} color="#354F52" />
              <View className="ml-4">
                <Text className="text-[#354F52] text-lg">Notifications</Text>
                <Text className="text-[#6A7D5B] text-xs">
                  Muted during {activity.environment}
                </Text>
              </View>
            </View>
            <Switch
              trackColor={{ false: '#DDE5D7', true: '#548F53' }}
              onValueChange={setNotificationsEnabled}
              value={notificationsEnabled}
            />
          </View>

          {/* SELECTED CONTENT */}
          <Text className="text-[#354F52] text-xl mb-3">Selected Content</Text>
          <View className="flex-row items-center justify-between bg-[#F0F2EB] border border-[#548F53] p-4 rounded-2xl mb-8">
            <View className="flex-1 pr-2">
              <Text className="text-[#354F52] text-lg">{activity.content || 'Session'}</Text>
              <Text className="text-[#6A7D5B] text-xs mt-1">Playing in {activity.room}</Text>
            </View>
            <Image
              source={{ uri: 'https://picsum.photos/id/237/100/100' }}
              className="w-20 h-20 rounded-xl"
            />
          </View>

          {/* INSTRUCTIONS */}
          <Text className="text-[#354F52] text-xl mb-4">Instructions</Text>
          {instructions.map((step, i) => (
            <View key={i} className="flex-row mb-4">
              <Text className="text-[#548F53] text-lg w-7">{i + 1}.</Text>
              <Text className="text-[#354F52] text-[15px] flex-1 leading-6">{step}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* START BUTTON */}
      <View className="absolute bottom-10 left-0 right-0 items-center">
        <TouchableOpacity
          activeOpacity={0.9}
          className="bg-[#548F53] py-4 rounded-full flex-row items-center justify-center shadow-lg shadow-[#548F53]/40"
          style={{ width: width * 0.65 }}
          onPress={() => alert('Starting Session...')}
        >
          <Text className="text-white text-2xl mr-2">Start</Text>
          <Ionicons name="play" size={24} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
