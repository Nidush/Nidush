import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useMemo } from 'react';
import { Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BreathingLoader from '../components/loading/BreathingLoader';
import TipDisplay from '../components/loading/TipDisplay';
import { TIPS } from '../constants/loadingData';

const LoadingActivity = () => {
  const { title } = useLocalSearchParams();
  const randomTip = useMemo(() => {
    return TIPS[Math.floor(Math.random() * TIPS.length)];
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/ActiveSession');
    }, 15000);

    return () => clearTimeout(timer);
  }, [id]);

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F0F2EB] px-6 items-center justify-between py-10">
      <Text
        className="text-[#354F52] text-xl text-center"
        style={{ fontFamily: 'Nunito_600SemiBold' }}
      >
        Initializing “{title || 'Gratitude Flow'}”...
      </Text>
      <BreathingLoader />
      <TipDisplay tip={randomTip} />
      <TouchableOpacity
        onPress={handleCancel}
        activeOpacity={0.8}
        className="bg-[#548F53] w-52 py-4 rounded-full shadow-lg"
      >
        <Text
          className="text-white text-center text-2xl"
          style={{ fontFamily: 'Nunito_700Bold' }}
        >
          Cancel
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
};

export default LoadingActivity;
