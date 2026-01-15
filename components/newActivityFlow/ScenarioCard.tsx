import { Scenario } from '@/constants/data'; // Ajusta o import conforme o teu ficheiro de tipos
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
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

interface ScenarioCardProps {
  item: Scenario;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

export const ScenarioCard = ({
  item,
  isSelected,
  onSelect,
}: ScenarioCardProps) => {
  return (
    <TouchableOpacity
      onPress={() => onSelect(item.id)}
      activeOpacity={0.9}
      className={clsx(
        'relative rounded-2xl overflow-hidden bg-gray-900',
        // 'w-full' faz com que ele preencha o container de 48% do pai
        // 'aspect-square' garante que é um quadrado perfeito
        'w-full aspect-square',
      )}
    >
      {/* --- CAMADA 1: FUNDO COM BLUR --- */}
      <View style={StyleSheet.absoluteFill}>
        <Image
          source={item.image}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          blurRadius={Platform.OS === 'ios' ? 70 : 50}
        />
        <View className="absolute inset-0 bg-black/20" />
      </View>

      {/* --- CAMADA 2: IMAGEM MASCARADA (Fade) --- */}
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

      {/* --- CAMADA 3: GRADIENTE DE LEITURA --- */}
      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
        locations={[0.4, 0.7, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* --- CAMADA 4: ÍCONE DE OPÇÕES --- */}
      <TouchableOpacity className="absolute top-2.5 right-1 z-20 p-1">
        <MaterialIcons name="more-vert" size={24} color="white" />
      </TouchableOpacity>

      {/* --- CAMADA 5: TEXTO E INFO --- */}
      <View className="absolute bottom-0 w-full p-3 z-30">
        <Text
          numberOfLines={2}
          className="text-white text-[16px] leading-tight mb-2"
          style={{ fontFamily: 'Nunito_700Bold' }}
        >
          {item.title}
        </Text>

        <View className="flex-row items-center opacity-95">
          <MaterialCommunityIcons name="door" size={16} color="white" />
          <Text
            className="text-white text-md ml-1.5"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          >
            {item.room}
          </Text>
        </View>
      </View>

      {/* --- CAMADA 6: BORDA FLUTUANTE --- */}
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
