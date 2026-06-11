import { Scenario } from '@/constants/data/types';
import { isUserScenarioRouteId } from '@/utils/catalogTemplates';
import { Nunito_400Regular } from '@expo-google-fonts/nunito';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React, { useMemo } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { ScenarioCard } from '../ScenarioCard';
import { StepWrapper } from '../StepWrapper';

interface Step4Props {
  selected: string;
  onSelect: (id: string) => void;
  roomName: string;
  scenarios: Scenario[];
}

export const Step4_Environment = ({
  selected,
  onSelect,
  roomName,
  scenarios,
}: Step4Props) => {
  const filteredScenarios = useMemo(() => {
    if (!roomName) return [];

    const targetRoom = roomName.toLowerCase().trim();

    return scenarios.filter((s) => s.room?.toLowerCase().trim() === targetRoom);
  }, [roomName, scenarios]);

  const userScenarios = useMemo(
    () => filteredScenarios.filter((scenario) => isUserScenarioRouteId(scenario.id)),
    [filteredScenarios],
  );

  const templateScenarios = useMemo(
    () => filteredScenarios.filter((scenario) => !isUserScenarioRouteId(scenario.id)),
    [filteredScenarios],
  );

  return (
    <StepWrapper
      title="What kind of environment?"
      subtitle={`Choose one of your scenarios for the ${roomName || 'room'}, or create a new one.`}
    >
      {userScenarios.length > 0 && (
        <>
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-2xl text-[#2F4F4F] my-3"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
            accessibilityRole="header"
          >
            Your scenarios
          </Text>

          <View
            className="flex-row flex-wrap justify-between gap-y-4 mb-3"
            accessible={true}
            accessibilityRole="radiogroup"
            accessibilityLabel="Your scenarios"
          >
            {userScenarios.map((env) => (
              <View key={env.id} className="w-[48%]">
                <ScenarioCard
                  item={env}
                  isSelected={selected === env.id}
                  onSelect={onSelect}
                />
              </View>
            ))}
          </View>
        </>
      )}

      {templateScenarios.length > 0 && (
        <>
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-2xl text-[#2F4F4F] my-3"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
            accessibilityRole="header"
          >
            Recommended scenarios
          </Text>

          <View
            className="flex-row flex-wrap justify-between gap-y-4 mb-3"
            accessible={true}
            accessibilityRole="radiogroup"
            accessibilityLabel="Recommended scenarios"
          >
            {templateScenarios.map((env) => (
              <View key={env.id} className="w-[48%]">
                <ScenarioCard
                  item={env}
                  isSelected={selected === env.id}
                  onSelect={onSelect}
                />
              </View>
            ))}
          </View>
        </>
      )}

      {filteredScenarios.length === 0 && (
        <View className="w-full mb-3 p-4">
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-[#6A7D5B] text-sm text-center"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          >
            No scenarios found for &apos;{roomName}&apos; yet.
          </Text>
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-[#6A7D5B] text-sm text-center mt-1"
            style={{ fontFamily: 'Nunito_400Regular' }}
          >
            Create one for this room and then attach it to the activity.
          </Text>
        </View>
      )}

      <View
        className="flex-row flex-wrap justify-between gap-y-4"
        accessible={true}
        accessibilityRole="radiogroup"
        accessibilityLabel="Scenario actions"
      >
        <View className="w-[48%] aspect-square">
          <TouchableOpacity
            className="w-full h-full bg-[#D1E4D1] rounded-2xl justify-center items-center"
            activeOpacity={0.7}
            onPress={() => router.push('/new-scenario')}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Create new scene"
          >
            <MaterialIcons
              name="add"
              size={48}
              color="#354F52"
              importantForAccessibility="no"
            />
            <Text
              maxFontSizeMultiplier={1.2}
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
