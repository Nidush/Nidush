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
  onAiActivityPress?: () => void;
}

export const FabMenu = ({ isOpen, setIsOpen, onAiActivityPress }: FabMenuProps) => {
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
            <Pressable
              className="flex-1"
              onPress={() => setIsOpen(false)}
              accessibilityRole="button"
              accessibilityLabel="Close background overlay"
              accessibilityHint="Double tap anywhere to close the menu"
            />
          </BlurView>
        </Animated.View>
      )}

      {isOpen && (
        <View
          className="absolute bottom-[110px] right-[25px] items-end z-[11]"
          accessibilityViewIsModal={true}
        >
          {onAiActivityPress && (
            <TouchableOpacity
              className="mb-4"
              onPress={() => {
                setIsOpen(false);
                onAiActivityPress();
              }}
              accessibilityRole="button"
              accessibilityLabel="Create activity with AI"
            >
              <Text
                maxFontSizeMultiplier={1.2}
                className="bg-[#3E545C] px-10 py-4 rounded-full text-xl text-white shadow-md overflow-hidden"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                AI idea
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="mb-4"
            onPress={() => {
              setIsOpen(false);
              router.push('/new-scenario');
            }}
            accessibilityRole="button"
            accessibilityLabel="Create new scenario"
          >
            <Text
              maxFontSizeMultiplier={1.2}
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
            accessibilityRole="button"
            accessibilityLabel="Create new activity"
          >
            <Text
              maxFontSizeMultiplier={1.2}
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
        accessibilityRole="button"
        accessibilityLabel={isOpen ? 'Close menu' : 'Open menu'}
        accessibilityHint={
          isOpen
            ? 'Closes the menu'
            : 'Opens the menu to create a new activity or scenario'
        }
      >
        <Ionicons
          name={isOpen ? 'close' : 'add'}
          size={36}
          color="white"
          importantForAccessibility="no" // Android
          accessibilityElementsHidden={true}
        />
      </TouchableOpacity>
    </>
  );
};
