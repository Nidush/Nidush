import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Image, Animated, Dimensions } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useVideoPlayer, VideoView } from 'expo-video';

interface WelcomeUserProps {
  onFinish: () => void;
}

const BACKGROUND_VIDEO = require('../../assets/videos/nidush_video7.mp4');

const WelcomeUser: React.FC<WelcomeUserProps> = ({ onFinish }) => {
  const [dims, setDims] = useState(Dimensions.get('window'));
  const textFade = useRef(new Animated.Value(0)).current;
  const screenFade = useRef(new Animated.Value(0)).current; 
  const [currentStep, setCurrentStep] = useState(0);

  const isWebPC = dims.width > 768;

  const phrases = [
    "Welcome home, Laura",
    "Take a deep breath.",
    "Let's continue your journey"
  ];

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
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
        Animated.timing(textFade, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.delay(1800),
        Animated.timing(textFade, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]).start(() => {
        animateText(step + 1);
      });
    };

    animateText(0);

  }, [onFinish, screenFade, textFade, phrases.length]); 

  return (
    <Animated.View style={{ flex: 1, backgroundColor: 'black', opacity: screenFade }}>
      <StatusBar style="light" />
      
      <View style={{ width: dims.width, height: dims.height, position: 'absolute' }}>
        <VideoView
          player={player}
          nativeControls={false}
          contentFit="cover"
          style={{ width: '100%', height: '100%' }}
        />
      </View>
      
      <View 
        className="flex-1 bg-black/40 justify-center items-center px-10"
        style={{ zIndex: 2 }}
      >
        <SafeAreaView className="items-center w-full flex-1 justify-center" edges={['top']}>
          
          <View 
            style={{ position: 'absolute', top: isWebPC ? 60 : 40 }} 
            className="items-center w-full"
          >
            <Image
              source={require('../../assets/images/Logo.png')}
              style={{ 
                width: isWebPC ? 80 : 50, 
                height: isWebPC ? 80 : 50, 
                tintColor: '#FFFFFF' 
              }}
              resizeMode="contain"
            />
          </View>

          <Animated.View 
            style={{ 
              opacity: textFade, 
              maxWidth: isWebPC ? 900 : 400,
              transform: [{ 
                scale: textFade.interpolate({ 
                  inputRange: [0, 1], 
                  outputRange: [0.95, 1] 
                }) 
              }] 
            }}
          >
            <Text 
              style={{ 
                fontFamily: 'Nunito-ExtraBold', 
                fontSize: isWebPC ? 80 : 40,
                lineHeight: isWebPC ? 90 : 48
              }} 
              className="text-white text-center"
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