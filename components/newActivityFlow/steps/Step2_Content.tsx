import { Activity, Content } from '@/constants/data/types';
import { supabase } from '@/utils/supabase';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
import { ContentCard } from '../ContentCard';
import { StepWrapper } from '../StepWrapper';

interface Step2Props {
  selectedContentId: string;
  onSelect: (id: string) => void;
  activityType: Activity['type'];
}

const PAGE_SIZE = 10;

export const Step2_Content = ({
  selectedContentId,
  onSelect,
  activityType,
}: Step2Props) => {
  const [dbContent, setDbContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);
  const [visibleByCarousel, setVisibleByCarousel] = useState<Record<string, number>>({});

  const fetchContents = useCallback(async () => {
      setLoading(true);
      const { data, error } = await supabase.from('contents').select('*').order('title', { ascending: true });
      if (error) {
        console.error('Error loading content from Supabase:', error);
      } else if (data) {
        setDbContent(data as Content[]);
      }
      setLoading(false);
    }, []);

  useEffect(() => {
    setVisibleByCarousel({});
    fetchContents();
  }, [fetchContents]);

  const filteredContent = useMemo(() => {
    const targetCategory = (activityType || '').toLowerCase();

    if (targetCategory === 'general') {
      return dbContent.filter((content) => content.type !== 'audiobooks');
    }

    return dbContent.filter((content) => {
      if (targetCategory === 'cooking' && content.type === 'recipe') return true;
      if (targetCategory === 'workout' && content.type === 'exercise') return true;

      const cat = (content.category || '').toLowerCase();
      const type = (content.type || '').toLowerCase();

      return cat === targetCategory || type === targetCategory || cat === 'general';
    });
  }, [activityType, dbContent]);

  const groupedContents = useMemo(() => {
    const groups: Record<string, Content[]> = {};

    const getWorkoutCategory = (content: Content) => {
      const text = `${content.title || ''} ${content.description || ''}`.toLowerCase();

      if (/yoga|pose|flow/.test(text)) return 'Yoga';
      if (/stretch|flexibility|mobility/.test(text)) return 'Stretching';
      if (/hiit|cardio|sprint|run|running/.test(text)) return 'Cardio';
      if (/strength|muscle|full body|training/.test(text)) return 'Strength';
      return 'Workout Sessions';
    };

    filteredContent.forEach((content) => {
      const isRecipe =
        content.type === 'recipe' ||
        content.category?.toLowerCase() === 'cooking';
      const isMeditation =
        content.type === 'meditation' ||
        content.category?.toLowerCase() === 'meditation';
      // Ajustado para apanhar 'audiobooks'
      const isAudiobook =
        content.type === 'audiobooks' ||
        content.category?.toLowerCase() === 'audiobook';
      const isWorkout =
        content.type === 'exercise' ||
        content.type === 'workout' ||
        content.type === 'video' ||
        content.category?.toLowerCase() === 'workout';

      // Agrupa Receitas, Meditações, Audiobooks e Workouts
      if (isRecipe || isMeditation || isAudiobook || isWorkout) {
        let rawCat = content.category;

        // Audiobooks devem ser agrupados por género, não por uma secção genérica.
        if (
          isAudiobook &&
          (
            !rawCat ||
            ['audiobook', 'audiobooks', 'audio'].includes(rawCat.toLowerCase())
          )
        ) {
          rawCat = content.genre || 'Other Audiobooks';
        } else if (isRecipe && rawCat?.toLowerCase() === 'cooking') {
          rawCat = 'Recipes';
        } else if (isMeditation && rawCat?.toLowerCase() === 'meditation') {
          rawCat = 'Meditations';
        } else if (isWorkout) {
          rawCat = getWorkoutCategory(content);
        }

        let fallbackName = 'Other Recipes';
        if (isMeditation) fallbackName = 'Other Meditations';
        if (isAudiobook) fallbackName = 'Other Audiobooks';
        if (isWorkout) fallbackName = 'Workout Sessions';

        const categoryName = rawCat
          ? rawCat.charAt(0).toUpperCase() + rawCat.slice(1)
          : fallbackName;

        if (!groups[categoryName]) {
          groups[categoryName] = [];
        }
        groups[categoryName].push(content);
      }
    });

    return groups;
  }, [filteredContent]);

  const videos = filteredContent.filter(
    (c) =>
      activityType !== 'workout' &&
      (c.type === 'video' || c.type === 'workout' || c.type === 'exercise'),
  );

  const loadMoreForCarousel = useCallback((title: string, total: number) => {
    setVisibleByCarousel((current) => {
      const currentVisible = current[title] ?? PAGE_SIZE;
      if (currentVisible >= total) return current;
      return {
        ...current,
        [title]: Math.min(currentVisible + PAGE_SIZE, total),
      };
    });
  }, []);

  const renderCarousel = (title: string, data: typeof filteredContent) => {
    if (data.length === 0) return null;
    const visibleCount = visibleByCarousel[title] ?? PAGE_SIZE;
    const visibleItems = data.slice(0, visibleCount);
    const hasMoreInCarousel = visibleItems.length < data.length;

    return (
      <View className="mb-8" key={title}>
        <Text
          maxFontSizeMultiplier={1.2}
          className="text-2xl text-[#2F4F4F] mb-3"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
          accessibilityRole="header"
        >
          {title}
        </Text>

        <FlatList
          data={visibleItems}
          horizontal
          onEndReached={() => loadMoreForCarousel(title, data.length)}
          onEndReachedThreshold={0.65}
          showsHorizontalScrollIndicator={false}
          className="-mx-5"
          contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
          keyExtractor={(item) => item.id}
          ListFooterComponent={
            hasMoreInCarousel ? (
              <View className="w-2" />
            ) : null
          }
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
      subtitle={`Required: Select content for your session.`}
    >
      {loading ? (
        <View className="items-center mt-10">
          <ActivityIndicator size="large" color="#5E8C5D" />
        </View>
      ) : (
        <>
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

          {Object.entries(groupedContents).map(([category, items]) =>
            renderCarousel(category, items),
          )}

          {activityType !== 'audiobooks'
            ? renderCarousel('Video sessions', videos)
            : null}
        </>
      )}
    </StepWrapper>
  );
};
