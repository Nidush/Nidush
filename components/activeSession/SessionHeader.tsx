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
        // Adicionámos flex-1 (para limitar o tamanho), text-center (para centrar) e mx-4 (para dar margem)
        className="flex-1 text-center mx-4 text-[#354F52] text-2xl"
        style={{ fontFamily: 'Nunito_600SemiBold' }}
        numberOfLines={1} // As reticências (...) vão aparecer automaticamente se o título passar do espaço do flex-1
        accessibilityRole="header"
        maxFontSizeMultiplier={1.2}
      >
        {title}
      </Text>

      <TouchableOpacity
        onPress={onCancel}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel="Cancel"
        accessibilityHint="Ends the current session"
      >
        <Text
          maxFontSizeMultiplier={1.2}
          className="text-[#7DA87B] text-lg"
          style={{ fontFamily: 'Nunito_700Bold' }}
        >
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  );
};
