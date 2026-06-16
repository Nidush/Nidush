import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

type SearchAutocompleteProps = {
  suggestions: string[];
  query: string;
  onSelect: (value: string) => void;
};

export const SearchAutocomplete = ({
  suggestions,
  query,
  onSelect,
}: SearchAutocompleteProps) => {
  const firstSuggestion = suggestions[0]?.trim();
  const trimmedQuery = query.trim();

  if (!firstSuggestion || trimmedQuery.length < 2) return null;
  if (!firstSuggestion.toLowerCase().startsWith(trimmedQuery.toLowerCase())) return null;

  const remainder = firstSuggestion.slice(trimmedQuery.length);
  if (!remainder) return null;

  return (
    <TouchableOpacity
      onPress={() => onSelect(firstSuggestion)}
      accessibilityRole="button"
      accessibilityLabel={`Use suggestion ${firstSuggestion}`}
      hitSlop={8}
    >
      <View className="ml-2 mr-1">
        <Text
          className="text-sm text-[#A7B3AD]"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
          numberOfLines={1}
        >
          {remainder}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
