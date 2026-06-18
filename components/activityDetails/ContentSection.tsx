import { Ingredient } from '@/constants/data';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import React from 'react';
import { Linking, Text, TouchableOpacity, View } from 'react-native';

type InstructionStep = {
  text: string;
  duration?: number;
  url?: string;
};

interface ContentSectionProps {
  ingredients?: Ingredient[];
  instructions: (string | InstructionStep)[];
  mediaUrl?: string;
  mediaLabel?: string;
}

export const ContentSection = ({
  ingredients,
  instructions,
  mediaUrl,
  mediaLabel,
}: ContentSectionProps) => {
  return (
    <>
      {ingredients && ingredients.length > 0 && (
        <View className="mb-8">
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-[#354F52] text-xl mb-3"
            style={{ fontFamily: 'Nunito_700Bold' }}
            accessible
            accessibilityRole="header"
          >
            Ingredients
          </Text>
          <View className="rounded-2xl p-4 border border-[#548f537f]">
            {ingredients.map((ing, i) => (
              <View
                key={i}
                className="flex-row justify-between py-2 border-b border-[#d5d5d5] last:border-0"
                accessible
                accessibilityRole="text"
                accessibilityLabel={`${ing.item}, amount: ${ing.amount}`}
                importantForAccessibility="no-hide-descendants"
                accessibilityElementsHidden={true}
              >
                <Text
                  maxFontSizeMultiplier={1.2}
                  className="text-[#354F52]"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  {ing.item}
                </Text>
                <Text
                  maxFontSizeMultiplier={1.2}
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
            maxFontSizeMultiplier={1.2}
            className="text-[#354F52] text-xl mb-4"
            style={{ fontFamily: 'Nunito_700Bold' }}
            accessible
            accessibilityRole="header"
          >
            Instructions
          </Text>

          {instructions.map((step, i) => {
            const isObject = typeof step !== 'string';
            const stepText = isObject ? (step as InstructionStep).text : step;
            const duration = isObject
              ? (step as InstructionStep).duration
              : null;
            const stepUrl = isObject
              ? (step as InstructionStep).url
              : null;

            return (
              <View
                key={i}
                className="flex-row mb-4"
                accessible
                accessibilityRole="text"
                accessibilityLabel={`Step ${i + 1}: ${stepText}${
                  duration
                    ? `. Duration: ${
                        duration < 60
                          ? `${duration} seconds`
                          : `${Math.floor(duration / 60)} minutes`
                      }`
                    : ''
                }`}
                importantForAccessibility="no-hide-descendants"
                accessibilityElementsHidden={true}
              >
                <View className="bg-[#BBE6BA] w-8 h-8 rounded-full items-center justify-center mr-3">
                  <Text
                    maxFontSizeMultiplier={1.2}
                    className="text-[#354F52]"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    {i + 1}
                  </Text>
                </View>
                <View className="flex-1 mt-1">
                  <Text
                    maxFontSizeMultiplier={1.2}
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
                        maxFontSizeMultiplier={1.2}
                        className="text-[#548F53] text-xs ml-1"
                        style={{ fontFamily: 'Nunito_700Bold' }}
                      >
                        {duration < 60
                          ? `${duration}s`
                          : `${Math.floor(duration / 60)} min`}
                      </Text>
                    </View>
                  )}

                  {stepUrl ? (
                    <TouchableOpacity
                      className="mt-2 self-start"
                      onPress={() => Linking.openURL(stepUrl).catch(() => {})}
                    >
                      <Text
                        maxFontSizeMultiplier={1.2}
                        className="text-[#548F53] text-sm underline"
                        style={{ fontFamily: 'Nunito_700Bold' }}
                      >
                        Open track
                      </Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {mediaUrl ? (
        <View className="mb-6">
          <TouchableOpacity
            className="rounded-2xl border border-[#548f537f] px-4 py-3 self-start bg-[#F6FBF6]"
            onPress={() => Linking.openURL(mediaUrl).catch(() => {})}
          >
            <Text
              maxFontSizeMultiplier={1.2}
              className="text-[#548F53]"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              {mediaLabel || 'Open audiobook'}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </>
  );
};
