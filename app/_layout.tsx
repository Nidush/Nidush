import { BiometricsProvider } from '@/context/BiometricsContext';
import { NotificationsProvider } from '@/context/NotificationsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { supabase } from '../utils/supabase';
import './../global.css';

// Mantém a Splash nativa ativa no arranque
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isReady, setIsReady] = useState(false);
  const router = useRouter();

  // 1. Configura o player de áudio (certifica-te que o ficheiro existe em assets/audio/jingle.mp3)
  const player = useAudioPlayer(require('../assets/audio/intro.mp3'));

  const [isRoutingReady, setIsRoutingReady] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isAnimationComplete, setAnimationComplete] = useState(false);

  const opacityAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  // Lógica de Redirecionamento (Onboarding vs Tabs)
  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    const checkOnboarding = async () => {
      try {
        // 1. Check local flag
        const viewed = await AsyncStorage.getItem('@viewedOnboarding');
        
        // 2. Check Supabase session and user status as a secondary check for existing users
        const { data: { user } } = await supabase.auth.getUser();
        
        if (user) {
          // If logged in, check if they have a home
          // Check by auth_uid OR email for robustness
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
        <View style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="onboarding" />
            <Stack.Screen name="setup-profile" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="profile-selection" />
            <Stack.Screen name="activity-details" />
            <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
          </Stack>

          {/* Ecrã de Splash Falso para Animação */}
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
      </BiometricsProvider>
    </NotificationsProvider>
  );
}
