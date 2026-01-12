import { CONTENTS } from '@/constants/data';
import { Activity } from '@/constants/data/types';
import React, { useMemo } from 'react';
import { Text, View } from 'react-native';
import { ContentCard } from '../ContentCard';
import { StepWrapper } from '../StepWrapper';

interface Step2Props {
  selectedContentId: string;
  onSelect: (id: string) => void;
  activityType: Activity['type'];
}

export const Step2_Content = ({
  selectedContentId,
  onSelect,
  activityType,
}: Step2Props) => {
  const filteredContent = useMemo(() => {
    // MAPA CRÍTICO: Chave = ID do Step 1 | Valor = Categoria nos Dados (singular)
    const categoryMap: Record<string, string> = {
      cooking: 'cooking',
      meditation: 'meditation',
      workout: 'workout',
      audiobooks: 'audiobook', // Step 1 usa plural, Data usa singular
      general: 'general',
    };

    if (activityType === 'general') return Object.values(CONTENTS);

    // Usa o mapa para encontrar o nome correto, ou usa o próprio ID como fallback
    const targetCategory = categoryMap[activityType] || activityType;

    return Object.values(CONTENTS).filter(
      (content) => content.category === targetCategory,
    );
  }, [activityType]);

  // Agrupamento Visual
  const recipes = filteredContent.filter((c) => c.type === 'recipe');
  const videos = filteredContent.filter(
    (c) => c.type === 'video' || c.type === 'workout',
  );
  const audios = filteredContent.filter((c) => c.type === 'audio');

  return (
    <StepWrapper
      title="Choose your content"
      subtitle={`Select content for your ${activityType} session.`}
    >
      {/* Estado Vazio */}
      {filteredContent.length === 0 && (
        <View className="items-center mt-10">
          <Text className="text-[#2F4F4F] text-base font-[Nunito_600SemiBold]">
            No content found for &quot;{activityType}&quot;.
          </Text>
        </View>
      )}

      {/* RECIPES */}
      {recipes.length > 0 && (
        <>
          <Text
            className="text-lg text-[#2F4F4F] my-3"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            Recipes
          </Text>
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {recipes.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                isSelected={selectedContentId === item.id}
                onSelect={() => onSelect(item.id)}
              />
            ))}
          </View>
        </>
      )}

      {/* VIDEOS */}
      {videos.length > 0 && (
        <>
          <Text
            className="text-lg text-[#2F4F4F] my-3"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            Video sessions
          </Text>
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {videos.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                isSelected={selectedContentId === item.id}
                onSelect={() => onSelect(item.id)}
              />
            ))}
          </View>
        </>
      )}

      {/* AUDIOS */}
      {audios.length > 0 && (
        <>
          <Text
            className="text-lg text-[#2F4F4F] my-3"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            Audio sessions
          </Text>
          <View className="flex-row flex-wrap justify-between gap-y-3">
            {audios.map((item) => (
              <ContentCard
                key={item.id}
                item={item}
                isSelected={selectedContentId === item.id}
                onSelect={() => onSelect(item.id)}
              />
            ))}
          </View>
        </>
      )}
    </StepWrapper>
  );
};
