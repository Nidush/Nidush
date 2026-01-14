import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';

interface HeaderSectionProps {
  viewMode: 'activities' | 'scenarios';
  setViewMode: (mode: 'activities' | 'scenarios') => void;
  searchQuery: string;
  setSearchQuery: (text: string) => void;
}

export const HeaderSection = ({
  viewMode,
  setViewMode,
  searchQuery,
  setSearchQuery,
}: HeaderSectionProps) => {
  return (
    <View className="px-4">
      {/* TOGGLE BUTTONS */}
      <View className="flex-row bg-[#F0F2EB] p-1 border border-[#BDC7C2] rounded-full mb-[15px] h-[50px] mt-4">
        {/* BOTÃO ACTIVITIES */}
        <TouchableOpacity
          onPress={() => setViewMode('activities')}
          className={`flex-1 justify-center items-center rounded-[25px] ${
            viewMode === 'activities' ? 'bg-[#548F53]' : ''
          }`}
        >
          <Text
            className={`${
              viewMode === 'activities' ? 'text-white' : 'text-[#2D3E27]'
            } text-xl`}
            // AQUI ESTÁ A ALTERAÇÃO:
            // Se estiver selecionado usa Bold, se não usa SemiBold
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

        {/* BOTÃO SCENARIOS */}
        <TouchableOpacity
          onPress={() => setViewMode('scenarios')}
          className={`flex-1 justify-center items-center rounded-[25px] ${
            viewMode === 'scenarios' ? 'bg-[#548F53]' : ''
          }`}
        >
          <Text
            className={`${
              viewMode === 'scenarios' ? 'text-white' : 'text-[#2D3E27]'
            } text-xl`}
            // AQUI ESTÁ A ALTERAÇÃO:
            // Se estiver selecionado usa Bold, se não usa SemiBold
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

      {/* SEARCH BAR */}
      <View className="flex-row items-center justify-center border border-[#BDC7C2] rounded-full px-4 h-12 bg-transparent mb-6">
        <MaterialIcons
          name="search"
          size={24}
          color="#7A8C85"
          style={{ marginRight: 10 }}
        />
        <TextInput
          placeholder={
            viewMode === 'activities'
              ? 'Search activities...'
              : 'Search scenarios...'
          }
          placeholderTextColor="#7A8C85"
          className="flex-1 h-full text-base text-[#2C3A35]"
          style={{ fontFamily: 'Nunito_600SemiBold', paddingVertical: 0 }}
          textAlignVertical="center"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>
    </View>
  );
};
