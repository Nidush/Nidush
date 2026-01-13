import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, ImageSourcePropType, Animated, StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';

interface WelcomeUserProps {
  onFinish: () => void;
}

const BACKGROUND_VIDEO = require('../../assets/videos/nidush_video7.mp4');

const WelcomeUser: React.FC<WelcomeUserProps> = ({ onFinish }) => {
  const textFade = useRef(new Animated.Value(0)).current;
  const screenFade = useRef(new Animated.Value(0)).current; 
  const [currentStep, setCurrentStep] = useState(0);

  const phrases = [
    "Welcome home, Laura",
    "Take a deep breath.",
    "Let's continue your journey"
  ];

  const player = useVideoPlayer(BACKGROUND_VIDEO, (p) => {
    p.loop = true;
    p.muted = true;
    p.playbackRate = 0.6; 
    p.play();
  });

  useEffect(() => {
    // 1. Entrada suave do ecrã
    Animated.timing(screenFade, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
    }).start();

    const animateText = (step: number) => {
      if (step >= phrases.length) {
        // 2. Saída suave para o próximo componente (HouseName)
        Animated.timing(screenFade, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }).start(() => onFinish());
        return;
      }
      
      setCurrentStep(step);

      // Animação do texto (Fade In -> Delay -> Fade Out)
      Animated.sequence([
        Animated.timing(textFade, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.delay(1800),
        Animated.timing(textFade, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]).start(() => {
        animateText(step + 1);
      });
    };

    animateText(0);
  }, [onFinish]);

  return (
    <Animated.View style={{ flex: 1, backgroundColor: 'black', opacity: screenFade }}>
      <StatusBar style="light" />
      
      <VideoView
        player={player}
        nativeControls={false}
        contentFit="cover"
        style={StyleSheet.absoluteFill}
      />
      
      {/* Overlay escuro para destacar o texto */}
      <View className="flex-1 bg-black/40 justify-center items-center px-10">
        <SafeAreaView className="items-center w-full" edges={['top']}>
          
          {/* Logo no topo */}
          <View className="absolute -top-40 items-center w-full">
            <Image
              source={require('../../assets/images/Logo.png') as ImageSourcePropType}
              className="w-12 h-12"
              style={{ tintColor: '#FFFFFF' }}
              resizeMode="contain"
            />
          </View>

          <Animated.View 
            style={{ 
              opacity: textFade, 
              transform: [{ 
                scale: textFade.interpolate({ 
                  inputRange: [0, 1], 
                  outputRange: [0.9, 1] 
                }) 
              }] 
            }}
          >
            <Text 
              style={{ fontFamily: 'Nunito-ExtraBold', fontSize: 40 }} 
              className="text-white text-center leading-tight"
            >
              {phrases[currentStep]}
            </Text>
          </Animated.View>
          
        </SafeAreaView>
      </View>
    </Animated.View>
  );
};

export default WelcomeUser;