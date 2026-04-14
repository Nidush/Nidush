import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  View,
} from 'react-native';
import { supabase } from '../utils/supabase';

import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';

// Onboarding Components
import ActivitySelection from '../components/Onboarding/ActivitySelection';
import FinalLoading from '../components/Onboarding/FinalLoading';
import HouseName from '../components/Onboarding/HouseName';
import WearableSync from '../components/Onboarding/WearableSync';
import WelcomeUser from '../components/Onboarding/WelcomeUser';

export default function SetupProfile() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular: Nunito_400Regular,
    Nunito_600SemiBold: Nunito_600SemiBold,
    Nunito_700Bold: Nunito_700Bold,
  });
  const router = useRouter();
  const { pwd } = useLocalSearchParams();

  const [currentStep, setCurrentStep] = useState('welcome');
  const [dims, setDims] = useState(Dimensions.get('window'));
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [houseName, setHouseName] = useState('');
  const [houseId, setHouseId] = useState('');
  const [homeMode, setHomeMode] = useState<'create' | 'join'>('create');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) =>
      setDims(window),
    );
    loadUserData();
    return () => sub.remove();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Double check if user is already registered with a home to bypass setup
        const { data: userData } = await supabase
          .from('users')
          .select('home_idhome')
          .or(`auth_uid.eq.${user.id},email.eq.${user.email}`)
          .maybeSingle();

        if (userData?.home_idhome) {
          await AsyncStorage.setItem('@viewedOnboarding', 'true');
          router.replace('/(tabs)');
          return;
        }

        setFirstName(user.user_metadata?.first_name || '');
        setLastName(user.user_metadata?.last_name || '');
        setEmail(user.email || '');
        
        // Check if there's progress saved in AsyncStorage
        const savedProgress = await AsyncStorage.getItem('@onboarding_progress');
        if (savedProgress) {
          const { step, data } = JSON.parse(savedProgress);
          setCurrentStep(step || 'welcome');
          if (data?.houseName) setHouseName(data.houseName);
          if (data?.houseId) setHouseId(data.houseId);
          if (data?.homeMode) setHomeMode(data.homeMode);
        }
      } else {
        // Not logged in, redirect to login
        router.replace('/login');
      }
    } catch (e) {
      console.error('Error loading user data:', e);
    } finally {
      setLoading(false);
    }
  };

  const saveProgress = async (step: string, extraData = {}) => {
    try {
      const progress = {
        step,
        data: {
          houseName,
          houseId,
          homeMode,
          ...extraData
        }
      };
      await AsyncStorage.setItem('@onboarding_progress', JSON.stringify(progress));
    } catch (e) {
      console.error('Error saving progress:', e);
    }
  };

  const transitionTo = (nextStep: string) => {
    saveProgress(nextStep);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(nextStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    });
  };

  if (!fontsLoaded) return null;
  if (loading) return null;

  // --- Step Navigation ---
  if (currentStep === 'welcome') {
    return <WelcomeUser userName={firstName} onFinish={() => transitionTo('house')} />;
  }

  if (currentStep === 'house') {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <HouseName 
          houseName={houseName} 
          setHouseName={setHouseName} 
          houseId={houseId}
          setHouseId={setHouseId}
          homeMode={homeMode}
          setHomeMode={setHomeMode}
          onNext={() => transitionTo('wearable')} 
        />
      </Animated.View>
    );
  }

  if (currentStep === 'wearable') {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <WearableSync
          onNext={() => transitionTo('activities')}
          onSkip={() => transitionTo('activities')}
        />
      </Animated.View>
    );
  }

  if (currentStep === 'activities') {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ActivitySelection onFinish={() => transitionTo('loading')} />
      </Animated.View>
    );
  }

  if (currentStep === 'loading') {
    return (
      <FinalLoading
        onComplete={async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            let hasError = false;

            if (user) {
              let finalHomeId: number | null = null;

              if (homeMode === 'create') {
                // 1. Create Home
                // Gerar Join Code (6 carateres alfanuméricos maiúsculos)
                const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                
                console.log('-> A criar nova casa:', houseName || 'Nidush Home', 'com o código', generatedCode);
                const { data: homeData, error: homeError } = await supabase
                  .from('home')
                  .insert({ 
                    name: houseName || 'Nidush Home',
                    join_code: generatedCode 
                  })
                  .select('idhome')
                  .single();

                if (homeError) {
                  console.error('Error creating home in public schema:', homeError);
                  hasError = true;
                } else if (homeData) {
                  finalHomeId = homeData.idhome;
                }
              } else {
                // Join existing home
                const upperCode = houseId.toUpperCase().trim();
                console.log('-> A procurar casa existente com Join Code:', upperCode);
                const { data: homeData, error: homeError } = await supabase
                  .from('home')
                  .select('idhome')
                  .eq('join_code', upperCode)
                  .maybeSingle();
                  
                if (homeError || !homeData) {
                  if (homeError) console.error('Error finding existing home:', homeError);
                  alert('Join Code not found. Please verify the code and try again.'); // Falha gracefully.
                  hasError = true;
                } else {
                  finalHomeId = homeData.idhome;
                }
              }

              if (finalHomeId && !hasError) {
                // 2. Create User in public schema
                console.log('-> A associar utilizador à casa ID:', finalHomeId);
                const { error: userError } = await supabase
                  .from('users')
                  .insert({
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    home_idhome: finalHomeId,
                    password: pwd, 
                    auth_uid: user.id
                  });

                if (userError) {
                  console.error('Error syncing user in public schema:', userError);
                  hasError = true;
                }
              }
            }

            if (!hasError) {
              await AsyncStorage.setItem('@viewedOnboarding', 'true');
              await AsyncStorage.removeItem('@onboarding_progress');
              router.replace('/(tabs)');
            } else {
              setCurrentStep('house');
            }
          } catch (e) {
            console.log('Error completing onboarding', e);
            setCurrentStep('house');
          }
        }}
      />
    );
  }

  return null;
}
