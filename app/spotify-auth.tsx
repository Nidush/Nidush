import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SpotifyAuthCatcher() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      const viewed = await AsyncStorage.getItem('@viewedOnboarding');
      if (viewed === 'true') {
        router.replace('/(tabs)');
      } else {
        // Se ainda não terminou o onboarding, volta para o setup-profile
        router.replace('/setup-profile');
      }
    };
    handleRedirect();
  }, [router]);

  return null;
}
