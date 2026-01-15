import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

export const FlowHeader = ({ title, step, totalSteps, onBack }: any) => (
  <View>
    <View className="flex-row justify-between items-center h-[60px] mt-2">
      <TouchableOpacity onPress={onBack}>
        <Ionicons name="chevron-back" size={28} color="#2F4F4F" />
      </TouchableOpacity>

      {/* Título com Text nativo */}
      <Text
        className="text-2xl text-[#354F52]"
        style={{ fontFamily: 'Nunito_700Bold' }}
      >
        {title}
      </Text>

      <TouchableOpacity onPress={() => router.back()}>
        {/* Botão Cancel com Text nativo */}
        <Text
          className="text-[#548F53] text-lg"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
        >
          Cancel
        </Text>
      </TouchableOpacity>
    </View>

    <View className="flex-row gap-1.5 my-4">
      {[...Array(totalSteps)].map((_, i) => (
        <View
          key={i}
          className={`flex-1 h-1.5 rounded-full ${i + 1 <= step ? 'bg-[#519A4E]' : 'bg-[#DDE5D7]'}`}
        />
      ))}
    </View>
  </View>
);
