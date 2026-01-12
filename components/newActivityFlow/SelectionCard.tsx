import { MaterialIcons } from '@expo/vector-icons';
import React, { ComponentProps } from 'react';
import { Text, TouchableOpacity } from 'react-native';

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];

interface SelectionCardProps {
  label: string;
  icon: MaterialIconName;
  isSelected: boolean;
  onPress: () => void;
}

export const SelectionCard = ({
  label,
  icon,
  isSelected,
  onPress,
}: SelectionCardProps) => (
  <TouchableOpacity
    className={`w-[48%] h-[150px] bg-[#BBDABA] rounded-3xl justify-center items-center border-[3px] ${
      isSelected ? 'border-[#548F53]' : 'border-transparent'
    }`}
    onPress={onPress}
  >
    <MaterialIcons name={icon} size={50} color="#354F52" />
    <Text
      className="mt-2.5 text-lg text-[#2F4F4F]"
      style={{ fontFamily: 'Nunito_700Bold' }}
    >
      {label}
    </Text>
  </TouchableOpacity>
);
