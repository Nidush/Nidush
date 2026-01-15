import { MaterialIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

interface HomeHeaderProps {
  userName: string;
}

export const HomeHeader = ({ userName }: HomeHeaderProps) => {
  const getGreeting = () => {
    const currentHour = new Date().getHours();

    if (currentHour >= 5 && currentHour < 12) {
      return 'Good morning';
    } else if (currentHour >= 12 && currentHour < 18) {
      return 'Good afternoon';
    } else if (currentHour >= 18 && currentHour < 22) {
      return 'Good evening';
    } else {
      return 'Good night';
    }
  };

  const greeting = getGreeting();

  return (
    <View className="flex-row justify-between items-center mb-6 mt-4">
      <View>
        <Text
          style={{ fontFamily: 'Nunito_600SemiBold' }}
          className="text-2xl text-[#354F52]"
        >
          {greeting},
        </Text>
        <Text
          style={{ fontFamily: 'Nunito_700Bold' }}
          className="text-4xl text-[#354F52]"
        >
          {userName}
        </Text>
      </View>

      <View className="flex-row items-center">
        <Pressable className="mr-4">
          <MaterialIcons name="notifications-none" size={36} color="#548F53" />
        </Pressable>

        <Link href="/Profile" asChild>
          <Pressable style={{ width: 60, height: 60 }}>
            <Image
              source={require('@/assets/avatars/profile.png')}
              className="rounded-full"
              style={{
                width: 60,
                height: 60,
                resizeMode: 'cover',
              }}
            />
          </Pressable>
        </Link>
      </View>
    </View>
  );
};
