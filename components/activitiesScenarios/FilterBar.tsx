import React from 'react';
import { ScrollView, Text, TouchableOpacity } from 'react-native';

interface FilterBarProps {
  options: string[];
  activeFilter: string;
  onSelectFilter: (filter: string) => void;
}

export const FilterBar = ({
  options,
  activeFilter,
  onSelectFilter,
}: FilterBarProps) => {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-6"
      contentContainerStyle={{ paddingHorizontal: 16 }}
    >
      {options.map((filter) => {
        const isActive = activeFilter === filter;
        return (
          <TouchableOpacity
            key={filter}
            onPress={() => onSelectFilter(filter)}
            className={`px-5 py-1.5 rounded-full border mr-3 justify-center ${
              isActive
                ? 'bg-[#BBE6BA] border-transparent'
                : 'bg-transparent border-[#BDC7C2]'
            }`}
          >
            <Text
              className={`${isActive ? 'text-[#548F53]' : 'text-[#354F52]'}`}
              style={{
                fontFamily: isActive ? 'Nunito_700Bold' : 'Nunito_600SemiBold',
                fontSize: 14,
              }}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};
