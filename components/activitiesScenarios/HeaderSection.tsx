import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SearchAutocomplete } from '@/components/UI/SearchAutocomplete';
import { MAX_SEARCH_LENGTH, normalizeSearchInput } from '@/utils/searchSecurity';

interface HeaderSectionProps {
  viewMode: 'activities' | 'scenarios';
  setViewMode: (mode: 'activities' | 'scenarios') => void;
  searchQuery: string;
  setSearchQuery: (text: string) => void;
  suggestions?: string[];
  onSelectSuggestion?: (text: string) => void;
}

export const HeaderSection = ({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
  suggestions = [],
  onSelectSuggestion,
}: HeaderSectionProps) => {
  return (
    <View className="px-4">
      <View
        className="flex-row bg-[#F0F2EB] p-1 border border-[#BDC7C2] rounded-full mb-[15px] h-[50px] mt-4"
        accessibilityRole="tablist"
      >
        <TouchableOpacity
          onPress={() => setViewMode('activities')}
          accessibilityRole="tab"
          accessibilityState={{ selected: viewMode === 'activities' }}
          className={`flex-1 justify-center items-center rounded-[25px] ${
            viewMode === 'activities' ? 'bg-[#548F53]' : ''
          }`}
        >
          <Text
            maxFontSizeMultiplier={1.2}
            className={`${
              viewMode === 'activities' ? 'text-white' : 'text-[#2D3E27]'
            } text-xl`}
            style={{
              fontFamily:
                viewMode === 'activities'
                  ? 'Nunito_700Bold'
                  : 'Nunito_600SemiBold',
            }}
          >
            Activities
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setViewMode('scenarios')}
          className={`flex-1 justify-center items-center rounded-[25px] ${
            viewMode === 'scenarios' ? 'bg-[#548F53]' : ''
          }`}
          accessibilityRole="tab"
          accessibilityState={{ selected: viewMode === 'scenarios' }}
        >
          <Text 
            maxFontSizeMultiplier={1.2}
            className={`${
              viewMode === 'scenarios' ? 'text-white' : 'text-[#2D3E27]'
            } text-xl`}
            style={{
              fontFamily:
                viewMode === 'scenarios'
                  ? 'Nunito_700Bold'
                  : 'Nunito_600SemiBold',
            }}
          >
            Scenarios
          </Text>
        </TouchableOpacity>
      </View>

      <View className="flex-row items-center justify-center border border-[#BDC7C2] rounded-full px-4 h-12 bg-transparent mb-6">
        <MaterialIcons
          name="search"
          size={24}
          color="#7A8C85"
          style={{ marginRight: 10 }}
          importantForAccessibility="no" // Android
          accessibilityElementsHidden={true} // iOS
        />
        <TextInput
          maxFontSizeMultiplier={1.2}
          placeholder={
            viewMode === 'activities'
              ? 'Search activities...'
              : 'Search scenarios...'
          }
          accessibilityLabel={
            viewMode === 'activities' ? 'Search activities' : 'Search scenarios'
          }
          placeholderTextColor="#7A8C85"
          className="flex-1 h-full text-base text-[#2C3A35]"
          style={{ fontFamily: 'Nunito_600SemiBold', paddingVertical: 0 }}
          textAlignVertical="center"
          value={searchQuery}
          onChangeText={(value) => setSearchQuery(normalizeSearchInput(value))}
          autoCorrect={false}
          autoCapitalize="none"
          maxLength={MAX_SEARCH_LENGTH}
        />
        {onSelectSuggestion ? (
          <SearchAutocomplete
            suggestions={suggestions}
            query={searchQuery}
            onSelect={onSelectSuggestion}
          />
        ) : null}
      </View>
    </View>
  );
};
