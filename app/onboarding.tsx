import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView, type VideoSource } from 'expo-video';
import React, { memo, useCallback, useEffect, useRef, useState } from 'react';
import {
  AccessibilityInfo,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

const SLIDE_DURATION = 10000;
const WELCOME_VIDEO = require('../assets/videos/nidush_video1.mp4');

type BlurColors = readonly [string, string, string];
type OnboardingSlide = {
  id: string;
  title: string;
  description: string;
  video: VideoSource;
  blurColors: BlurColors;
  isLast?: boolean;
};

const SLIDES: OnboardingSlide[] = [
  {
    id: '1',
    title: 'Your home,\nyour safe space',
    description:
      "Stress and anxiety shouldn't follow you home. Nidush is here to help you disconnect, reconnect with yourself and turn your home into a space that adapts to you.",
    video: require('../assets/videos/nidush_video2.mp4'),
    blurColors: [
      'transparent',
      'rgba(137, 98, 59, 0.4)',
      'rgba(137, 98, 59, 0.95)',
    ],
  },
  {
    id: '2',
    title: 'Your home,\ntuned to you',
    description:
      'Create and get recommendations of Scenarios that combine your smart devices, and transform each room into a space that adapts to how you’re feeling.',
    video: require('../assets/videos/nidush_video3.mp4'),
    blurColors: [
      'transparent',
      'rgba(60, 40, 100, 0.4)',
      'rgba(15, 10, 30, 0.9)',
    ],
  },
  {
    id: '3',
    title: 'Your favorite\nhobbies in one place',
    description:
      'Craft and discover activities tailored to you, within a personalized atmosphere where every distraction disappears.',
    video: require('../assets/videos/nidush_video4.mp4'),
    blurColors: [
      'transparent',
      'rgba(40, 100, 60, 0.4)',
      'rgba(10, 25, 15, 0.9)',
    ],
  },
  {
    id: '4',
    title: 'Technology that\nfeels you',
    description:
      'Through wearable integration, Nidush senses your inner rhythm, gently intervening at the exact moment stress or anxiety appears to restore your calm.',
    video: require('../assets/videos/nidush_video5.mp4'),
    blurColors: [
      'transparent',
      'rgba(201, 162, 86, 0.4)',
      'rgba(201, 162, 86, 0.95)',
    ],
  },
  {
    id: '5',
    title: 'Different residents,\nDifferent profiles',
    description:
      'Create a personal profile, that respects your privacy and shared spaces.',
    video: require('../assets/videos/nidush_video6.mp4'),
    blurColors: [
      'transparent',
      'rgba(13, 47, 39, 0.4)',
      'rgba(13, 47, 39, 0.95)',
    ],
  },
  {
    id: '6',
    title: 'Shall we begin your\njourney to peace?',
    description:
      'Join us to silence the noise and start the creation of your safe space.',
    video: require('../assets/videos/nidush_video7.mp4'),
    isLast: true,
    blurColors: [
      'transparent',
      'rgba(40, 74, 55, 0.4)',
      'rgba(40, 74, 55, 0.95)',
    ],
  },
];
type ScreenDimensions = ReturnType<typeof Dimensions.get>;

const VideoSlide = memo(
  ({
    videoSource,
    isActive,
    dims,
  }: {
    videoSource: VideoSource;
    isActive: boolean;
    dims: ScreenDimensions;
  }) => {
    const player = useVideoPlayer(videoSource, (p) => {
      p.loop = true;
      p.muted = true;
    });

    useEffect(() => {
      let isMounted = true;
      const handlePlay = async () => {
        try {
          if (isActive) {
            await new Promise((resolve) => setTimeout(resolve, 100));
            if (isMounted) await player.play();
          } else {
            player.pause();
          }
        } catch (e) {
          console.error(e);
        }
      };
      handlePlay();
      return () => {
        isMounted = false;
      };
    }, [isActive, player]);

    return (
      <VideoView
        player={player}
        nativeControls={false}
        contentFit="cover"
        style={StyleSheet.absoluteFill}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      />
    );
  },
);
VideoSlide.displayName = 'VideoSlide';

const AnimatedIndicator = ({
  index,
  currentIndex,
  duration,
  isPlaying,
}: {
  index: number;
  currentIndex: number;
  duration: number;
  isPlaying: boolean;
}) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (index === currentIndex && isPlaying) {
      widthAnim.setValue(0);
      Animated.timing(widthAnim, {
        toValue: 100,
        duration,
        useNativeDriver: false,
      }).start();
    } else {
      widthAnim.setValue(index <= currentIndex ? 100 : 0);
    }
  }, [currentIndex, isPlaying, index, duration, widthAnim]);

  return (
    <View
      // Removemos o accessible, accessibilityRole e accessibilityLabel daqui!
      className="h-[5px] flex-1 mx-1 rounded-full bg-white/30 overflow-hidden"
    >
      <Animated.View
        className="h-full bg-[#78B478]"
        style={{
          width: widthAnim.interpolate({
            inputRange: [0, 100],
            outputRange: ['0%', '100%'],
          }),
        }}
      />
    </View>
  );
};

