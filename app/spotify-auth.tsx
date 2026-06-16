import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';
const SPOTIFY_RETURN_ROUTE_KEY = '@spotify_return_route';

export default function SpotifyAuthCatcher() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      const savedProgress = await AsyncStorage.getItem('@onboarding_progress');
      const savedReturnRoute = await AsyncStorage.getItem(SPOTIFY_RETURN_ROUTE_KEY);
      const viewed = await AsyncStorage.getItem('@viewedOnboarding');
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
        return;
      }

      if (savedReturnRoute) {
        await AsyncStorage.removeItem(SPOTIFY_RETURN_ROUTE_KEY);
        router.replace(savedReturnRoute as '/new-scenario' | '/setup-profile' | '/Profile');
        return;
      }

      const { data: homeAssociation } = await supabase
        .from('user_homes')
        .select('home_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      const hasCompletedOnboarding = viewed === 'true' && !savedProgress && Boolean(homeAssociation?.home_id);

      if (hasCompletedOnboarding) {
        router.replace('/(tabs)');
      } else {
        router.replace('/setup-profile');
      }
    };
    handleRedirect();
  }, [router]);

  return null;
}
