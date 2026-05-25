import React from 'react';
import { Text, View } from 'react-native';

type StepWrapperProps = {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
};

export const StepWrapper = ({ title, subtitle, children }: StepWrapperProps) => (
  <View className="mt-2.5">
    <Text
      maxFontSizeMultiplier={1.2}
      accessibilityRole="header"
      className="text-[26px] text-[#2F4F4F] mb-2"
      style={{ fontFamily: 'Nunito_700Bold' }}
    >
      {title}
    </Text>

    {subtitle && (
      <Text
        maxFontSizeMultiplier={1.2}
        className="text-[15px] text-[#2F4F4F] mb-6"
        style={{ fontFamily: 'Nunito_600SemiBold' }}
      >
        {subtitle}
      </Text>
    )}
    <View>{children}</View>
  </View>
);
