import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { Pressable, Text, TouchableOpacity, View } from 'react-native';

interface FabMenuProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const FabMenu = ({ isOpen, setIsOpen }: FabMenuProps) => {
  return (
    <>
      {/* OVERLAY ESCURO */}
      {isOpen && (
        <Pressable
          className="absolute inset-0 bg-black/20 z-[5]"
          onPress={() => setIsOpen(false)}
        />
      )}

      {/* OPÇÕES DO MENU */}
      {isOpen && (
        <View className="absolute bottom-[110px] right-[25px] items-end z-[11]">
          {/* Opção 1: Scenario */}
          <TouchableOpacity
            className="mb-4"
            onPress={() => {
              setIsOpen(false);
              router.push('/new-scenario');
            }}
          >
            <Text
              className="bg-[#548F53] px-10 py-4 rounded-full text-xl text-white shadow-md overflow-hidden"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
            >
              Scenario
            </Text>
          </TouchableOpacity>

          {/* Opção 2: Activity */}
          <TouchableOpacity
            className="mb-4"
            onPress={() => {
              setIsOpen(false);
              router.push('/new-activity');
            }}
          >
            <Text
              className="bg-[#548F53] px-10 py-4 rounded-full text-xl text-white shadow-md overflow-hidden"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
            >
              Activity
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* BOTÃO PRINCIPAL (FAB) */}
      <TouchableOpacity
        activeOpacity={0.9}
        className="absolute bottom-8 right-6 bg-[#548F53] w-[65px] h-[65px] rounded-full justify-center items-center z-[10] shadow-lg shadow-black/40"
        onPress={() => setIsOpen(!isOpen)}
      >
        <Ionicons name={isOpen ? 'close' : 'add'} size={36} color="white" />
      </TouchableOpacity>
    </>
  );
};
