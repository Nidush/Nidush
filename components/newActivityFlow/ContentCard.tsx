import { Content } from '@/constants/data/types';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const clsx = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface ContentCardProps {
  item: Content;
  isSelected: boolean;
  onSelect: (id: string) => void;
  type?: 'small' | 'large';
}

export const ContentCard = ({
  item,
  isSelected,
  onSelect,
  type = 'small',
}: ContentCardProps) => {
  return (
    <TouchableOpacity
      onPress={() => onSelect(item.id)}
      activeOpacity={0.9}
      className={clsx(
        'relative rounded-2xl overflow-hidden',
        // MUDANÇA AQUI:
        // 1. Removemos h-[...px] fixo.
        // 2. Adicionamos 'aspect-square'. Isto garante que Altura = Largura.
        type === 'large'
          ? 'w-full aspect-square mb-3'
          : 'w-[48%] aspect-square',
      )}
    >
      {/* 1. Fundo */}
      <View style={StyleSheet.absoluteFill}>
        <Image
          source={item.image}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          blurRadius={Platform.OS === 'ios' ? 70 : 50}
        />
        <View className="absolute inset-0" />
      </View>

      {/* 2. Imagem Mascarada */}
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <LinearGradient
            colors={['black', 'black', 'transparent']}
            locations={[0.1, 0.1, 0.6]}
            style={StyleSheet.absoluteFill}
          />
        }
      >
        <Image
          source={item.image}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      </MaskedView>

      {/* 3. Gradiente de Texto */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
        locations={[0.4, 0.7, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* 4. Ícone Opções */}
      <TouchableOpacity className="absolute top-2.5 right-1 z-20 p-1">
        <MaterialIcons name="more-vert" size={24} color="white" />
      </TouchableOpacity>

      {/* 5. Texto e Info */}
      <View className="absolute bottom-0 w-full p-3 z-30">
        <Text
          numberOfLines={2} // Alterado para 2 linhas caso o título seja grande
          className={clsx(
            'text-white leading-tight mb-2', // Aumentado margin-bottom
            type === 'large' ? 'text-xl' : 'text-[16px]',
          )}
          style={{ fontFamily: 'Nunito_700Bold' }}
        >
          {item.title}
        </Text>

        <View className=" opacity-95 gap-1">
          <View className="flex-row items-center">
            <Ionicons
              name={item.type === 'video' ? 'play-circle' : 'headset'}
              size={16}
              color="white"
            />
            <Text
              className="text-white text-md ml-1.5 capitalize"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
            >
              {item.type}
            </Text>
          </View>

          {item.duration && (
            <View className="flex-row items-center">
              <MaterialIcons name="access-time" size={16} color="white" />
              <Text
                className="text-white text-md ml-1.5"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                {item.duration}
              </Text>
            </View>
          )}
        </View>
      </View>

      {/* Borda Flutuante */}
      <View
        pointerEvents="none"
        className={clsx(
          'absolute inset-0 rounded-2xl z-40',
          isSelected ? 'border-[3px] border-[#548F53]' : 'border-0',
        )}
      />
    </TouchableOpacity>
  );
};
