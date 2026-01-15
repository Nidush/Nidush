import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import React from 'react';
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

interface FabMenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const FabMenu = ({ isOpen, setIsOpen }: FabMenuProps) => {
  return (
    <>
      {isOpen && (
        <Animated.View
          className="absolute inset-0 z-[5]"
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
        >
          <BlurView
            intensity={Platform.OS === 'android' ? 10 : 10}
            tint="light"
            experimentalBlurMethod="dimezisBlurView"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(240, 242, 235, 0.1)' },
            ]}
          >
            <Pressable className="flex-1" onPress={() => setIsOpen(false)} />
          </BlurView>
        </Animated.View>
      )}

      {isOpen && (
        <View className="absolute bottom-[110px] right-[25px] items-end z-[11]">
          <TouchableOpacity
            className="mb-4"
            onPress={() => {
              setIsOpen(false);
              router.push('/new-scenario');
            }}
          >
            <Text
              className="bg-[#548F53] px-10 py-4 rounded-full text-xl text-white shadow-md overflow-hidden"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
            >
              Scenario
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="mb-4"
            onPress={() => {
              setIsOpen(false);
              router.push('/new-activity');
            }}
          >
            <Text
              className="bg-[#548F53] px-10 py-4 rounded-full text-xl text-white shadow-md overflow-hidden"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
            >
              Activity
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity
        activeOpacity={0.9}
        className="absolute bottom-8 right-6 bg-[#548F53] w-[65px] h-[65px] rounded-full justify-center items-center z-[10] shadow-lg shadow-black/40"
        onPress={() => setIsOpen(!isOpen)}
      >
        <Ionicons name={isOpen ? 'close' : 'add'} size={36} color="white" />
      </TouchableOpacity>
    </>
  );
};
