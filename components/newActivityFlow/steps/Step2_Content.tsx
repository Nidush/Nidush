import { Activity, Content } from '@/constants/data/types';
import React, { useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';
import { ContentCard } from '../ContentCard';
import { StepWrapper } from '../StepWrapper';

interface Step2Props {
  selectedContentId: string;
  onSelect: (id: string) => void;
  activityType: Activity['type'];
  contentList: Content[];
}

export const Step2_Content = ({
  selectedContentId,
  onSelect,
  activityType,
  contentList,
}: Step2Props) => {
  const normalizeCategory = (value: string) => {
    const normalized = value.toLowerCase().trim();
    if (normalized === 'audiobooks' || normalized === 'audiobook') return 'audio';
    return normalized;
  };

  const filteredContent = useMemo(() => {
    if (activityType === 'general') return contentList;

    const targetCategory = normalizeCategory(activityType || '');

    return contentList.filter(
      (content) => {
        // Fallback checks for API data
        if (targetCategory === 'cooking' && content.type === 'recipe') return true;
        if (targetCategory === 'workout' && content.type === 'exercise') return true;
        if (targetCategory === 'audio' && (content.type === 'audiobooks' || content.type === 'audio')) return true;

        const cat = normalizeCategory(content.category || '');
        return cat === targetCategory || cat === 'general';
      }
    );
  }, [activityType, contentList]);

  const recipes = filteredContent.filter((c) => c.type === 'recipe' || c.category?.toLowerCase() === 'cooking');
  const videos = filteredContent.filter(
    (c) => c.type === 'video' || c.type === 'workout' || c.type === 'exercise'
  );
  const audios = filteredContent.filter(
    (c) => c.type === 'audiobooks' || c.type === 'audio' || c.category?.toLowerCase() === 'audio'
  );

  const renderCarousel = (title: string, data: typeof filteredContent) => {
    if (data.length === 0) return null;

    return (
      <View className="mb-8">
        <Text
          maxFontSizeMultiplier={1.2}
          className="text-2xl text-[#2F4F4F] mb-3"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
          accessibilityRole="header"
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
      subtitle={`Required: Select content for your ${activityType} session.`}
    >
      {filteredContent.length === 0 && (
        <View className="items-center mt-10">
          <Text
            className="text-[#2F4F4F] text-base"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
            maxFontSizeMultiplier={1.2}
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
