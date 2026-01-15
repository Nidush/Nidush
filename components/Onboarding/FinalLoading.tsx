import React, { useEffect, useState, useMemo } from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BreathingLoader from '@/components/loading/BreathingLoader';
import TipDisplay from '@/components/loading/TipDisplay';
import { TIPS } from '@/constants/loadingData';

import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';

interface FinalLoadingProps {
  onComplete: () => void;
}

export default function FinalLoading({ onComplete }: FinalLoadingProps) {
  const [fontsLoaded] = useFonts({
    'Nunito_400Regular': Nunito_400Regular,
    'Nunito_600SemiBold': Nunito_600SemiBold,
    'Nunito_700Bold': Nunito_700Bold,
  });

  const [message, setMessage] = useState('Take a deep breath. We are preparing your safe space...');

  const randomTip = useMemo(() => {
    return TIPS[Math.floor(Math.random() * TIPS.length)];
  }, []);

  useEffect(() => {
    const timer1 = setTimeout(() => {
      setMessage('Crafting activities for you...');
    }, 2000);

    const timer2 = setTimeout(() => {
      onComplete();
    }, 4000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [onComplete]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView className="flex-1 bg-[#F0F2EB] px-8 items-center justify-between py-12">
      <View className="mt-4">
        <Text
          className="text-[#354F52] text-2xl text-center leading-tight"
          style={{ fontFamily: 'Nunito_700Bold' }} 
        >
          {message}
        </Text>
      </View>

      <View className="flex-1 justify-center items-center">
        <BreathingLoader />
      </View>

      <View className="w-full items-center mb-6">
        <TipDisplay tip={randomTip} />
        <View className="h-4" />
      </View>
    </SafeAreaView>
  );
}