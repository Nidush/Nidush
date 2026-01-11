import React, { useState, useRef, useEffect, memo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Dimensions,
  Image,
  Animated,
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

const VideoSlide = memo(({ videoSource, isActive }: { videoSource: any, isActive: boolean }) => {
  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = true;
    if (isActive) p.play();
  });

  useEffect(() => {
    isActive ? player.play() : player.pause();
  }, [isActive, player]);

  return (
    <VideoView
      player={player}
      nativeControls={false}
      contentFit="cover"
      style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }}
    />
  );
});

const AnimatedIndicator = ({ index, currentIndex, duration, isPlaying }: any) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (index === currentIndex && isPlaying) {
      widthAnim.setValue(0);
      Animated.timing(widthAnim, { toValue: 100, duration, useNativeDriver: false }).start();
    } else {
      widthAnim.setValue(index < currentIndex ? 100 : 0);
    }
  }, [currentIndex, isPlaying]);

  const interpolation = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View className="h-[5px] flex-1 mx-1 rounded-full bg-white/30 overflow-hidden">
      <Animated.View className="h-full bg-[#78B478]" style={{ width: interpolation }} />
    </View>
  );
};

export default function Onboarding() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<FlatList>(null);
  const router = useRouter();

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@viewedOnboarding', 'true');
      router.replace('/signup');
    } catch (e) {
      router.replace('/signup');
    }
  };

  useEffect(() => {
    if (!showWelcome) {
      const timer = setInterval(() => {
        currentIndex < SLIDES.length - 1 ? goToNext() : finishOnboarding();
      }, SLIDE_DURATION);
      return () => clearInterval(timer);
    }
  }, [currentIndex, showWelcome]);

  const goToNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      scrollRef.current?.scrollToIndex({ index: prevIndex, animated: true });
      setCurrentIndex(prevIndex);
    }
  };

  if (showWelcome) {
    return (
      <View className="flex-1">
        <StatusBar style="light" />
        <VideoSlide videoSource={WELCOME_VIDEO} isActive={true} />
        <View className="flex-1 bg-black/10 justify-end items-center pb-20">
          <SafeAreaView className="items-center w-full px-6">
            <Image source={require('../assets/images/Logo.png')} className="w-64 h-64 mb-10" resizeMode="contain" />
            <Text className="text-4xl font-bold text-white text-center">Welcome to Nidush</Text>
            <Text className="text-xl text-white mt-4 text-center">Your safe space starts here.</Text>
            <TouchableOpacity className="bg-[#589158] px-20 py-4 rounded-full mt-20" onPress={() => setShowWelcome(false)}>
              <Text className="text-white text-xl font-bold">Discover</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>
      </View>
    );
  }

  const renderItem = ({ item, index }: any) => (
    <View style={{ width, height }} className="bg-black">
      {Math.abs(currentIndex - index) <= 1 ? (
        <VideoSlide videoSource={item.video} isActive={currentIndex === index} />
      ) : (
        <View className="flex-1 bg-black" />
      )}
      
      <View className="flex-1 bg-black/20">
        {/* ADICIONADO testID AQUI */}
        <TouchableOpacity 
          testID="left-tap-area"
          className="absolute left-0 top-0 bottom-0 w-1/4 z-10" 
          onPress={goToPrev} 
          activeOpacity={1} 
        />
        {/* ADICIONADO testID AQUI */}
        <TouchableOpacity 
          testID="right-tap-area"
          className="absolute right-0 top-0 bottom-0 w-3/4 z-10" 
          onPress={goToNext} 
          activeOpacity={1} 
        />

        <SafeAreaView className="flex-1 justify-between px-6 z-20" edges={['top', 'bottom']} pointerEvents="box-none">
          <View className="flex-row justify-between items-center mt-2 h-12" pointerEvents="box-none">
            <Image source={require('../assets/images/Logo.png')} className="w-12 h-12" style={{ tintColor: '#FFFFFF' }} resizeMode="contain" />
            <TouchableOpacity onPress={finishOnboarding} className="p-2">
              <Text className="text-white text-lg font-medium">Skip</Text>
            </TouchableOpacity>
          </View>

          <View className="mt-auto mb-10" pointerEvents="none">
            <Text className="text-white text-[42px] font-bold leading-[48px] mb-4">{item.title}</Text>
            <Text className="text-white text-[17px] leading-6 opacity-90 pr-10">{item.description}</Text>
          </View>

          <View className={`${item.isLast ? 'h-40' : 'h-10'} justify-center items-center`} pointerEvents="box-none">
            {item.isLast && (
              <TouchableOpacity onPress={finishOnboarding} className="bg-[#589158] w-full py-5 rounded-full items-center mb-10">
                <Text className="text-white font-bold text-xl">Begin Journey</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-black">
      <StatusBar style="light" />
      <FlatList
        ref={scrollRef}
        testID="onboarding-flatlist" 
        data={SLIDES}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />
      <View className="flex-row absolute bottom-[10%] w-full px-5 z-50">
        {SLIDES.map((_, index) => (
          <AnimatedIndicator key={index} index={index} currentIndex={currentIndex} duration={SLIDE_DURATION} isPlaying={!showWelcome} />
        ))}
      </View>
    </View>
  );
} 