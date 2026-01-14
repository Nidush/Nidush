import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RoutineCardProps {
  title: string;
  days: string;
  time: string;
  room: string;
  isActive: boolean;
  image: any;
  onToggle: () => void;
  testID?: string; // ADICIONADO PARA TESTES
}

const RoutineCard = ({ title, days, time, room, isActive, image, onToggle, testID }: RoutineCardProps) => {
  return (
    <View className="w-full mb-5 relative overflow-hidden rounded-[25px] bg-[#2C3A35]" style={{ height: 170 }}>
      
      {/* Imagem de fundo com desfoque */}
      <View style={[StyleSheet.absoluteFill, { transform: [{ scale: 1.5 }] }]}>
        <Image
          source={image}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          blurRadius={90} 
        />
      </View>

      {/* desfoque começar mais cedo */}
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <LinearGradient
            colors={['black', 'black', 'transparent']}
            locations={[0, 0.2, 0.75]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        }
      >
        <Image
          source={image}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      </MaskedView>

      {/* Gradiente de profundidade para o texto*/}
      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Conteúdo */}
      <View className="flex-1 flex-row items-center justify-between px-6 z-10">
        <View className="flex-1">
          <Text 
            style={{ fontFamily: 'Nunito_700Bold' }}
            className="text-white text-[20px] mb-3"
          >
            {title}
          </Text>
          
          <View className="space-y-1.5">
            <View className="flex-row items-center">
              <MaterialIcons name="calendar-today" size={14} color="white" />
              <Text className="text-white/90 ml-3 text-[14px]" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                {days}
              </Text>
            </View>
            <View className="flex-row items-center">
              <MaterialIcons name="access-time" size={14} color="white" />
              <Text className="text-white/90 ml-3 text-[14px]" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                {time}
              </Text>
            </View>
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="door" size={16} color="white" />
              <Text className="text-white/90 ml-3 text-[14px]" style={{ fontFamily: 'Nunito_600SemiBold' }}>
                {room}
              </Text>
            </View>
          </View>
        </View>

        {/* Switch - direita*/}
        <TouchableOpacity 
          testID={testID} // APLICADO PARA O TESTE
          activeOpacity={0.8}
          onPress={onToggle}
          className={`w-[60px] h-[32px] rounded-full px-1 justify-center ${isActive ? 'bg-[#548F53]' : 'bg-white/30'}`}
        >
          <View 
            className={`w-[24px] h-[24px] bg-white rounded-full shadow-lg ${isActive ? 'self-end' : 'self-start'}`} 
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RoutineCard;