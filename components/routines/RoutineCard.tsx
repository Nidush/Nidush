import { Feather, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { ImageBackground, Text, TouchableOpacity, View } from 'react-native';

interface RoutineCardProps {
  title: string;
  days: string;
  time: string;
  room: string;
  isActive: boolean;
  image: any; // Adicionamos a prop da imagem
  onToggle: () => void;
}

const RoutineCard = ({
  title,
  days,
  time,
  room,
  isActive,
  image,
  onToggle,
}: RoutineCardProps) => {
  return (
    <View className="mb-5 overflow-hidden rounded-[25px] bg-white shadow-sm border border-gray-100">
      {/* Usamos a prop 'image' aqui em vez do caminho fixo */}
      <ImageBackground
        source={image}
        className="min-h-[150px] flex-row items-center px-5 py-4"
        resizeMode="cover"
      >
        <View className="absolute inset-0 bg-black/40" />

        <View className="flex-1 pr-4">
          <Text
            className="text-white text-[22px] mb-3"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            {title}
          </Text>

          <View className="gap-y-1">
            <View className="flex-row items-center">
              <Feather name="calendar" size={14} color="white" />
              <Text
                className="text-white/90 ml-2 text-[13px]"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                {days}
              </Text>
            </View>
            <View className="flex-row items-center">
              <Feather name="clock" size={14} color="white" />
              <Text
                className="text-white/90 ml-2 text-[13px]"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                {time}
              </Text>
            </View>
            <View className="flex-row items-center">
              <MaterialIcons name="door-front" size={14} color="white" />
              <Text
                className="text-white/90 ml-2 text-[13px]"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                {room}
              </Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onToggle}
          className={`w-14 h-7 rounded-full px-1 justify-center ${isActive ? 'bg-[#5B8C51]' : 'bg-gray-400/60'}`}
        >
          <View
            className={`w-5 h-5 bg-white rounded-full shadow-sm ${isActive ? 'self-end' : 'self-start'}`}
          />
        </TouchableOpacity>
      </ImageBackground>
    </View>
  );
};

export default RoutineCard;
