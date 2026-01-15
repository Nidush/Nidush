import { MaterialIcons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, Platform, StyleSheet, Text, View } from 'react-native';

import { UserState } from '@/constants/data/types';
import { useBiometrics } from '@/context/BiometricsContext';

const STATE_STYLES: Record<
  UserState,
  {
    color: string;
    icon: keyof typeof MaterialIcons.glyphMap;
    label: string;
    phrase: string;
    bgImage: any;
  }
> = {
  RELAXED: {
    color: '#548F53',
    icon: 'spa',
    label: 'Relaxed',
    phrase: 'Enjoy these precious moments!',
    bgImage: require('@/assets/widget/relaxed.png'),
  },
  FOCUSED: {
    color: '#354F52',
    icon: 'visibility',
    label: 'Focused',
    phrase: "You're in the zone! Keep it up.",
    bgImage: require('@/assets/widget/focused.png'),
  },
  STRESSED: {
    color: '#D97706',
    icon: 'warning',
    label: 'Stressed',
    phrase: 'Take a deep breath and pause.',
    bgImage: require('@/assets/widget/stressed.png'),
  },
  ANXIOUS: {
    color: '#DB2777',
    icon: 'health-and-safety',
    label: 'Anxiety',
    phrase: "We're here to help you calm down.",
    bgImage: require('@/assets/widget/anxiety.png'),
  },
};

export const StateWidget = () => {
  const { currentState } = useBiometrics();

  const activeStyle = STATE_STYLES[currentState];

  return (
    <View className="w-full mb-6 relative overflow-hidden rounded-3xl shadow-xl h-44">
      <View style={[StyleSheet.absoluteFill]}>
        <Image
          source={activeStyle.bgImage}
          style={[StyleSheet.absoluteFill, { opacity: 0.7 }]}
          resizeMode="contain"
          blurRadius={Platform.OS === 'ios' ? 70 : 50}
        />
      </View>

      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <LinearGradient
            colors={['black', 'black', 'transparent']}
            locations={[0, 0.1, 0.7]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        }
      >
        <Image
          source={activeStyle.bgImage}
          style={StyleSheet.absoluteFill}
          resizeMode="contain"
        />
      </MaskedView>

      <LinearGradient
        colors={[activeStyle.color, 'transparent', 'rgba(0,0,0,0.8)']}
        locations={[0.2, 0.7, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[StyleSheet.absoluteFill, { opacity: 0.85 }]}
        pointerEvents="none"
      />

      <View className="flex-1 justify-center p-6 z-10">
        <View className="flex-row items-center mb-3">
          <View className="bg-white/20 p-1 rounded-full mr-2 animate-pulse">
            <MaterialIcons name="circle" size={8} color="#4ADE80" />
          </View>
          <Text
            style={{ fontFamily: 'Nunito_600SemiBold' }}
            className="text-white opacity-90 text-lg tracking-widest"
          >
            {"You're currently feeling"}
          </Text>
        </View>

        <View className="flex-row items-center">
          <View>
            <Text
              style={{ fontFamily: 'Nunito_700Bold' }}
              className="text-white text-4xl shadow-sm leading-9"
            >
              {activeStyle.label}
            </Text>

            <Text
              style={{ fontFamily: 'Nunito_600SemiBold' }}
              className="text-white text-md mt-3"
            >
              {activeStyle.phrase}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};
