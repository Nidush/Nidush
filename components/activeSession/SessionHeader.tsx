import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import TextTicker from 'react-native-text-ticker';

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

      <View className="flex-1 mx-4 overflow-hidden">
        <TextTicker
          style={{
            fontFamily: 'Nunito_600SemiBold',
            fontSize: 20,
            color: '#354F52',
            textAlign: 'center',
          }}
          duration={6000}
          loop
          bounce={false}
          repeatSpacer={50}
          marqueeDelay={1500}
          maxFontSizeMultiplier={1.2}
          accessibilityRole="header"
        >
          {title}
        </TextTicker>
      </View>

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