export default function Onboarding() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular: Nunito_400Regular,
    Nunito_600SemiBold: Nunito_600SemiBold,
    Nunito_700Bold: Nunito_700Bold,
  });

  const [dims, setDims] = useState(Dimensions.get('screen'));
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Estados de Acessibilidade e Controlo
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [isScreenReaderEnabled, setIsScreenReaderEnabled] = useState(false);

  const scrollRef = useRef<FlatList>(null);
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ screen }) =>
      setDims(screen),
    );
    return () => sub.remove();
  }, []);

  // Escuta se há um leitor de ecrã (VoiceOver/TalkBack) ativo
  useEffect(() => {
    // Verifica ao iniciar
    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      setIsScreenReaderEnabled(enabled);
      if (enabled) setIsAutoPlaying(false);
    });

    // Escuta se o utilizador liga/desliga o leitor com a app aberta
    const subscription = AccessibilityInfo.addEventListener(
      'screenReaderChanged',
      (enabled) => {
        setIsScreenReaderEnabled(enabled);
        if (enabled) setIsAutoPlaying(false);
      },
    );
    return () => subscription.remove();
  }, []);

  const finishOnboarding = useCallback(async () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      // Removido o AsyncStorage.setItem daqui.
      // O utilizador só "viu" o onboarding quando terminar a configuração.
      router.replace('/pre-signup-consent');
    });
  }, [router, fadeAnim]);

  const handleDiscover = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      setShowWelcome(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start();
    });
  };

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => {
      if (prev < SLIDES.length - 1) {
        const next = prev + 1;
        scrollRef.current?.scrollToIndex({ index: next, animated: true });
        return next;
      }
      return prev;
    });
  }, []);

  const goToPrev = () => {
    if (currentIndex > 0) {
      const prev = currentIndex - 1;
      scrollRef.current?.scrollToIndex({ index: prev, animated: true });
      setCurrentIndex(prev);
    }
  };

  // Se o utilizador tocar para avançar, assume o controlo e o auto-play pára
  const handleManualNext = () => {
    setIsAutoPlaying(false);
    goToNext();
  };

  const handleManualPrev = () => {
    setIsAutoPlaying(false);
    goToPrev();
  };

  useEffect(() => {
    if (!showWelcome && currentIndex < SLIDES.length - 1 && isAutoPlaying) {
      const timer = setInterval(goToNext, SLIDE_DURATION);
      return () => clearInterval(timer);
    }
  }, [showWelcome, currentIndex, goToNext, isAutoPlaying]);

  if (!fontsLoaded) return null;

  const renderItem = ({ item, index }: { item: OnboardingSlide; index: number }) => (
    <View
      accessible
      accessibilityLabel={`Slide ${index + 1}. ${item.title}`}
      style={{ width: dims.width, height: '100%' }}
      className="bg-black relative overflow-hidden"
    >
      {/* 1. Vídeo de Fundo */}
      {Math.abs(currentIndex - index) <= 1 && (
        <VideoSlide
          videoSource={item.video}
          isActive={currentIndex === index}
          dims={dims}
        />
      )}

      {/* 2. Efeito de Desfoque Progressivo */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <MaskedView
          style={StyleSheet.absoluteFill}
          maskElement={
            <LinearGradient
              colors={['transparent', 'transparent', 'black']}
              locations={[0, 0.1, 0.7]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          }
        >
          <BlurView
            intensity={Platform.OS === 'ios' ? 70 : 100}
            tint="default"
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />
        </MaskedView>

        {item.blurColors ? (
          <LinearGradient
            colors={item.blurColors}
            locations={[0.2, 0.6, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.4)', 'rgba(0,0,0,0.85)']}
            locations={[0.2, 0.6, 1]}
            style={StyleSheet.absoluteFill}
          />
        )}
      </View>

      {/* 3. Camada de Interação (Controlos Invisíveis originais) */}
      <View className="flex-1">
        {/* Renderiza as zonas de toque gigantes APENAS se o leitor de ecrã estiver desligado */}
        {!isScreenReaderEnabled && (
          <View
            className="absolute inset-0 z-10 flex-row"
            pointerEvents="box-none"
          >
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Previous slide"
              accessibilityHint="Navigates to the previous onboarding slide"
              className="h-full w-1/4"
              onPress={handleManualPrev}
              activeOpacity={1}
            />
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Next slide"
              accessibilityHint="Navigates to the next onboarding slide"
              className="h-full w-3/4"
              onPress={handleManualNext}
              activeOpacity={1}
            />
          </View>
        )}

        <SafeAreaView
          className="flex-1 z-20"
          edges={['top', 'bottom']}
          pointerEvents="box-none"
        >
          <View
            className="flex-1 w-full max-w-[1200px] mx-auto px-8 md:px-12"
            pointerEvents="box-none"
          >
            <View className="flex-row justify-between items-center mt-6 md:mt-10 h-12">
              <Image
                source={require('../assets/images/Logo.png')}
                accessibilityLabel="Nidush logo"
                accessible
                style={{
                  width: dims.width > 768 ? 60 : 48,
                  height: dims.width > 768 ? 60 : 48,
                  tintColor: '#FFFFFF',
                }}
                resizeMode="contain"
              />

              <TouchableOpacity
                testID="skip-button"
                accessibilityRole="button"
                accessibilityLabel="Skip onboarding"
                accessibilityHint="Skips the introduction and goes to sign up"
                onPress={finishOnboarding}
                className="p-2"
              >
                <Text
                  maxFontSizeMultiplier={1.2}
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                  className="text-white text-lg md:text-xl opacity-80"
                >
                  Skip
                </Text>
              </TouchableOpacity>
            </View>

            <View
              className={`mt-auto ${item.isLast ? 'mb-8 md:mb-10' : 'mb-16 md:mb-24'} self-start w-full max-w-[750px]`}
              pointerEvents="none"
            >
              <Text
                maxFontSizeMultiplier={1.2}
                accessibilityRole="header"
                style={{ fontFamily: 'Nunito_700Bold' }}
                className="text-white text-[34px] md:text-7xl leading-[42px] md:leading-[80px] mb-6"
              >
                {item.title}
              </Text>

              <Text
                maxFontSizeMultiplier={1.2}
                accessibilityLabel={item.description}
                style={{ fontFamily: 'Nunito_400Regular' }}
                className="text-white text-[18px] md:text-2xl leading-7 md:leading-9 opacity-90 pr-10"
              >
                {item.description}
              </Text>
            </View>

            <View
              className={`w-full items-center ${item.isLast ? 'pb-24 md:pb-32' : 'pb-10'}`}
              pointerEvents="box-none"
            >
              {item.isLast && (
                <TouchableOpacity
                  testID="begin-journey-button"
                  accessibilityRole="button"
                  accessibilityLabel="Begin your journey"
                  accessibilityHint="Finishes onboarding and goes to sign up"
                  onPress={finishOnboarding}
                  className="bg-[#589158] w-4/6 max-w-[300px] py-4 rounded-full items-center shadow-lg active:scale-95"
                >
                  <Text
                    maxFontSizeMultiplier={1.2}
                    style={{ fontFamily: 'Nunito_700Bold' }}
                    className="text-white text-xl md:text-2xl"
                  >
                    Begin Journey
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>
    </View>
  );

  return (
    <Animated.View
      style={{ flex: 1, backgroundColor: 'black', opacity: fadeAnim }}
    >
      <StatusBar style="light" />

      {showWelcome ? (
        <View
          style={{ width: dims.width, height: dims.height }}
          accessible
          accessibilityLabel="Welcome to Nidush"
        >
          <VideoSlide videoSource={WELCOME_VIDEO} isActive={true} dims={dims} />

          <View className="flex-1 bg-black/10 justify-end items-center pb-24">
            <SafeAreaView className="items-center w-full px-6 max-w-[1000px]">
              <Image
                source={require('../assets/images/Logo.png')}
                accessibilityLabel="Nidush logo"
                accessible
                style={{
                  width: dims.width > 768 ? 280 : 220,
                  height: dims.width > 768 ? 280 : 220,
                  marginBottom: 30,
                }}
                resizeMode="contain"
              />

              <Text
                maxFontSizeMultiplier={1.2}
                accessibilityRole="header"
                style={{ fontFamily: 'Nunito_700Bold' }}
                className="text-5xl md:text-8xl text-white text-center"
              >
                Welcome to Nidush
              </Text>

              <Text
                maxFontSizeMultiplier={1.2}
                style={{ fontFamily: 'Nunito_400Regular' }}
                className="text-xl md:text-3xl text-white mt-4 text-center opacity-80"
              >
                Your safe space starts here.
              </Text>

              <TouchableOpacity
                testID="discover-button"
                accessibilityRole="button"
                accessibilityLabel="Discover Nidush"
                accessibilityHint="Starts the onboarding slides"
                className="bg-[#589158] px-16 py-5 rounded-full mt-16 shadow-md items-center active:scale-95"
                onPress={handleDiscover}
              >
                <Text
                  maxFontSizeMultiplier={1.2}
                  style={{ fontFamily: 'Nunito_700Bold' }}
                  className="text-white text-xl md:text-2xl"
                >
                  Discover
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => router.replace('/login')}
                className="mt-6"
              >
                <Text
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                  className="text-white text-lg opacity-80 underline"
                >
                  I already have an account
                </Text>
              </TouchableOpacity>
            </SafeAreaView>
          </View>
        </View>
      ) : (
        <View className="flex-1">
          <FlatList
            accessibilityRole="adjustable"
            accessibilityLabel="Onboarding slides"
            key={`list-${dims.width}`}
            ref={scrollRef}
            data={SLIDES}
            renderItem={renderItem}
            horizontal
            pagingEnabled
            scrollEnabled={Platform.OS !== 'web'}
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, index) => ({
              length: dims.width,
              offset: dims.width * index,
              index,
            })}
          />

          {/* Barra Inferior (Dinâmica conforme acessibilidade) */}
          {/* Barra Inferior (Dinâmica conforme acessibilidade) */}
          {/* Barra Inferior (Dinâmica na posição e na acessibilidade) */}
          <View
            className={`absolute w-full z-50 ${
              isScreenReaderEnabled
                ? 'bottom-[3%] md:bottom-[4%]' // Mais para baixo se o leitor estiver ativo para não colar ao texto
                : 'bottom-[8%] md:bottom-[6%] pointer-events-none' // Posição original mais subida no modo normal
            }`}
          >
            {/* O contentor ajusta o padding dependendo do modo */}
            <View
              className={`flex-row items-center w-full max-w-[1200px] mx-auto ${isScreenReaderEnabled ? 'justify-between px-6 md:px-12' : 'px-10 md:px-12'}`}
            >
              {/* Botão Back (Visível apenas se leitor de ecrã ativo) */}
              {isScreenReaderEnabled && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Go to previous slide"
                  onPress={handleManualPrev}
                  disabled={currentIndex === 0}
                  className="p-3"
                >
                  <Text
                    style={{ fontFamily: 'Nunito_700Bold' }}
                    className={`text-white text-lg ${currentIndex === 0 ? 'opacity-0' : 'opacity-80'}`}
                  >
                    Back
                  </Text>
                </TouchableOpacity>
              )}

              {/* Contentor dos Indicadores (Agrupado para o Leitor de Ecrã) */}
              <View
                className={`flex-row flex-1 ${isScreenReaderEnabled ? 'px-4 max-w-[250px]' : ''}`}
                accessible={true}
                accessibilityRole="progressbar"
                accessibilityLabel={`Slide ${currentIndex + 1} of ${SLIDES.length}`}
                accessibilityValue={{
                  min: 1,
                  max: SLIDES.length,
                  now: currentIndex + 1,
                }}
                accessibilityElementsHidden={true}
                importantForAccessibility="no-hide-descendants"
              >
                {SLIDES.map((_, index) => (
                  <AnimatedIndicator
                    key={index}
                    index={index}
                    currentIndex={currentIndex}
                    duration={SLIDE_DURATION}
                    isPlaying={isAutoPlaying}
                  />
                ))}
              </View>

              {/* Botão Next (Visível apenas se leitor de ecrã ativo) */}
              {isScreenReaderEnabled && (
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Go to next slide"
                  onPress={handleManualNext}
                  disabled={currentIndex === SLIDES.length - 1}
                  className="p-3"
                >
                  <Text
                    style={{ fontFamily: 'Nunito_700Bold' }}
                    className={`text-white text-lg ${currentIndex === SLIDES.length - 1 ? 'opacity-0' : 'opacity-80'}`}
                  >
                    Next
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}
    </Animated.View>
  );
}
