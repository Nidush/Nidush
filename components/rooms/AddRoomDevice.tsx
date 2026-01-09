import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';
// Certifique-se de importar as fontes corretamente conforme seu projeto
import { Nunito_600SemiBold, useFonts } from '@expo-google-fonts/nunito';

// Interface para definir o formato de cada ação
interface ActionItem {
  label: string;
  onPress: () => void;
}

interface FloatingActionMenuProps {
  actions: ActionItem[]; // Lista de botões que vão aparecer (ex: Room, Device)
}

export default function AddRoomDevice({ actions }: FloatingActionMenuProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Garantir que a fonte está carregada (opcional se já carregar no _layout ou App.js)
  let [fontsLoaded] = useFonts({ Nunito_600SemiBold });
  if (!fontsLoaded) return null;

  return (
    <>
      {/* BACKGROUND ESCURO (OVERLAY) */}
      {isMenuOpen && (
        <Pressable
          className="absolute inset-0 bg-black/20 z-[5]"
          onPress={() => setIsMenuOpen(false)}
        />
      )}

      {/* ITENS DO MENU (Aparecem quando aberto) */}
      {isMenuOpen && (
        <View className="absolute bottom-[110px] right-[25px] items-end z-[11]">
          {actions.map((action, index) => (
            <TouchableOpacity key={index} className="mb-4">
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

      {/* BOTÃO PRINCIPAL (+ / x) */}
      <TouchableOpacity
        activeOpacity={0.9}
        className="absolute bottom-8 right-6 bg-[#548F53] w-[65px] h-[65px] rounded-full justify-center items-center z-[10] shadow-lg shadow-black/40"
        onPress={() => setIsMenuOpen(!isMenuOpen)}
      >
        <Ionicons name={isMenuOpen ? 'close' : 'add'} size={36} color="white" />
      </TouchableOpacity>
    </>
  );
}
