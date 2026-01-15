import { SCENARIOS } from '@/constants/data';
import { MaterialIcons } from '@expo/vector-icons';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ScenarioCard } from '../ScenarioCard';
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
  const filteredScenarios = useMemo(() => {
    if (!roomName) return [];

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

      <View className="flex-row flex-wrap justify-between gap-y-4">
        {filteredScenarios.map((env) => (
          <View key={env.id} className="w-[48%]">
            <ScenarioCard
              item={env}
              isSelected={selected === env.id}
              onSelect={onSelect}
            />
          </View>
        ))}

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

        <View className="w-[48%] aspect-square">
          <TouchableOpacity
            className="w-full h-full bg-[#D1E4D1] rounded-2xl justify-center items-center"
            activeOpacity={0.7}
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
