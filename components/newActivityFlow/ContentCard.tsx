import { Content } from '@/constants/data/types'; // <--- Importa o tipo oficial
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { ImageBackground, Text, TouchableOpacity, View } from 'react-native';

// Utilitário para juntar classes
const clsx = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface ContentCardProps {
  item: Content; // <--- Agora usa o tipo correto!
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
      onPress={() => onSelect(item.id)} // Passa o ID, não o título
      activeOpacity={0.9}
      className={clsx(
        'rounded-3xl overflow-hidden border-[3px]',
        // Layout: large ocupa largura total, small ocupa ~48%
        type === 'large' ? 'w-full h-[148px] mb-3' : 'w-[48%] h-[148px]',
        isSelected ? 'border-[#548F53]' : 'border-transparent',
      )}
    >
      <ImageBackground
        // O tipo ImageSourcePropType (do types.ts) funciona direto aqui
        source={item.image}
        className="flex-1"
        imageStyle={{ borderRadius: 20 }}
      >
        {/* Ícone de opções */}
        <TouchableOpacity className="absolute top-2.5 right-1 z-10">
          <MaterialIcons name="more-vert" size={24} color="white" />
        </TouchableOpacity>

        {/* Overlay escuro */}
        <View className="flex-1 justify-end p-3 bg-black/20">
          {/* Título */}
          <Text
            className={clsx(
              'text-white text-shadow', // Adicionei text-shadow para legibilidade
              type === 'large' ? 'text-xl' : 'text-[15px]',
            )}
            style={{ fontFamily: 'Nunito_700Bold' }}
            numberOfLines={1}
          >
            {item.title}
          </Text>

          {/* Linha de Ícone e Duração */}
          <View className="flex-row items-center gap-1.5 mt-0.5">
            <Ionicons
              // Verifica se é 'video' (minúsculo) conforme o types.ts
              name={item.type === 'video' ? 'play-circle' : 'headset'}
              size={14}
              color="white"
            />
            <Text
              className="text-white text-[11px] capitalize" // 'capitalize' mete a primeira letra grande
              style={{ fontFamily: 'Nunito_400Regular' }}
            >
              {item.type} • {item.duration}
            </Text>
          </View>
        </View>
      </ImageBackground>
    </TouchableOpacity>
  );
};
