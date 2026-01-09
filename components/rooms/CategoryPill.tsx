import React from 'react';
import { Text, TouchableOpacity } from 'react-native';

// Interface do objeto de dados
export interface Room {
  id: number;
  name: string;
}

// Props do componente
interface CategoryPillProps {
  item: Room;
  isActive: boolean;
  // Define que a função onPress recebe um ID numérico e não retorna nada
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
