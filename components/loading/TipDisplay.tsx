import React from 'react';
import { Text, View } from 'react-native';

interface TipDisplayProps {
  tip: string;
}

const TipDisplay = ({ tip }: TipDisplayProps) => {
  return (
    <View className="items-center px-4 mb-4">
      <Text
        className="text-[#354F52] text-3xl mb-4"
        style={{ fontFamily: 'Nunito_700Bold' }}
      >
        Did you know?
      </Text>
      <Text
        className="text-[#354F52] text-center text-lg leading-6"
        style={{ fontFamily: 'Nunito_600SemiBold' }}
      >
        {tip}
      </Text>
    </View>
  );
};

export default TipDisplay;
