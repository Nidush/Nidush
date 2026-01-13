import React from 'react';
import { Text, View } from 'react-native';

export const StepWrapper = ({ title, subtitle, children }: any) => (
  <View className="mt-2.5">
    <Text
      className="text-[26px] text-[#2F4F4F] mb-2"
      style={{ fontFamily: 'Nunito_700Bold' }}
    >
      {title}
    </Text>

    {subtitle && (
      <Text
        className="text-[15px] text-[#2F4F4F] mb-6"
        style={{ fontFamily: 'Nunito_600SemiBold' }}
      >
        {subtitle}
      </Text>
    )}

    {children}
  </View>
);
