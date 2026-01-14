import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
  Animated,
  StyleSheet,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useVideoPlayer, VideoView } from 'expo-video';

const { width, height } = Dimensions.get('window');
const SLIDE_DURATION = 5000;

const WELCOME_VIDEO = require('../assets/videos/nidush_video1.mp4');

const SLIDES = [
  { id: '1', title: 'Your home,\nyour safe space', description: "Stress and anxiety shouldn't follow you home. Nidush is here to help you disconnect, reconnect with yourself and turn your home into a space that adapts to you.", video: require('../assets/videos/nidush_video2.mp4') },
  { id: '2', title: 'Your home,\ntuned to you', description: 'Create and get recommendations of Scenarios that combine your smart devices, and transform each room into a space that adapts to how you’re feeling.', video: require('../assets/videos/nidush_video3.mp4') },
  { id: '3', title: 'Your favorite\nhobbies in one place', description: 'Craft and discover activities tailored to you, within a personalized atmosphere where every distraction disappears.', video: require('../assets/videos/nidush_video4.mp4') },
  { id: '4', title: 'Technology that\nfeels you', description: 'Through wearable integration, Nidush senses your inner rhythm, gently intervening at the exact moment stress or anxiety appears to restore your calm.', video: require('../assets/videos/nidush_video5.mp4') },
  { id: '5', title: 'Different residents,\nDifferent profiles', description: 'Create a personal profile, that respects your privacy and shared spaces.', video: require('../assets/videos/nidush_video6.mp4') },
  { id: '6', title: 'Shall we begin your\njourney to peace?', description: 'Join us to silence the noise and start the creation of your safe space.', video: require('../assets/videos/nidush_video7.mp4'), isLast: true },
];

// --- COMPONENTE DE VÍDEO OTIMIZADO ---
const VideoSlide = memo(({ videoSource, isActive }: { videoSource: any; isActive: boolean }) => {
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = true;
    p.staysActiveInBackground = true;
    if (isActive) p.play();
  });

  useEffect(() => {
    if (isActive) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, player]);

  return (
    <VideoView 
      player={player} 
      nativeControls={false} 
      contentFit="cover" 
      style={StyleSheet.absoluteFill} 
    />
  );
});
VideoSlide.displayName = 'VideoSlide';

// --- INDICADORES DE PROGRESSO ---
const AnimatedIndicator = ({ index, currentIndex, duration, isPlaying }: any) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (index === currentIndex && isPlaying) {
      widthAnim.setValue(0);
      Animated.timing(widthAnim, { 
        toValue: 1, 
        duration: duration, 
        useNativeDriver: false 
      }).start();
    } else {
      widthAnim.setValue(index < currentIndex ? 1 : 0);
    }
  }, [currentIndex, isPlaying, index, duration, widthAnim]); 

  return (
    <View className="h-[5px] flex-1 mx-1 rounded-full bg-white/30 overflow-hidden">
      <Animated.View 
        className="h-full bg-[#78B478]" 
        style={{ width: widthAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }) }} 
      />
    </View>
  );
};

