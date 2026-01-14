import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';
import React from 'react';
import {
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BaseCard } from '../../components/BaseCard';
import { HomeHeader } from '../../components/Homepage/HomeHeader';
import { StateWidget } from '../../components/Homepage/StateWidget';

export default function Index() {
  const [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Nunito_600SemiBold,
    Nunito_400Regular,
  });

  if (!fontsLoaded) return null;

  const activities = [
    {
      title: 'Stretching',
      time: '5min',
      room: 'Bedroom',
      image: require('@/assets/activities_for_you/stretching.png'),
    },
    {
      title: 'Pikelets',
      time: '17min',
      room: 'Kitchen',
      image: require('@/assets/activities_for_you/pikelets.png'),
    },
    {
      title: 'Sunrise Flow',
      time: '15min',
      room: 'Living Room',
      image: require('@/assets/activities_for_you/sunrise_flow.png'),
    },
  ];

  const shortcuts = [
    {
      title: 'Cooking Time',
      time: '50min',
      room: 'Kitchen',
      image: require('../../assets/shortcuts/cooking_time.png'),
    },
    {
      title: 'Meditation Time',
      time: '15min',
      room: 'Bedroom',
      image: require('../../assets/shortcuts/meditation_time.png'),
    },
    {
      title: 'Skincare Time',
      time: '10min',
      room: 'Bathroom',
      image: require('../../assets/shortcuts/skincare_time.png'),
    },
    {
      title: 'Reading Time',
      time: '45min',
      room: 'Living Room',
      image: require('../../assets/shortcuts/reading_time.png'),
    },
  ];
  const { width: SCREEN_WIDTH } = Dimensions.get('window');
  const CARD_WIDTH = SCREEN_WIDTH * 0.42;
  const CARD_SPACING = 12; // 12px de margem (mr-3)
  return (
    <SafeAreaView className="flex-1 bg-[#F0F2EB]" edges={['top']}>
      <ScrollView
        className="px-5"
        showsVerticalScrollIndicator={false}
        style={{ paddingTop: Platform.OS === 'android' ? 20 : 0 }}
      >
        <HomeHeader userName="Laura" />

        <StateWidget />

        <Text
          style={{ fontFamily: 'Nunito_600SemiBold' }}
          className="text-2xl text-[#354F52] mb-4"
        >
          Activities for you
        </Text>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-6 -mx-5"
          contentContainerStyle={{ paddingHorizontal: 20 }}
          snapToInterval={CARD_WIDTH + CARD_SPACING}
          decelerationRate="fast"
          snapToAlignment="start"
        >
          {activities.map((item, index) => (
            <View key={index} className="mr-3">
              <BaseCard {...item} width={CARD_WIDTH} />
            </View>
          ))}
        </ScrollView>

        <View className="flex-row justify-between items-center mb-4">
          <Text
            style={{ fontFamily: 'Nunito_600SemiBold' }}
            className="text-2xl text-[#354F52]"
          >
            Shortcuts
          </Text>
          <Pressable>
            <Text
              style={{ fontFamily: 'Nunito_600SemiBold' }}
              className="text-[#548F53] underline text-xl"
            >
              Edit
            </Text>
          </Pressable>
        </View>
        <View className="flex-row flex-wrap justify-between pb-10">
          {shortcuts.map((item, index) => (
            <View key={index} className="w-[48%] mb-4">
              <BaseCard {...item} width="100%" />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
