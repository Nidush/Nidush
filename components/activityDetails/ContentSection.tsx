import { Ingredient } from '@/constants/data';
import React from 'react';
import { Text, View } from 'react-native';

interface ContentSectionProps {
  ingredients?: Ingredient[];
  instructions: string[];
}

export const ContentSection = ({
  ingredients,
  instructions,
}: ContentSectionProps) => {
  return (
    <>
      {/* Ingredientes */}
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

      {/* Instruções */}
      {instructions.length > 0 && (
        <View className="mb-4">
          <Text
            className="text-[#354F52] text-xl mb-4"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            Instructions
          </Text>
          {instructions.map((step, i) => (
            <View key={i} className="flex-row mb-4">
              <View className="bg-[#BBE6BA] w-8 h-8 rounded-full items-center justify-center mr-3">
                <Text
                  className="text-[#354F52]"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  {i + 1}
                </Text>
              </View>
              <Text
                className="text-[#354F52] text-[16px] flex-1 leading-6 mt-1"
                style={{ fontFamily: 'Nunito_400Regular' }}
              >
                {step}
              </Text>
            </View>
          ))}
        </View>
      )}
    </>
  );
};
