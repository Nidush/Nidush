import { MaterialIcons } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import { useNotifications } from '@/context/NotificationsContext';

interface HomeHeaderProps {
  userName: string;
  avatarUrl?: string | null;
}

export const HomeHeader = ({ userName, avatarUrl }: HomeHeaderProps) => {
  const router = useRouter();
  const { unreadCount } = useNotifications();
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
          className="mr-4 relative"
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          onPress={() => router.push('/notifications')}
        >
          <MaterialIcons name="notifications-none" size={36} color="#548F53" />
          {unreadCount > 0 && (
            <View 
              style={{ position: 'absolute', right: -2, top: -2, backgroundColor: '#548F53', width: 18, height: 18, borderRadius: 9, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#F0F2EB' }} 
              importantForAccessibility="no"
            >
              <Text style={{ color: 'white', fontSize: 10, fontWeight: 'bold' }}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
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
