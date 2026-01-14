import React, { useEffect, useRef, useState, useMemo } from 'react';
import { View, Text, Dimensions, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BreathingLoader from '@/components/loading/BreathingLoader';
import TipDisplay from '@/components/loading/TipDisplay';
import { TIPS } from '@/constants/loadingData';

interface FinalLoadingProps {
  onComplete: () => void;
}

export default function FinalLoading({ onComplete }: FinalLoadingProps) {
  const [dims, setDims] = useState(Dimensions.get('window'));
  const [message, setMessage] = useState('Initializing your sanctuary...');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub.remove();
  }, []);

  const isWebPC = dims.width > 768;

  const randomTip = useMemo(() => {
    return TIPS[Math.floor(Math.random() * TIPS.length)];
  }, []);

  useEffect(() => {
    const t1 = setTimeout(() => setMessage('Syncing with your lifestyle...'), 1800);
    const t2 = setTimeout(() => setMessage('Personalizing your safe space...'), 3600);
    const t3 = setTimeout(() => setMessage('Tailoring activities for your balance...'), 5500);
    const t4 = setTimeout(() => setMessage('Platform almost ready...'), 7000);

    const finalTimer = setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }).start(() => onComplete());
    }, 8500);

    return () => {
      [t1, t2, t3, t4, finalTimer].forEach(clearTimeout);
    };
  }, [onComplete, fadeAnim]);

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }} className="bg-[#F3F5EE]">
      <SafeAreaView className="flex-1 items-center justify-between py-12 px-8">
        
        <View 
          style={{ maxWidth: 600, width: '100%', alignItems: 'center' }} 
          className="flex-1 justify-between"
        >
          
          <View className={isWebPC ? 'mt-16' : 'mt-8'}>
            <Text
              className="text-[#3E545C] text-center leading-tight"
              style={{ 
                fontFamily: 'Nunito_700Bold',
                fontSize: isWebPC ? 32 : 24,
              }}
            >
              {message}
            </Text>
          </View>

          <View className="flex-1 justify-center items-center">
            <View style={{ transform: [{ scale: isWebPC ? 1.5 : 1 }] }}>
              <BreathingLoader />
            </View>
          </View>

          <View className="w-full items-center">
            <View className="w-full bg-white/50 p-6 rounded-[30px] border border-white">
               <TipDisplay tip={randomTip} />
            </View>
            
            <View className="h-6" />
          </View>
          
        </View>
      </SafeAreaView>
    </Animated.View>
  );
}