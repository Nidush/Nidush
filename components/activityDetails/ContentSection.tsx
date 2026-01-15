import { Ingredient } from '@/constants/data';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Text, View } from 'react-native';

type InstructionStep = {
  text: string;
  duration?: number;
};

interface ContentSectionProps {
  ingredients?: Ingredient[];
  instructions: (string | InstructionStep)[];
}

export const ContentSection = ({
  ingredients,
  instructions,
}: ContentSectionProps) => {
  return (
    <>
      {ingredients && ingredients.length > 0 && (
        <View className="mb-8">
          <Text
            className="text-[#354F52] text-xl mb-3"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            Ingredients
          </Text>
          <View className="rounded-2xl p-4 border border-[#548f537f]">
            {ingredients.map((ing, i) => (
              <View
                key={i}
                className="flex-row justify-between py-2 border-b border-[#d5d5d5] last:border-0"
              >
                <Text
                  className="text-[#354F52]"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  {ing.item}
                </Text>
                <Text
                  className="text-[#548F53]"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  {ing.amount}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
      {instructions.length > 0 && (
        <View className="mb-4">
          <Text
            className="text-[#354F52] text-xl mb-4"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            Instructions
          </Text>
          {instructions.map((step, i) => {
            const isObject = typeof step !== 'string';
            const stepText = isObject ? (step as InstructionStep).text : step;
            const duration = isObject
              ? (step as InstructionStep).duration
              : null;

            return (
              <View key={i} className="flex-row mb-4">
                <View className="bg-[#BBE6BA] w-8 h-8 rounded-full items-center justify-center mr-3">
                  <Text
                    className="text-[#354F52]"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    {i + 1}
                  </Text>
                </View>
                <View className="flex-1 mt-1">
                  <Text
                    className="text-[#354F52] text-[16px] leading-6"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  >
                    {stepText}
                  </Text>

                  {duration && (
                    <View className="flex-row items-center mt-1">
                      <MaterialCommunityIcons
                        name="clock-outline"
                        size={14}
                        color="#548F53"
                      />
                      <Text
                        className="text-[#548F53] text-xs ml-1"
                        style={{ fontFamily: 'Nunito_700Bold' }}
                      >
                        {duration < 60
                          ? `${duration}s`
                          : `${Math.floor(duration / 60)} min`}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}
    </>
  );
};
