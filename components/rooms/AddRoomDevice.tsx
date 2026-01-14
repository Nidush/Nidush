import { Nunito_600SemiBold, useFonts } from '@expo-google-fonts/nunito';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';

interface ActionItem {
  label: string;
  onPress?: () => void;
}

interface FloatingActionMenuProps {
  actions: ActionItem[];
  isStatic?: boolean; // Nova prop opcional para saber se o botao é estático
}

export default function AddRoomDevice({ actions, isStatic = false }: FloatingActionMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  let [fontsLoaded] = useFonts({ Nunito_600SemiBold });
  if (!fontsLoaded) return null;

  // Função o clique no tbn
  const handlePress = () => {
    if (!isStatic) {
      setIsMenuOpen(!isMenuOpen);
    }
  };

  return (
    <>
      {/* Só mostra o fundo e o menu se NÃO for estático E estiver aberto */}
      {!isStatic && isMenuOpen && (
        <Pressable
          className="absolute inset-0 bg-black/20 z-[5]"
          onPress={() => setIsMenuOpen(false)}
        />
      )}

      {!isStatic && isMenuOpen && (
        <View className="absolute bottom-[110px] right-[25px] items-end z-[11]">
          {actions.map((action, index) => (
            <TouchableOpacity 
              key={index} 
              className="mb-4"
              onPress={action.onPress}
            >
              <Text
                className="bg-[#548F53] px-10 py-4 rounded-full text-xl text-white shadow-md overflow-hidden"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                {action.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <TouchableOpacity
        activeOpacity={isStatic ? 1 : 0.9} // Se for estático, não brilha ao clicar
        className="absolute bottom-8 right-6 bg-[#548F53] w-[65px] h-[65px] rounded-full justify-center items-center z-[10] shadow-lg shadow-black/40"
        onPress={handlePress}
      >
        {/* Se for estático, mostra sempre o 'add'. Se não, alterna com o 'close' */}
        <Ionicons name={(!isStatic && isMenuOpen) ? 'close' : 'add'} size={36} color="white" />
      </TouchableOpacity>
    </>
  );
}