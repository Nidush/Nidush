import { Stack, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import './../global.css';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        // Remova a linha abaixo após testar, para que ele lembre da escolha:
        //  await AsyncStorage.removeItem('@viewedOnboarding');

        const viewed = await AsyncStorage.getItem('@viewedOnboarding');

        if (viewed === 'true') {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        } 
      } catch (e) {
        router.replace('/onboarding');
      } finally {
        setIsLoading(false);
      }
    };

    checkOnboarding();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="profile-selection" />
      <Stack.Screen name="activity-details" />
      <Stack.Screen name="ActiveSession" />
      <Stack.Screen name="LoadingActivity" />
      <Stack.Screen name="modal" />
      <Stack.Screen name="new-activity" />
      <Stack.Screen name="new-scenario" />
      <Stack.Screen name="Profile" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
