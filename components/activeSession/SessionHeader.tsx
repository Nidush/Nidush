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
      <TouchableOpacity onPress={onBack}>
        <Ionicons name="chevron-back" size={30} color="#354F52" />
      </TouchableOpacity>
      <Text
        className="text-[#354F52] text-2xl"
        style={{ fontFamily: 'Nunito_600SemiBold' }}
      >
        {title}
      </Text>
      <TouchableOpacity onPress={onCancel}>
        <Text
          className="text-[#7DA87B] text-lg"
          style={{ fontFamily: 'Nunito_700Bold' }}
        >
          Cancel
        </Text>
      </TouchableOpacity>
    </View>
  );
};
