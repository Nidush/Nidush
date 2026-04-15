import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';

interface WelcomeUserProps {
  userName?: string;
  onFinish: () => void;
}

const BACKGROUND_VIDEO = require('../../assets/videos/nidush_video7.mp4');

const WelcomeUser: React.FC<WelcomeUserProps> = ({ userName, onFinish }) => {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular: Nunito_400Regular,
    Nunito_600SemiBold: Nunito_600SemiBold,
    Nunito_700Bold: Nunito_700Bold,
  });

  const [dims, setDims] = useState(Dimensions.get('screen'));
  const textFade = useRef(new Animated.Value(0)).current;
  const screenFade = useRef(new Animated.Value(0)).current;
  const [currentStep, setCurrentStep] = useState(0);

  const isWebPC = dims.width > 768;

  const phrases = [
    `Welcome home, ${userName || 'User'}`,
    "Take a deep breath.",
    "Let's continue your journey"
  ];

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ screen }) =>
      setDims(screen),
    );
    return () => sub.remove();
  }, []);

  const player = useVideoPlayer(BACKGROUND_VIDEO, (p) => {
    p.loop = true;
    p.muted = true;
    p.playbackRate = 0.6;
  });

  useEffect(() => {
    if (player) {
      player.play();
    }
  }, [player]);

  useEffect(() => {
    if (!fontsLoaded) return;

    Animated.timing(screenFade, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    const animateText = (step: number) => {
      if (step >= phrases.length) {
        Animated.timing(screenFade, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => onFinish());
        return;
      }

      setCurrentStep(step);

      Animated.sequence([
        Animated.timing(textFade, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.delay(1800),
        Animated.timing(textFade, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => {
        animateText(step + 1);
      });
    };

    animateText(0);
  }, [onFinish, screenFade, textFade, phrases.length, fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <Animated.View
      style={{ flex: 1, backgroundColor: 'black', opacity: screenFade }}
      accessible
      accessibilityLabel="Welcome screen"
    >
      <StatusBar style="light" />

      {/* Vídeo de fundo */}
      <View
        style={StyleSheet.absoluteFill}
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        <VideoView
          player={player}
          nativeControls={false}
          contentFit="cover"
          style={StyleSheet.absoluteFill} // <- Usamos o absoluteFill também diretamente no vídeo!
        />
      </View>

      <View
        className="flex-1 bg-black/40 justify-center items-center px-10"
        style={{ zIndex: 2 }}
        accessible={true}
      >
        <SafeAreaView
          className="items-center w-full flex-1 justify-center"
          edges={['top']}
        >
          {/* Logo */}
          <View
            style={{ position: 'absolute', top: isWebPC ? 60 : 40 }}
            className="items-center w-full"
            accessible
            accessibilityLabel="Nidush logo"
          >
            <Image
              source={require('../../assets/images/Logo.png')}
              style={{
                width: isWebPC ? 80 : 50,
                height: isWebPC ? 80 : 50,
                tintColor: '#FFFFFF',
              }}
              resizeMode="contain"
            />
          </View>

          {/* Texto animado */}
          <Animated.View
            style={{
              opacity: textFade,
              maxWidth: isWebPC ? 900 : 400,
              transform: [
                {
                  scale: textFade.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.95, 1],
                  }),
                },
              ],
            }}
            accessible
            accessibilityRole="header"
            accessibilityLiveRegion="polite"
          >
            <Text
              maxFontSizeMultiplier={1.2}
              style={{
                fontFamily: 'Nunito_700Bold',
                fontSize: isWebPC ? 80 : 40,
                lineHeight: isWebPC ? 90 : 48,
                color: '#FFFFFF',
                textAlign: 'center',
              }}
            >
              {phrases[currentStep]}
            </Text>
          </Animated.View>
        </SafeAreaView>
      </View>
    </Animated.View>
  );
};

WelcomeUser.displayName = 'WelcomeUser';

export default WelcomeUser;
