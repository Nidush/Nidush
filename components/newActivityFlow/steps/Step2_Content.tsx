import { Activity, Content } from '@/constants/data/types';
import { supabase } from '@/utils/supabase';
import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Text, View } from 'react-native';
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
  const [dbContent, setDbContent] = useState<Content[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContents = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('contents').select('*');

      if (error) {
        console.error('Erro ao carregar conteúdos do Supabase:', error);
      } else if (data) {
        setDbContent(data as Content[]);
      }
      setLoading(false);
    };

    fetchContents();
  }, []);

  const filteredContent = useMemo(() => {
    const targetCategory = (activityType || '').toLowerCase();

    if (targetCategory === 'general') {
      // Exclui audiobooks da vista "general". Só aparecem quando a atividade for "audiobooks"
      return dbContent.filter((content) => content.type !== 'audiobooks');
    }

    return dbContent.filter((content) => {
      if (targetCategory === 'cooking' && content.type === 'recipe')
        return true;
      if (targetCategory === 'workout' && content.type === 'exercise')
        return true;

      const cat = (content.category || '').toLowerCase();
      const type = (content.type || '').toLowerCase();

      return (
        cat === targetCategory || type === targetCategory || cat === 'general'
      );
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

        // Se for um audiobook mas o campo category estiver vazio ou apenas disser "audiobooks"
        if (isAudiobook && (!rawCat || rawCat.toLowerCase() === 'audiobooks')) {
          rawCat = 'Audiobooks';
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

  const audios = filteredContent.filter((c) => c.type === 'audio');

  const renderCarousel = (title: string, data: typeof filteredContent) => {
    if (data.length === 0) return null;

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

          {renderCarousel('Video sessions', videos)}
          {renderCarousel('Audio sessions', audios)}
        </>
      )}
    </StepWrapper>
  );
};
