import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface FocusSectionProps {
  enabled: boolean;
  onToggle: (val: boolean) => void;
}

export const FocusSection = ({ enabled, onToggle }: FocusSectionProps) => {
  return (
    <View className="mb-8">
      <Text
        className="text-[#354F52] text-xl mb-3"
        style={{ fontFamily: 'Nunito_700Bold' }}
      >
        Focus Mode
      </Text>
      <View className="flex-row items-center justify-between bg-[#F0F2EB] border border-[#548f537f] p-4 rounded-2xl">
        <View className="flex-1 pr-4">
          <Text
            className="text-[#354F52] text-lg"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            Do Not Disturb
          </Text>
          <Text
            className="text-[#6A7D5B] text-xs mt-1"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          >
            {enabled ? 'Notifications silenced' : 'Notifications enabled'}
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => onToggle(!enabled)}
          className={`w-14 h-7 rounded-full px-1 justify-center ${enabled ? 'bg-[#548F53]' : 'bg-gray-400/60'}`}
        >
          <View
            className={`w-5 h-5 bg-white rounded-full shadow-sm ${enabled ? 'self-end' : 'self-start'}`}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};
