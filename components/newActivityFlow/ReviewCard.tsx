import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';

interface ReviewCardProps {
  label: string;
  onEdit: () => void;
  children: React.ReactNode;
}

export const ReviewCard = ({ label, onEdit, children }: ReviewCardProps) => (
  <View className="mb-5">
    <View className="flex-row justify-between items-center">
      <Text
        className="text-xl text-[#2F4F4F]"
        style={{ fontFamily: 'Nunito_600SemiBold' }}
      >
        {label}
      </Text>
      <TouchableOpacity onPress={onEdit}>
        <Text
          className="text-[#548F53]"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
        >
          Edit
        </Text>
      </TouchableOpacity>
    </View>

    {/* Estilo fixo: Fundo e Borda sempre presentes */}
    <View className=" rounded-2xl p-4 mt-2 border border-[#DDE5D7]">
      {children}
    </View>
  </View>
);
