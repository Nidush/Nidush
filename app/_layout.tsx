import { BiometricsProvider } from '@/context/BiometricsContext';
import { NotificationsProvider } from '@/context/NotificationsContext';
import { SpotifyProvider } from '@/context/SpotifyContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { supabase } from '../utils/supabase';
import * as WebBrowser from 'expo-web-browser';
import './../global.css';

WebBrowser.maybeCompleteAuthSession();

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  const player = useAudioPlayer(require('../assets/audio/intro.mp3'));

  const [isRoutingReady, setIsRoutingReady] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isAnimationComplete, setAnimationComplete] = useState(false);

  const opacityAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const checkOnboarding = async () => {
      try {
        const viewed = await AsyncStorage.getItem('@viewedOnboarding');
        
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          const { data: homeAssoc } = await supabase
            .from('user_homes')
            .select('home_id')
            .eq('user_id', user.id)
            .maybeSingle();
            
          if (homeAssoc?.home_id) {
            await AsyncStorage.setItem('@viewedOnboarding', 'true');
            router.replace('/(tabs)');
            return;
          }
        }

        if (viewed === 'true') {
          router.replace('/(tabs)');
        } else {
          router.replace('/onboarding');
        }
      } catch (e) {
        router.replace('/onboarding');
      } finally {
        setIsRoutingReady(true);
      }
    };
    checkOnboarding();
  }, [isReady, router]);

  useEffect(() => {
    if (isRoutingReady && isImageLoaded) {
      const startHandoffAnimation = async () => {
        try {
          await SplashScreen.hideAsync();

          if (player) {
            player.play();
          }

          Animated.sequence([
            Animated.delay(1000), 

            Animated.parallel([
              Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 900,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: 12, 
                duration: 1000,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
              }),
            ]),
          ]).start(() => {
            setAnimationComplete(true);
          });
        } catch (e) {
          console.error('Erro na animação de splash:', e);
          setAnimationComplete(true);
        }
      };
      startHandoffAnimation();
    }
  }, [isRoutingReady, isImageLoaded, player]);

  const splashBackgroundColor = '#F0F2EB';

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
              <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
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
          </View>
        </SpotifyProvider>
      </BiometricsProvider>
    </NotificationsProvider>
  );
}
