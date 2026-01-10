import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

export interface Room {
  id: number;
  name: string;
}

interface CategoryPillProps {
  item: Room;
  isActive: boolean;
  onPress: (id: number) => void;
}

const CategoryPill = ({ item, isActive, onPress }: CategoryPillProps) => {
  return (
    <TouchableOpacity
      onPress={() => onPress(item.id)}
      className={`px-5 py-1 rounded-full border mr-3 justify-center ${
        isActive
          ? 'bg-[#BBE6BA] border-transparent'
          : 'bg-transparent border-[#BDC7C2]'
      }`}
    >
      <Text
        className={` ${isActive ? 'text-[#548F53]' : 'text-[#354F52]'}`}
        style={{
          fontFamily: isActive ? 'Nunito_700Bold' : 'Nunito_600SemiBold',
        }}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );
};

export default CategoryPill;
