import { SCENARIOS } from '@/constants/data'; // Importa os dados reais
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { ImageBackground, Text, TouchableOpacity, View } from 'react-native';
import { StepWrapper } from '../StepWrapper';

// Utilitário para classes condicionais
const clsx = (...classes: (string | boolean | undefined | null)[]) =>
  classes.filter(Boolean).join(' ');

interface Step4Props {
  selected: string;
  onSelect: (id: string) => void;
  roomName: string;
}

export const Step4_Environment = ({
  selected,
  onSelect,
  roomName,
}: Step4Props) => {
  // 1. Filtrar Cenários pela Sala Selecionada
  const filteredScenarios = useMemo(() => {
    // Se não houver sala selecionada (caso raro), retorna vazio
    if (!roomName) return [];
    return SCENARIOS.filter((s) => s.room === roomName);
  }, [roomName]);

  return (
    <StepWrapper
      title="What kind of environment?"
      subtitle={`Select a scenario for the ${roomName || 'room'} or create a new one.`}
    >
      <Text
        className="text-lg text-[#2F4F4F] my-3"
        style={{ fontFamily: 'Nunito_700Bold' }}
      >
        Scenarios
      </Text>

      <View className="flex-row flex-wrap gap-3 justify-between">
        {/* Renderiza os cenários filtrados */}
        {filteredScenarios.map((env) => (
          <TouchableOpacity
            key={env.id}
            className={clsx(
              'w-[48%] h-[148px] rounded-3xl overflow-hidden border-[3px]',
              selected === env.id ? 'border-[#548F53]' : 'border-transparent',
            )}
            onPress={() => onSelect(env.id)}
            activeOpacity={0.8}
          >
            <ImageBackground
              // Usa a imagem do objeto (require)
              source={env.image}
              className="flex-1"
              imageStyle={{ borderRadius: 20 }}
            >
              {/* Ícone de opções */}
              <TouchableOpacity className="absolute top-2.5 right-1 z-10">
                <MaterialIcons name="more-vert" size={24} color="white" />
              </TouchableOpacity>

              {/* Overlay Escuro para leitura do texto */}
              <View className="flex-1 p-3 justify-end bg-black/30">
                <Text
                  className="text-white text-sm shadow-sm"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  {env.title}
                </Text>

                <View className="flex-row items-center gap-1 mt-0.5">
                  <MaterialIcons name="door-front" size={16} color="white" />
                  <Text
                    className="text-white text-xs shadow-sm"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  >
                    {env.room}
                  </Text>
                </View>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ))}

        {/* Caso não existam cenários para esta sala */}
        {filteredScenarios.length === 0 && (
          <View className="w-full mb-3">
            <Text
              className="text-[#6A7D5B] text-sm text-center italic"
              style={{ fontFamily: 'Nunito_400Regular' }}
            >
              No presets found for {roomName}. Create your own below.
            </Text>
          </View>
        )}

        {/* Botão Create Scene (Sempre Visível) */}
        <TouchableOpacity
          className="w-[48%] h-[148px] bg-[#D1E4D1] rounded-3xl justify-center items-center"
          activeOpacity={0.7}
          // onPress={() => console.log('Navegar para criar cenário')}
        >
          <Ionicons name="add" size={40} color="#354F52" />
          <Text
            className="text-[#354F52] text-base mt-2"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          >
            Create Scene
          </Text>
        </TouchableOpacity>
      </View>
    </StepWrapper>
  );
};
