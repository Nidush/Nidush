import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface SessionHeaderProps {
  title: string;
  onBack: () => void;
  onCancel: () => void;
}

export const SessionHeader = ({
  title,
  onBack,
  onCancel,
}: SessionHeaderProps) => {
  return (
    <View className="flex-row justify-between items-center px-6 py-2">
      <TouchableOpacity
        onPress={onBack}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Go back"
      >
        <Ionicons
          name="chevron-back"
          size={30}
          color="#354F52"
          importantForAccessibility="no"
        />
      </TouchableOpacity>
      <Text
        className="text-[#354F52] text-2xl"
        style={{ fontFamily: 'Nunito_600SemiBold' }}
        numberOfLines={1} // Garante que não empurra os botões se crescer
        accessibilityRole="header"
        maxFontSizeMultiplier={1.5}
      >
        {title}
      </Text>
      <TouchableOpacity onPress={onCancel}>
        <Text
          className="text-[#7DA87B] text-lg"
          style={{ fontFamily: 'Nunito_700Bold' }}
          accessible={true}
          accessibilityRole="button"
          accessibilityHint="Ends the current session"
        >
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  );
};
