
import React from 'react';
import {
  View,
  Text,
  Image,
  ImageBackground,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { BlurView } from 'expo-blur';
import {
  useFonts,
  Nunito_700Bold,
  Nunito_600SemiBold,
  Nunito_400Regular,
} from '@expo-google-fonts/nunito';

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
      image: require('@/assets/shortcuts/cooking_time.png'),
    },
    {
      title: 'Meditation Time',
      time: '15min',
      room: 'Bedroom',
      image: require('@/assets/shortcuts/meditation_time.png'),
    },
    {
      title: 'Skincare Time',
      time: '10min',
      room: 'Bathroom',
      image: require('@/assets/shortcuts/skincare_time.png'),
    },
    {
      title: 'Reading Time',
      time: '45min',
      room: 'Living Room',
      image: require('@/assets/shortcuts/reading_time.png'),
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-[#F0F2EB]" edges={['top', 'bottom']}>
      <ScrollView
        className="px-4"
        showsVerticalScrollIndicator={false}
        style={{ paddingTop: Platform.OS === 'android' ? 20 : 0 }}
      >
        {/* HEADER */}
        <View className="flex-row justify-between items-center mb-6 mt-4">
          <View>
            <Text
              style={{ fontFamily: 'Nunito_600SemiBold' }}
              className="text-[22px] text-[#354F52]"
            >
              Good morning,
            </Text>
            <Text
              style={{ fontFamily: 'Nunito_700Bold' }}
              className="text-[32px] text-[#354F52]"
            >
              Laura
            </Text>
          </View>

          <View className="flex-row items-center">
            <Pressable className="mr-4">
              <Ionicons
                name="notifications-outline"
                size={28}
                color="#548F53"
              />
            </Pressable>

            <Link href="/Profile" asChild>
              <Pressable>
                <Image
                  source={require('@/assets/avatars/profile.png')}
                  className="w-[55px] h-[55px] rounded-full"
                />
              </Pressable>
            </Link>
          </View>
        </View>

        {/* ACTIVE SCENARIO */}
        <ImageBackground
          source={require('@/assets/images/foto.png')}
          className="w-full mb-6 overflow-hidden rounded-[15px]"
        >
          <View className="flex-row justify-between items-center p-5 bg-black/30">
            <View className="flex-1">
              <Text
                style={{ fontFamily: 'Nunito_600SemiBold' }}
                className="text-white opacity-90 text-[14px]"
              >
                Active Scenario
              </Text>
              <Text
                style={{ fontFamily: 'Nunito_700Bold' }}
                className="text-white text-[24px]"
              >
                Total Focus
              </Text>

              <View className="flex-row mt-2">
                <View className="bg-white/25 p-[6px] rounded-full mr-2">
                  <MaterialCommunityIcons
                    name="speaker"
                    size={14}
                    color="white"
                  />
                </View>
                <View className="bg-white/25 p-[6px] rounded-full mr-2">
                  <MaterialCommunityIcons
                    name="lightbulb-outline"
                    size={14}
                    color="white"
                  />
                </View>
                <View className="bg-white/25 p-[6px] rounded-full">
                  <MaterialCommunityIcons
                    name="music-note"
                    size={14}
                    color="white"
                  />
                </View>
              </View>
            </View>

            <Pressable className="w-[55px] h-[55px] rounded-full bg-white justify-center items-center">
              <Ionicons name="play" size={28} color="#548F53" />
            </Pressable>
          </View>
        </ImageBackground>

        {/* ACTIVITIES */}
        <Text
          style={{ fontFamily: 'Nunito_600SemiBold' }}
          className="text-[22px] text-[#2D3E27] mb-4"
        >
          Activities for you
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          {activities.map((item, index) => (
            <View key={index} className="mr-[15px]">
              <BaseCard {...item} width={160} />
            </View>
          ))}
        </ScrollView>

        {/* SHORTCUTS HEADER */}
        <View className="flex-row justify-between items-center mb-4">
          <Text
            style={{ fontFamily: 'Nunito_600SemiBold' }}
            className="text-[22px] text-[#2D3E27]"
          >
            Shortcuts
          </Text>
          <Pressable>
            <Text
              style={{ fontFamily: 'Nunito_600SemiBold' }}
              className="text-[#548F53] underline"
            >
              Edit
            </Text>
          </Pressable>
        </View>

        {/* SHORTCUTS GRID */}
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

/* =========================
   BASE CARD COMPONENT
========================= */
function BaseCard({ title, time, room, image, width }: any) {
  return (
    <View
      style={{
        width: width,
        height: 160,
        borderRadius: 15,
        overflow: 'hidden',
      }}
    >
      <ImageBackground
        source={image}
        style={{ width: '100%', height: '100%', justifyContent: 'flex-end' }}
        imageStyle={{ borderRadius: 15 }}
      >
        <BlurView
          intensity={80}
          tint="dark"
          style={{
            padding: 12,
            borderBottomLeftRadius: 15,
            borderBottomRightRadius: 15,
          }}
        >
          <Text
            style={{ fontFamily: 'Nunito_700Bold' }}
            className="text-white text-[16px]"
            numberOfLines={1}
          >
            {title}
          </Text>

          <View className="flex-row items-center mt-1">
            <Ionicons name="time-outline" size={13} color="white" />
            <Text
              style={{ fontFamily: 'Nunito_400Regular' }}
              className="text-white text-[12px] ml-1"
            >
              {time}
            </Text>
          </View>

          <View className="flex-row items-center mt-1">
            <MaterialCommunityIcons
              name="door-open"
              size={13}
              color="white"
            />
            <Text
              style={{ fontFamily: 'Nunito_400Regular' }}
              className="text-white text-[12px] ml-1"
            >
              {room}
            </Text>
          </View>
        </BlurView>
      </ImageBackground>
    </View>
  );
}
