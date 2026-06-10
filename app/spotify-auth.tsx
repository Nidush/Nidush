import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../utils/supabase';

export default function SpotifyAuthCatcher() {
  const router = useRouter();

  useEffect(() => {
    const handleRedirect = async () => {
      const savedProgress = await AsyncStorage.getItem('@onboarding_progress');
      const viewed = await AsyncStorage.getItem('@viewedOnboarding');
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.replace('/login');
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
