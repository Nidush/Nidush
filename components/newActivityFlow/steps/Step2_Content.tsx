import { CONTENTS } from '@/constants/data';
import { Activity } from '@/constants/data/types';
import React, { useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';
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
    const categoryMap: Record<string, string> = {
      cooking: 'cooking',
      meditation: 'meditation',
      workout: 'workout',
      audiobooks: 'audiobook',
      general: 'general',
    };

    if (activityType === 'general') return Object.values(CONTENTS);

    const targetCategory = categoryMap[activityType] || activityType;

    return Object.values(CONTENTS).filter(
      (content) => content.category === targetCategory,
    );
  }, [activityType]);

  const recipes = filteredContent.filter((c) => c.type === 'recipe');
  const videos = filteredContent.filter(
    (c) => c.type === 'video' || c.type === 'workout',
  );
  const audios = filteredContent.filter((c) => c.type === 'audio');

  const renderCarousel = (title: string, data: typeof filteredContent) => {
    if (data.length === 0) return null;

    return (
      <View className="mb-8">
        <Text
          className="text-2xl text-[#2F4F4F] mb-3"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
        >
          {title}
        </Text>

        <FlatList
          data={data}
          horizontal
          showsHorizontalScrollIndicator={false}
          className="-mx-5"
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View className="w-[170px]">
              <ContentCard
                item={item}
                type="large"
                isSelected={selectedContentId === item.id}
                onSelect={() => onSelect(item.id)}
              />
            </View>
          )}
        />
      </View>
    );
  };

  return (
    <StepWrapper
      title="Choose your content"
      subtitle={`Select content for your ${activityType} session.`}
    >
      {filteredContent.length === 0 && (
        <View className="items-center mt-10">
          <Text
            className="text-[#2F4F4F] text-base"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          >
            {`No content found for "${activityType}".`}
          </Text>
        </View>
      )}

      {renderCarousel('Recipes', recipes)}
      {renderCarousel('Video sessions', videos)}
      {renderCarousel('Audio sessions', audios)}
    </StepWrapper>
  );
};