// --- COMPONENTE PRINCIPAL ---
export default function Onboarding() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<FlatList>(null);
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const finishOnboarding = useCallback(async () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 1000, useNativeDriver: true }).start(async () => {
      try {
        await AsyncStorage.setItem('@viewedOnboarding', 'true');
        router.replace('/signup');
      } catch {
        router.replace('/signup');
      }
    });
  }, [router, fadeAnim]);

  const handleDiscover = () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 800, useNativeDriver: true }).start(() => {
      setShowWelcome(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }).start();
    });
  };

  const goToNext = useCallback(() => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }
  }, [currentIndex]);

  const goToPrev = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      scrollRef.current?.scrollToIndex({ index: prevIndex, animated: true });
      setCurrentIndex(prevIndex);
    }
  };

  useEffect(() => {
    if (!showWelcome && currentIndex < SLIDES.length - 1) {
      const timer = setInterval(goToNext, SLIDE_DURATION);
      return () => clearInterval(timer);
    }
  }, [showWelcome, currentIndex, goToNext]);

  const renderItem = ({ item, index }: any) => {
    const shouldRenderVideo = Math.abs(currentIndex - index) <= 1;

    return (
      <View style={{ width, height }} className="bg-black">
        {shouldRenderVideo && (
          <VideoSlide videoSource={item.video} isActive={currentIndex === index} />
        )}
        
        <View className="flex-1 bg-black/30">
          <TouchableOpacity
            className="absolute left-0 top-0 bottom-0 w-1/4 z-10"
            onPress={goToPrev}
            activeOpacity={1}
          />
          <TouchableOpacity
            className="absolute right-0 top-0 bottom-0 w-3/4 z-10"
            onPress={goToNext}
            activeOpacity={1}
          />

          <SafeAreaView className="flex-1 justify-between px-6 z-20" edges={['top', 'bottom']} pointerEvents="box-none">
            <View className="flex-row justify-between items-center mt-12 h-12" pointerEvents="box-none">
              <Image 
                source={require('../assets/images/Logo.png')} 
                className="w-12 h-12" 
                style={{ tintColor: '#FFFFFF' }} 
                resizeMode="contain" 
              />
              {!item.isLast && (
                <TouchableOpacity onPress={finishOnboarding} className="p-2">
                  <Text className="text-white text-lg font-medium opacity-80">Skip</Text>
                </TouchableOpacity>
              )}
            </View>

            <View className="mt-auto mb-12" pointerEvents="none">
              <Text className="text-white text-[32px] font-bold leading-[42px] mb-4">{item.title}</Text>
              <Text className="text-white text-[17px] leading-6 opacity-90 pr-10">{item.description}</Text>
            </View>

            <View className={`${item.isLast ? 'h-40' : 'h-10'} justify-center items-center mb-10`} pointerEvents="box-none">
              {item.isLast && (
                <TouchableOpacity 
                  onPress={finishOnboarding} 
                  className="bg-[#589158] w-[260px] py-5 rounded-full items-center shadow-lg"
                >
                  <Text className="text-white font-bold text-xl">Begin Journey</Text>
                </TouchableOpacity>
              )}
            </View>
          </SafeAreaView>
        </View>
      </View>
    );
  };

  return (
    <Animated.View style={{ flex: 1, backgroundColor: 'black', opacity: fadeAnim }}>
      <StatusBar style="light" />
      
      {showWelcome ? (
        <View className="flex-1">
          <VideoSlide videoSource={WELCOME_VIDEO} isActive={true} />
          <View className="flex-1 bg-black/20 justify-end items-center pb-24">
            <SafeAreaView className="items-center w-full px-6">
              <Image source={require('../assets/images/Logo.png')} className="w-64 h-64 mb-10" resizeMode="contain" />
              <Text className="text-4xl font-bold text-white text-center">Welcome to Nidush</Text>
              <Text className="text-xl text-white mt-4 text-center">Your safe space starts here.</Text>
              <TouchableOpacity 
                className="bg-[#589158] w-[240px] py-4 rounded-full mt-20 shadow-md items-center" 
                onPress={handleDiscover}
              >
                <Text className="text-white text-xl font-bold">Discover</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </View>
        </View>
      ) : (
        <View className="flex-1">
          <FlatList
            ref={scrollRef}
            data={SLIDES}
            renderItem={renderItem}
            horizontal
            pagingEnabled
            scrollEnabled={false}
            getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
            keyExtractor={(item) => item.id}
          />
          
          <View className="flex-row absolute bottom-[8%] w-full px-6 z-50">
            {SLIDES.map((_, index) => (
              <AnimatedIndicator 
                key={index} 
                index={index} 
                currentIndex={currentIndex} 
                duration={SLIDE_DURATION} 
                isPlaying={!showWelcome} 
              />
            ))}
          </View>
        </View>
      )}
    </Animated.View>
  );
}