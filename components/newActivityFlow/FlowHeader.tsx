import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type FlowHeaderProps = {
  title: string;
  step: number;
  totalSteps: number;
  onBack: () => void;
};

export const FlowHeader = ({ title, step, totalSteps, onBack }: FlowHeaderProps) => (
  <View>
    <View className="flex-row justify-between items-center h-[60px] mt-2">
      <TouchableOpacity
        onPress={onBack}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Go back to previous step"
      >
        <Ionicons
          name="chevron-back"
          size={28}
          color="#2F4F4F"
          importantForAccessibility="no"
        />
      </TouchableOpacity>

      <Text
        className="text-2xl text-[#354F52]"
        style={{ fontFamily: 'Nunito_700Bold' }}
        accessibilityRole="header"
        numberOfLines={1} // Protege o layout se o utilizador aumentar muito a letra
        maxFontSizeMultiplier={1.2}
      >
        {title}
      </Text>

      <TouchableOpacity
        onPress={() => router.back()}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Cancel"
        accessibilityHint="Discards activity creation and returns to previous screen"
      >
        <Text
          maxFontSizeMultiplier={1.2}
          className="text-[#548F53] text-lg"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
        >
          Cancel
        </Text>
      </TouchableOpacity>
    </View>

    <View
      className="flex-row gap-1.5 my-4"
      accessible={true}
      accessibilityRole="progressbar"
      accessibilityValue={{ min: 1, max: totalSteps, now: step }}
      accessibilityLabel={`Step ${step} of ${totalSteps}`}
    >
      {[...Array(totalSteps)].map((_, i) => (
        <View
          key={i}
          className={`flex-1 h-1.5 rounded-full ${i + 1 <= step ? 'bg-[#519A4E]' : 'bg-[#DDE5D7]'}`}
          importantForAccessibility="no"
          accessibilityElementsHidden={true}
        />
      ))}
    </View>
  </View>
);
