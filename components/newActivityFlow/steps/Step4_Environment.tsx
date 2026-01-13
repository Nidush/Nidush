import { SCENARIOS } from '@/constants/data'; // Ajusta o caminho dos dados
import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ScenarioCard } from '../ScenarioCard'; // Importa o componente criado acima
import { StepWrapper } from '../StepWrapper';

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
  // 1. FILTRAGEM (Case Insensitive)
  const filteredScenarios = useMemo(() => {
    if (!roomName) return [];

    // Converte tudo para minúsculas e remove espaços para garantir match
    const targetRoom = roomName.toLowerCase().trim();

    return SCENARIOS.filter((s) => s.room.toLowerCase().trim() === targetRoom);
  }, [roomName]);

  return (
    <StepWrapper
      title="What kind of environment?"
      subtitle={`Select a scenario for the ${roomName || 'room'} or create a new one.`}
    >
      <Text
        className="text-2xl text-[#2F4F4F] my-3"
        style={{ fontFamily: 'Nunito_600SemiBold' }}
      >
        Scenarios
      </Text>

      {/* --- GRID LAYOUT ---
          flex-wrap: permite cair para a linha de baixo
          justify-between: afasta os items para as pontas
          gap-y-4: espaçamento vertical
      */}
      <View className="flex-row flex-wrap justify-between gap-y-4">
        {/* Lista de Cenários */}
        {filteredScenarios.map((env) => (
          // O Wrapper define a largura da coluna (48%)
          <View key={env.id} className="w-[48%]">
            <ScenarioCard
              item={env}
              isSelected={selected === env.id}
              onSelect={onSelect}
            />
          </View>
        ))}

        {/* Mensagem de Estado Vazio */}
        {filteredScenarios.length === 0 && (
          <View className="w-full mb-3 p-4">
            <Text
              className="text-[#6A7D5B] text-sm text-center"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
            >
              No Scenarios found for &apos;{roomName}&apos;.
            </Text>
          </View>
        )}

        {/* Botão Create Scene (Também ocupa 48% e é quadrado) */}
        <View className="w-[48%] aspect-square">
          <TouchableOpacity
            className="w-full h-full bg-[#D1E4D1] rounded-2xl justify-center items-center"
            activeOpacity={0.7}
            // onPress={() => console.log('Criar')}
          >
            <MaterialIcons name="add" size={48} color="#354F52" />
            <Text
              className="text-[#354F52] text-xl mt-2"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
            >
              Create Scene
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </StepWrapper>
  );
};
