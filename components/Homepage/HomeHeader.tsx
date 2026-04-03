import { MaterialIcons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';

interface HomeHeaderProps {
  userName: string;
  avatarUrl?: string | null;
}

export const HomeHeader = ({ userName, avatarUrl }: HomeHeaderProps) => {
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
      <View
        accessible={true}
        accessibilityRole="header"
        accessibilityLabel={`${greeting}, ${userName}`}
      >
        <Text
          maxFontSizeMultiplier={1.2}
          style={{ fontFamily: 'Nunito_600SemiBold' }}
          className="text-2xl text-[#354F52]"
          importantForAccessibility="no-hide-descendants"
        >
          {greeting},
        </Text>
        <Text
          maxFontSizeMultiplier={1.2}
          style={{ fontFamily: 'Nunito_700Bold' }}
          className="text-4xl text-[#354F52]"
          importantForAccessibility="no-hide-descendants"
        >
          {userName}
        </Text>
      </View>

      <View className="flex-row items-center">
        <Pressable
          className="mr-4"
          accessibilityRole="button"
          accessibilityLabel="Notifications"
        >
          <MaterialIcons name="notifications-none" size={36} color="#548F53" />
        </Pressable>

        <Link href="/Profile" asChild>
          <Pressable
            style={{ width: 60, height: 60 }}
            accessibilityRole="button"
            accessibilityLabel="Go to profile"
            accessibilityHint="Navigates to the user's profile page"
          >
            <Image
              source={avatarUrl ? { uri: avatarUrl } : require('@/assets/avatars/profile.png')}
              className="rounded-full"
              style={{
                width: 60,
                height: 60,
                resizeMode: 'cover',
              }}
              importantForAccessibility="no" // Diz ao Android para ignorar a imagem em si, pois o Pressable já tem o Label
              accessibilityElementsHidden={true}
            />
          </Pressable>
        </Link>
      </View>
    </View>
  );
};
