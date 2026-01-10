import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const tips = [
  'Deep breathing activates the parasympathetic nervous system, calming your body instantly.',
  'Meditation reduces stress and anxiety levels significantly with regular practice.',
  'Regular mindfulness improves focus, concentration, and cognitive flexibility.',
  'Hydration is key for optimal brain function; drink water before you start.',
  'Short breaks can boost productivity and prevent mental fatigue.',
  'Listening to nature sounds can help lower blood pressure and muscle tension.',
  'Gratitude journaling before bed is proven to improve sleep quality.',
  'Reducing blue light exposure one hour before sleep helps you rest better.',
  'Gentle stretching releases physical tension and prepares the mind for stillness.',
  'Consistent sleep schedules aid mental clarity and emotional stability.',
  'Smiling, even intentionally, can trigger dopamine and lift your mood.',
  'A decluttered physical space often leads to a more decluttered mind.',
  'Writing down your worries before meditation helps clear your head.',
  'A short walk can boost creative thinking and problem-solving skills.',
  'Focusing on the present moment reduces regrets about the past and fears of the future.',
  'Aromatherapy with lavender or eucalyptus can promote deeper relaxation.',
  'Visualization techniques can prime your brain for success and confidence.',
  'Mindful eating improves digestion and your relationship with food.',
  'Disconnecting from screens for 30 minutes daily reduces mental overload.',
  'Practicing kindness towards others actually boosts your own happiness levels.',
];

const messages = [
  'Preparing your environment',
  'Preparing your activity',
  'Activating Focus Mode',
];

export default function LoadingActivity() {
  const { title } = useLocalSearchParams();
  const [messageIndex, setMessageIndex] = useState(0);
  const [randomTip] = useState(
    () => tips[Math.floor(Math.random() * tips.length)],
  );

  const breathAnim = useRef(new Animated.Value(0)).current;

  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rotateAnimReverse = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const textInterval = setInterval(() => {
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => {
        setMessageIndex((prev) => (prev + 1) % messages.length);
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      });
    }, 5000);
    return () => clearInterval(textInterval);
  }, [textOpacity]);

  useEffect(() => {
    const startBreathing = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(breathAnim, {
            toValue: 1,
            duration: 4000,
            useNativeDriver: true,
            easing: Easing.bezier(0.42, 0, 0.58, 1),
          }),
          Animated.timing(breathAnim, {
            toValue: 0,
            duration: 4000,
            useNativeDriver: true,
            easing: Easing.bezier(0.42, 0, 0.58, 1),
          }),
        ]),
      ).start();
    };

    const startRotation = () => {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 12000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();

      Animated.loop(
        Animated.timing(rotateAnimReverse, {
          toValue: 1,
          duration: 15000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ).start();
    };

    startBreathing();
    startRotation();

    const timer = setTimeout(() => {}, 16000);

    return () => clearTimeout(timer);
  }, [breathAnim, rotateAnim, rotateAnimReverse]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const spinReverse = rotateAnimReverse.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });

  const coreScale = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.9, 1.0],
  });

  const midScale = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.25],
  });

  const outerScale = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 1.3],
  });
  const breathingOpacity = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.15, 0.1],
  });

  return (
    <SafeAreaView className="flex-1 bg-[#F0F2EB] px-6 items-center justify-between py-10">
      <Text
        className="text-[#354F52] text-xl text-center"
        style={{ fontFamily: 'Nunito_600SemiBold' }}
      >
        Initializing “{title || 'Gratitude Flow'}”...
      </Text>

      <View className="items-center justify-center w-full h-[450px] relative">
        <Animated.View
          style={{
            transform: [{ rotate: spinReverse }, { scale: outerScale }],
            position: 'absolute',
            width: 320,
            height: 310,
            backgroundColor: '#4ADE80',
            opacity: breathingOpacity,
            borderRadius: 160,
            borderTopLeftRadius: 140,
            borderTopRightRadius: 200,
            borderBottomLeftRadius: 200,
            borderBottomRightRadius: 150,
          }}
        />

        <Animated.View
          style={{
            transform: [{ rotate: spin }, { scale: midScale }],
            position: 'absolute',
            width: 260,
            height: 260,
            backgroundColor: '#4ADE80',
            opacity: 0.2,
            borderRadius: 130,
            borderTopLeftRadius: 150,
            borderTopRightRadius: 110,
            borderBottomLeftRadius: 120,
            borderBottomRightRadius: 160,
          }}
        />

        <Animated.View
          style={{
            transform: [{ scale: coreScale }],
            width: 230,
            height: 230,
            borderRadius: 115,
            zIndex: 10,
            shadowColor: '#000000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 10,
            elevation: 3,
          }}
        >
          <LinearGradient
            colors={['#7ECA7C', '#548F53']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              flex: 1,
              width: '100%',
              height: '100%',
              borderRadius: 115,
              alignItems: 'center',
              justifyContent: 'center',
              padding: 24,
            }}
          >
            <Animated.Text
              className="text-white text-center text-2xl font-semibold leading-7"
              style={{ fontFamily: 'Nunito_600SemiBold', opacity: textOpacity }}
            >
              {messages[messageIndex]}
            </Animated.Text>
          </LinearGradient>
        </Animated.View>
      </View>

      <View className="items-center px-4 mb-4">
        <Text
          className="text-[#354F52] text-3xl mb-4"
          style={{ fontFamily: 'Nunito_700Bold' }}
        >
          Did you know?
        </Text>
        <Text
          className="text-[#354F52] text-center text-lg leading-6"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
        >
          {randomTip}
        </Text>
      </View>

      <TouchableOpacity
        onPress={() => router.back()}
        activeOpacity={0.8}
        className="bg-[#548F53] w-52 py-4 rounded-full shadow-lg"
      >
        <Text
          className="text-white text-center text-xl"
          style={{ fontFamily: 'Nunito_700Bold' }}
        >
          Cancel
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
