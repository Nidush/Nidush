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
  // pwd is intentionally NOT read here — passwords are managed by Supabase Auth only

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
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
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
        const { data: homeAssociation } = await supabase
          .from('user_homes')
          .select('home_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (homeAssociation?.home_id) {
          await AsyncStorage.setItem('@viewedOnboarding', 'true');
          router.replace('/(tabs)');
          return;
        }

        setFirstName(user.user_metadata?.first_name || '');
        setLastName(user.user_metadata?.last_name || '');
        setEmail(user.email || '');
        
        // Restore mid-flow onboarding progress (but never restore 'loading' as it
        // means the previous attempt failed \u2014 start from 'house' in that case)
        const savedProgress = await AsyncStorage.getItem('@onboarding_progress');
        if (savedProgress) {
          const { step, data } = JSON.parse(savedProgress);
          const safeStep = (step === 'loading' || step === 'welcome') ? 'house' : step;
          // Only restore if we have a meaningful mid-flow step
          if (safeStep && safeStep !== 'welcome') {
            setCurrentStep(safeStep);
            if (data?.houseName) setHouseName(data.houseName);
            if (data?.houseId) setHouseId(data.houseId);
            if (data?.homeMode) setHomeMode(data.homeMode || 'create');
            if (data?.selectedActivities) setSelectedActivities(data.selectedActivities);
          } else {
            // Stale or invalid progress \u2014 clear it and start fresh
            await AsyncStorage.removeItem('@onboarding_progress');
          }
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
          selectedActivities,
          ...extraData
        }
      };
      await AsyncStorage.setItem('@onboarding_progress', JSON.stringify(progress));
    } catch (e) {
      console.error('Error saving progress:', e);
    }
  };

  const transitionTo = (nextStep: string, extraData = {}) => {
    saveProgress(nextStep, extraData);
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
        <ActivitySelection
          onFinish={(activities) => {
            setSelectedActivities(activities);
            transitionTo('loading', { selectedActivities: activities });
          }}
        />
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
              // Read homeMode and selectedActivities from AsyncStorage to avoid React state race conditions
              let effectiveHomeMode = homeMode;
              let effectiveActivities = selectedActivities;
              try {
                const saved = await AsyncStorage.getItem('@onboarding_progress');
                if (saved) {
                  const parsed = JSON.parse(saved);
                  if (parsed?.data?.homeMode) effectiveHomeMode = parsed.data.homeMode;
                  if (parsed?.data?.selectedActivities) effectiveActivities = parsed.data.selectedActivities;
                }
              } catch (_) { /* use state fallback */ }

              console.log('[Onboarding] homeMode (effective):', effectiveHomeMode);
              let finalHomeId: number | null = null;

              if (effectiveHomeMode === 'create') {
                // 1. Create Home
                // Gerar Join Code (6 carateres alfanuméricos maiúsculos)
                const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                
                console.log('-> A criar nova casa:', houseName || 'Nidush Home', 'com o código', generatedCode);
                const { data: homeData, error: homeError } = await supabase
                  .from('homes')
                  .insert({ 
                    name: houseName || 'Nidush Home',
                    join_code: generatedCode 
                  })
                  .select('id')
                  .single();

                if (homeError) {
                  console.error('Error creating home in public schema:', homeError);
                  hasError = true;
                } else if (homeData) {
                  finalHomeId = homeData.id;
                }
              } else {
                // Join existing home
                const upperCode = houseId.toUpperCase().trim();
                console.log('-> A procurar casa existente com Join Code:', upperCode);
                const { data: homeData, error: homeError } = await supabase
                  .from('homes')
                  .select('id')
                  .eq('join_code', upperCode)
                  .maybeSingle();
                  
                if (homeError || !homeData) {
                  if (homeError) console.error('Error finding existing home:', homeError);
                  alert('Join Code not found. Please verify the code and try again.'); // Falha gracefully.
                  hasError = true;
                } else {
                  finalHomeId = homeData.id;
                }
              }

              if (finalHomeId && !hasError) {
                // 2. Create User in public schema
                console.log('-> A associar utilizador à casa ID:', finalHomeId);
                const { error: userError } = await supabase
                  .from('users')
                  .upsert({
                    first_name: firstName,
                    last_name: lastName,
                    email: email,
                    // password is NEVER stored here — managed by Supabase Auth
                    auth_uid: user.id,
                    hobbies: effectiveActivities.join(',')
                  }, { onConflict: 'auth_uid' });

                if (userError) {
                  console.error('Error syncing user in public schema:', userError);
                  hasError = true;
                }

                if (!hasError) {
                  // 3. Associate user with home in user_homes
                  // Admin if they created the home, resident if they joined with a code
                  const assignedRole = effectiveHomeMode === 'create' ? 'admin' : 'resident';
                  console.log('[Onboarding] Assigning role:', assignedRole, 'to home:', finalHomeId);
                  const { error: assocError } = await supabase
                    .from('user_homes')
                    .upsert({
                      user_id: user.id,
                      home_id: finalHomeId,
                      role: assignedRole
                    }, { onConflict: 'user_id,home_id' });
                  
                  if (assocError) {
                    console.error('Error associating user with home:', assocError);
                    hasError = true;
                  }
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
