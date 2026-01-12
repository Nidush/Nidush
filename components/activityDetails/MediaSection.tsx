import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

interface MediaSectionProps {
  title: string | undefined;
  subtitle: string;
  isVisible: boolean;
}

export const MediaSection = ({
  title,
  subtitle,
  isVisible,
}: MediaSectionProps) => {
  if (!isVisible) return null;

  return (
    <View className="mb-8">
      <Text
        className="text-[#354F52] text-xl mb-3"
        style={{ fontFamily: 'Nunito_700Bold' }}
      >
        Selected Playlist
      </Text>
      <View className="flex-row items-center justify-between bg-[#F0F2EB] border border-[#548f537f] p-4 rounded-2xl">
        <View className="flex-1 pr-2">
          <Text
            className="text-[#354F52] text-lg"
            numberOfLines={1}
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            {title || 'Relaxing Sounds'}
          </Text>
          <Text
            className="text-[#548F53] text-xs mt-1"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          >
            {subtitle}
          </Text>
        </View>
        <View className="bg-[#548F53] p-5 rounded-xl">
          <Ionicons name="musical-notes" size={24} color="white" />
        </View>
      </View>
    </View>
  );
};
