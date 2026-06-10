import { BiometricsProvider } from '@/context/BiometricsContext';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { SpotifyProvider } from '@/context/SpotifyContext';
import { ConsentModal } from '@/components/legal/ConsentModal';
import { LEGAL_CONSENT_KEY } from '@/components/legal/LegalContent';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import { Stack, usePathname, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View, Platform } from 'react-native';
import { getSessionUser, supabase } from '../utils/supabase';
import { registerHealthConnectBackgroundSync } from '../utils/healthConnectBackgroundTask';
import * as WebBrowser from 'expo-web-browser';
import { logger } from '../utils/logger';
import {
  installGlobalErrorHandlers,
  setObservabilityContext,
  setObservabilityConsent,
  setObservabilityUser,
  trackEvent,
} from '../utils/observability';
import { hasHealthConnectEnabled, recordLegalPolicyConsents } from '../utils/legal';
import './../global.css';

WebBrowser.maybeCompleteAuthSession();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const player = useAudioPlayer(require('../assets/audio/intro.mp3'));

  const [isRoutingReady, setIsRoutingReady] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isAnimationComplete, setAnimationComplete] = useState(false);
  const [isConsentVisible, setIsConsentVisible] = useState(false);

  const opacityAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    installGlobalErrorHandlers();
    setObservabilityContext({
      releaseChannel: process.env.EXPO_PUBLIC_APP_ENV || 'development',
    });
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const checkOnboarding = async () => {
      // 0. Inicializar Health Connect apenas quando a integracao ja tiver sido ativada pelo utilizador
      if (Platform.OS === 'android') {
        try {
          const isHealthConnectEnabled = await hasHealthConnectEnabled();
          if (isHealthConnectEnabled) {
            const { initialize, getSdkStatus, SdkAvailabilityStatus } = await import('react-native-health-connect');
            const status = await getSdkStatus();
            if (status === SdkAvailabilityStatus.SDK_AVAILABLE) {
              await initialize();
              await registerHealthConnectBackgroundSync();
              logger.debug('Health Connect initialized after explicit user activation.');
            }
          }
        } catch (error) {
          logger.warn('Health Connect pre-init failed.', error);
        }
      }

      try {
        const viewed = await AsyncStorage.getItem('@viewedOnboarding');
        const legalConsent = await AsyncStorage.getItem(LEGAL_CONSENT_KEY);
        setIsConsentVisible(legalConsent !== 'accepted');
        setObservabilityConsent(legalConsent === 'accepted');

        const user = await getSessionUser();
        setObservabilityUser(user?.id);
        
        if (user) {
          const { data: homeAssoc } = await supabase
            .from('user_homes')
            .select('home_id')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
            
          if (homeAssoc?.home_id) {
            await AsyncStorage.setItem('@viewedOnboarding', 'true');
            trackEvent('restored-authenticated-session', {
              area: 'routing',
              screen: 'root-layout',
              userId: user.id,
            });
            router.replace('/(tabs)');
            return;
          } else {
            // Logged in but no home? Go to setup-profile
            trackEvent('redirected-to-setup-profile', {
              area: 'routing',
              screen: 'root-layout',
              userId: user.id,
            });
            router.replace('/setup-profile');
            return;
          }
        }

        // If not logged in, even if they viewed onboarding, 
        // we should probably send them to onboarding/login to authenticate.
        if (viewed === 'true') {
          // If they already viewed it, they can go to login or see onboarding again.
          // For a better UX, if they already saw onboarding but are not logged in,
          // we send them to login or onboarding. Let's send to onboarding as it has the 'Skip' to signup/login.
          trackEvent('redirected-to-onboarding', {
            area: 'routing',
            screen: 'root-layout',
            metadata: { viewedOnboarding: true },
          });
          router.replace('/onboarding');
        } else {
          trackEvent('redirected-to-onboarding', {
            area: 'routing',
            screen: 'root-layout',
            metadata: { viewedOnboarding: false },
          });
          router.replace('/onboarding');
        }
      } catch {
        trackEvent('fallback-onboarding-route', {
          area: 'routing',
          screen: 'root-layout',
        }, 'warn');
        router.replace('/onboarding');
      } finally {
        setIsRoutingReady(true);
      }
    };
    checkOnboarding();
  }, [isReady, router]);

  const handleAcceptLegalConsent = async () => {
    await AsyncStorage.setItem(LEGAL_CONSENT_KEY, 'accepted');
    setObservabilityConsent(true);
    try {
      const user = await getSessionUser();
      if (user) {
        await recordLegalPolicyConsents('legal_modal');
      }
    } catch (error) {
      logger.warn('Could not sync legal consent to backend.', error);
    }
    setIsConsentVisible(false);
  };

  useEffect(() => {
    if (isRoutingReady && isImageLoaded) {
      const startHandoffAnimation = async () => {
        try {
          await SplashScreen.hideAsync();

          if (player && Platform.OS !== 'web') {
            player.play();
          }

          Animated.sequence([
            Animated.delay(1000), 

            Animated.parallel([
              Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 900,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: Platform.OS !== 'web',
              }),
              Animated.timing(scaleAnim, {
                toValue: 12, 
                duration: 1000,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: Platform.OS !== 'web',
              }),
            ]),
          ]).start(() => {
            setAnimationComplete(true);
          });
        } catch (error) {
          logger.error('Erro na animação de splash:', error);
          setAnimationComplete(true);
        }
      };
      startHandoffAnimation();
    }
  }, [isRoutingReady, isImageLoaded, opacityAnim, player, scaleAnim]);

  const splashBackgroundColor = '#F0F2EB';
  const shouldUseInlineLegalFlow =
    pathname === '/pre-signup-consent' ||
    pathname === '/signup' ||
    pathname === '/setup-profile';

  return (
    <NotificationsProvider>
      <BiometricsProvider>
        <SpotifyProvider>
          <View style={{ flex: 1 }}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="onboarding" />
              <Stack.Screen name="setup-profile" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="profile-selection" />
              <Stack.Screen name="activity-details" />
              <Stack.Screen name="notifications" options={{ presentation: 'fullScreenModal' }} />
            </Stack>

            {!isAnimationComplete && (
              <Animated.View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: splashBackgroundColor,
                    opacity: opacityAnim,
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 999,
                  },
                ]}
              >
                <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
                  <Animated.Image
                    source={require('../assets/images/Logo.png')}
                    style={{
                      width: 200,
                      height: 200,
                    }}
                    resizeMode="contain"
                    onLoadEnd={() => setIsImageLoaded(true)}
                    onError={() => setIsImageLoaded(true)}
                    fadeDuration={0}
                  />
                </Animated.View>
              </Animated.View>
            )}

            <ConsentModal
              visible={isAnimationComplete && isConsentVisible && !shouldUseInlineLegalFlow}
              onAccept={handleAcceptLegalConsent}
            />
          </View>
        </SpotifyProvider>
      </BiometricsProvider>
    </NotificationsProvider>
  );
}
