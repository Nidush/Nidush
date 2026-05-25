import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { invokeFunction, supabase } from '../utils/supabase';
import { logger } from '../utils/logger';

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
import SpotifyConnect from '../components/Onboarding/SpotifyConnect';
import WearableSync from '../components/Onboarding/WearableSync';
import WelcomeUser from '../components/Onboarding/WelcomeUser';
import { CustomAlert } from '../components/CustomAlert';

export default function SetupProfile() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular: Nunito_400Regular,
    Nunito_600SemiBold: Nunito_600SemiBold,
    Nunito_700Bold: Nunito_700Bold,
  });
  const router = useRouter();
  // pwd is intentionally NOT read here — passwords are managed by Supabase Auth only
  useWindowDimensions();

  const [currentStep, setCurrentStep] = useState('welcome');
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
  const [alertConfig, setAlertConfig] = useState({
    visible: false,
    title: '',
    message: '',
  });

  const openAlert = (title: string, message: string) =>
    setAlertConfig({ visible: true, title, message });

  const loadUserData = React.useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Double check if user is already registered with a home to bypass setup
        const { data: homeAssociation } = await supabase
          .from('user_homes')
          .select('home_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
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
      logger.error('Error loading user data:', e);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadUserData();
  }, [loadUserData]);

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
      logger.error('Error saving progress:', e);
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

  const renderStep = (content: React.ReactNode) => (
    <>
      {content}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        type="warning"
        onClose={() => setAlertConfig((prev) => ({ ...prev, visible: false }))}
      />
    </>
  );

  if (!fontsLoaded) return null;
  if (loading) {
    return (
      <View className="flex-1 bg-[#F1F3EA] justify-center items-center px-8">
        <View className="w-20 h-20 rounded-full bg-[#E7EFE3] items-center justify-center mb-5">
          <ActivityIndicator size="large" color="#548F53" />
        </View>
        <Text
          className="text-[#354F52] text-2xl text-center"
          style={{ fontFamily: 'Nunito_700Bold' }}
        >
          Preparing your home setup
        </Text>
        <Text
          className="text-[#6C7A74] text-center text-sm mt-3 leading-5"
          style={{ fontFamily: 'Nunito_400Regular' }}
        >
          We are checking your account and restoring your onboarding progress.
        </Text>
      </View>
    );
  }

  // --- Step Navigation ---
  if (currentStep === 'welcome') {
    return renderStep(
      <WelcomeUser userName={firstName} onFinish={() => transitionTo('house')} />,
    );
  }

  if (currentStep === 'house') {
    return renderStep(
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
    return renderStep(
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <WearableSync
          onNext={() => transitionTo('spotify')}
          onSkip={() => transitionTo('spotify')}
        />
      </Animated.View>
    );
  }

  if (currentStep === 'spotify') {
    return renderStep(
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <SpotifyConnect
          onNext={() => transitionTo('activities')}
          onSkip={() => transitionTo('activities')}
        />
      </Animated.View>
    );
  }

  if (currentStep === 'activities') {
    return renderStep(
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
    return renderStep(
      <FinalLoading
        onComplete={async () => {
          try {
            const { data: { user } } = await supabase.auth.getUser();
            let hasError = false;

            if (user) {
              // Read homeMode and selectedActivities from AsyncStorage to avoid React state race conditions
              let effectiveHomeMode = homeMode;
              let effectiveHouseName = houseName;
              let effectiveHouseId = houseId;
              let effectiveActivities = selectedActivities;
              try {
                const saved = await AsyncStorage.getItem('@onboarding_progress');
                if (saved) {
                  const parsed = JSON.parse(saved);
                  if (parsed?.data?.homeMode) effectiveHomeMode = parsed.data.homeMode;
                  if (parsed?.data?.houseName) effectiveHouseName = parsed.data.houseName;
                  if (parsed?.data?.houseId) effectiveHouseId = parsed.data.houseId;
                  if (parsed?.data?.selectedActivities) effectiveActivities = parsed.data.selectedActivities;
                }
              } catch { /* use state fallback */ }

              logger.debug('[Onboarding] homeMode (effective):', effectiveHomeMode);
              let finalHomeId: number | null = null;

              if (effectiveHomeMode === 'create') {
                // 1. Create Home
                // Gerar Join Code (6 carateres alfanuméricos maiúsculos)
                const generatedCode = Math.random().toString(36).substring(2, 8).toUpperCase();
                
                logger.debug('Creating new home during onboarding:', effectiveHouseName || 'Nidush Home');
                const { data: homeData, error: homeError } = await supabase
                  .from('homes')
                  .insert({ 
                    name: effectiveHouseName || 'Nidush Home',
                    join_code: generatedCode,
                    creator_user_id: user.id,
                  })
                  .select('id')
                  .single();

                if (homeError) {
                  logger.error('Error creating home in public schema:', homeError);
                  hasError = true;
                } else if (homeData) {
                  finalHomeId = homeData.id;
                }
              } else {
                // Join existing home
                const upperCode = effectiveHouseId.toUpperCase().trim();
                if (!upperCode) {
                  openAlert('Missing join code', 'Please enter the code for the home you want to join.');
                  hasError = true;
                } else {
                  logger.debug('Attempting to join home with join code.');
                  let { data: joinedHomeId, error: homeError } = await supabase
                    .rpc('join_home_by_code', { p_join_code: upperCode });

                  const homeErrorStatus =
                    homeError && 'status' in homeError
                      ? Number((homeError as { status?: number }).status)
                      : undefined;
                  const rpcMissing = homeError && (
                    homeError.code === 'PGRST202' ||
                    homeErrorStatus === 404 ||
                    String(homeError.message).toLowerCase().includes('schema cache') ||
                    String(homeError.message).toLowerCase().includes('function public.join_home_by_code')
                  );

                  if (rpcMissing) {
                    logger.warn('RPC join_home_by_code not found. Trying manage-home fallback.', homeError);
                    try {
                      const fallbackResult = await invokeFunction<{ home?: { id?: number | string | null } }>('manage-home', {
                        action: 'join-home',
                        joinCode: upperCode,
                      });
                      joinedHomeId = fallbackResult?.home?.id ?? null;
                      homeError = null;
                    } catch (fallbackError: unknown) {
                      homeError = {
                        name: 'PostgrestError',
                        message:
                          fallbackError instanceof Error
                            ? fallbackError.message
                            : 'Fallback join failed',
                        details: '',
                        hint: '',
                        code: 'EDGE_FALLBACK',
                        toJSON() {
                          return this;
                        },
                      };
                    }
                  }

                  if (homeError || !joinedHomeId) {
                    if (homeError) logger.error('Error finding existing home:', homeError);
                    if (rpcMissing) {
                      openAlert(
                        'Home join unavailable',
                        'Joining an existing home is not ready in this environment yet. Apply the latest Supabase migrations and try again.',
                      );
                    } else {
                      openAlert(
                        'Join code not found',
                        'We could not find a home with that code. Check the code and try again.',
                      );
                    }
                    hasError = true;
                  } else {
                    finalHomeId = Number(joinedHomeId);
                  }
                }
              }

              if (finalHomeId && !hasError) {
                // 2. Create User in public schema
                logger.debug('Associating onboarding user to home:', finalHomeId);
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
                  logger.error('Error syncing user in public schema:', userError);
                  hasError = true;
                }

                if (!hasError) {
                  if (effectiveHomeMode === 'create') {
                    // 3. Associate creator with home as admin.
                    logger.debug('[Onboarding] Assigning admin role to home:', finalHomeId);
                    const { error: assocError } = await supabase
                      .from('user_homes')
                      .upsert({
                        user_id: user.id,
                        home_id: finalHomeId,
                        role: 'admin'
                      }, { onConflict: 'user_id,home_id' });

                    if (assocError) {
                      logger.error('Error associating user with home:', assocError);
                      hasError = true;
                    }
                  } else {
                    // The RPC/Edge Function already associates residents with existing homes.
                    logger.debug('[Onboarding] User joined home as resident:', finalHomeId);
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
            logger.error('Error completing onboarding', e);
            openAlert(
              'Could not finish setup',
              'Your progress is still here. Please review your home details and try again.',
            );
            setCurrentStep('house');
          }
        }}
      />
    );
  }

  return null;
}
