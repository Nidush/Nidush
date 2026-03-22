import { BiometricsProvider } from '@/context/BiometricsContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAudioPlayer } from 'expo-audio';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import './../global.css';

// Mantém a Splash nativa ativa no arranque
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
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
        const viewed = await AsyncStorage.getItem('@viewedOnboarding');
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
  }, [router]);

  // ANIMAÇÃO HBO MAX COM JINGLE NO INÍCIO
  useEffect(() => {
    if (isRoutingReady && isImageLoaded) {
      const startHandoffAnimation = async () => {
        try {
          await SplashScreen.hideAsync();

          // B. COMEÇA O JINGLE IMEDIATAMENTE (Logo ainda está parado)
          if (player) {
            player.play();
          }

          // C. Arranca a sequência de animação
          Animated.sequence([
            Animated.delay(1500), // O logo fica parado por 1 segundo enquanto o som toca

            Animated.parallel([
              // Início da expansão imersiva
              Animated.timing(opacityAnim, {
                toValue: 0,
                duration: 900,
                easing: Easing.bezier(0.4, 0, 0.2, 1),
                useNativeDriver: true,
              }),
              Animated.timing(scaleAnim, {
                toValue: 12, // Expansão estilo HBO Max
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
    <BiometricsProvider>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="profile-selection" />
          <Stack.Screen name="activity-details" />
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
  );
}
