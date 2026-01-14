import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
  Animated,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useVideoPlayer, VideoView } from 'expo-video';

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

const VideoSlide = memo(({ videoSource, isActive, dims }: { videoSource: any; isActive: boolean; dims: any }) => {
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = true;
  });
  
  useEffect(() => {
    let isMounted = true;
    const handlePlay = async () => {
      try {
        if (isActive) {
          await new Promise(resolve => setTimeout(resolve, 100));
          if (isMounted) await player.play();
        } else {
          player.pause();
        }
      } catch (e) {
        console.error(e);
      }
    };
    handlePlay();
    return () => { isMounted = false; };
  }, [isActive, player]);

  return (
    <VideoView 
      player={player} 
      nativeControls={false} 
      contentFit="cover" 
      style={{ width: dims.width, height: dims.height, position: 'absolute' }} 
    />
  );
});
VideoSlide.displayName = 'VideoSlide';

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

export default function Onboarding() {
  const [dims, setDims] = useState(Dimensions.get('window'));
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<FlatList>(null);
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub.remove();
  }, []);

  const finishOnboarding = useCallback(async () => {
    Animated.timing(fadeAnim, { toValue: 0, duration: 800, useNativeDriver: true }).start(async () => {
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

  useEffect(() => {
    if (!showWelcome && currentIndex < SLIDES.length - 1) {
      const timer = setInterval(goToNext, SLIDE_DURATION);
      return () => clearInterval(timer);
    }
  }, [showWelcome, currentIndex, goToNext]);

  const renderItem = ({ item, index }: any) => (
    <View style={{ width: dims.width, height: dims.height }} className="bg-black relative overflow-hidden">
      {Math.abs(currentIndex - index) <= 1 && (
        <VideoSlide videoSource={item.video} isActive={currentIndex === index} dims={dims} />
      )}
      
      <View className="flex-1 bg-black/20">
        <TouchableOpacity className="absolute left-0 top-0 bottom-0 w-1/4 z-10" onPress={goToPrev} activeOpacity={1} />
        <TouchableOpacity className="absolute right-0 top-0 bottom-0 w-3/4 z-10" onPress={goToNext} activeOpacity={1} />
        
        <SafeAreaView className="flex-1 z-20" edges={['top', 'bottom']} pointerEvents="box-none">
          <View className="flex-1 w-full max-w-[1200px] mx-auto px-8 md:px-12" pointerEvents="box-none">
            
            <View className="flex-row justify-between items-center mt-6 md:mt-10 h-12" pointerEvents="box-none">
              <Image 
                source={require('../assets/images/Logo.png')} 
                style={{ width: dims.width > 768 ? 60 : 48, height: dims.width > 768 ? 60 : 48, tintColor: '#FFFFFF' }} 
                resizeMode="contain" 
              />
              <TouchableOpacity onPress={finishOnboarding} className="p-2">
                <Text style={{ fontFamily: 'Nunito-Medium' }} className="text-white text-lg md:text-xl opacity-80">Skip</Text>
              </TouchableOpacity>
            </View>

            <View className="mt-auto mb-16 md:mb-24 self-start w-full max-w-[750px]" pointerEvents="none">
              <Text 
                style={{ fontFamily: 'Nunito-Bold' }} 
                className="text-white text-[34px] md:text-7xl font-bold leading-[42px] md:leading-[80px] mb-6"
              >
                {item.title}
              </Text>
              <Text 
                style={{ fontFamily: 'Nunito-Regular' }} 
                className="text-white text-[18px] md:text-2xl leading-7 md:leading-9 opacity-90 pr-10"
              >
                {item.description}
              </Text>
            </View>

            <View className={`${item.isLast ? 'h-32 md:h-48' : 'h-10'} justify-center items-center`} pointerEvents="box-none">
              {item.isLast && (
                <TouchableOpacity 
                  onPress={finishOnboarding} 
                  className="bg-[#589158] px-14 py-5 rounded-full items-center mb-12 shadow-lg active:scale-95"
                >
                  <Text style={{ fontFamily: 'Nunito-Bold' }} className="text-white font-bold text-xl md:text-2xl">Begin Journey</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </SafeAreaView>
      </View>
    );
  };

  return (
    <Animated.View style={{ flex: 1, backgroundColor: 'black', opacity: fadeAnim }}>
      <StatusBar style="light" />
      
      {showWelcome ? (
        <View style={{ width: dims.width, height: dims.height }}>
          <VideoSlide videoSource={WELCOME_VIDEO} isActive={true} dims={dims} />
          <View className="flex-1 bg-black/10 justify-end items-center pb-24">
            <SafeAreaView className="items-center w-full px-6 max-w-[1000px]">
              <Image 
                source={require('../assets/images/Logo.png')} 
                style={{ 
                  width: dims.width > 768 ? 280 : 220, 
                  height: dims.width > 768 ? 280 : 220, 
                  marginBottom: 30 
                }} 
                resizeMode="contain" 
              />
              <Text style={{ fontFamily: 'Nunito-Bold' }} className="text-5xl md:text-8xl font-bold text-white text-center">Welcome to Nidush</Text>
              <Text style={{ fontFamily: 'Nunito-Regular' }} className="text-xl md:text-3xl text-white mt-4 text-center opacity-80">Your safe space starts here.</Text>
              <TouchableOpacity 
                className="bg-[#589158] px-16 py-5 rounded-full mt-16 shadow-md items-center active:scale-95" 
                onPress={handleDiscover}
              >
                <Text style={{ fontFamily: 'Nunito-Bold' }} className="text-white text-xl md:text-2xl font-bold">Discover</Text>
              </TouchableOpacity>
            </SafeAreaView>
          </View>
        </View>
      ) : (
        <View className="flex-1">
          <FlatList
            key={`list-${dims.width}`} 
            ref={scrollRef}
            data={SLIDES}
            renderItem={renderItem}
            horizontal
            pagingEnabled
            scrollEnabled={Platform.OS !== 'web'}
            showsHorizontalScrollIndicator={false}
            getItemLayout={(_, index) => ({ length: dims.width, offset: dims.width * index, index })}
          />
          <View className="absolute bottom-[8%] md:bottom-[6%] w-full z-50 pointer-events-none">
            <View className="flex-row w-full max-w-[1200px] mx-auto px-10 md:px-12">
              {SLIDES.map((_, index) => (
                <AnimatedIndicator 
                  key={index} 
                  index={index} 
                  currentIndex={currentIndex} 
                  duration={SLIDE_DURATION} 
                  isPlaying={true} 
                />
              ))}
            </View>
          </View>
        </View>
      )}
    </Animated.View>
  );
}