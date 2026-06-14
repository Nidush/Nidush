import { Activity, Content } from '@/constants/data/types';
import { supabase } from '@/utils/supabase'; // <-- Importação do Supabase
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

  // 1. Ir buscar APENAS à base de dados quando o componente monta
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

  // 2. Filtrar o conteúdo que veio da base de dados com base na atividade selecionada
  const filteredContent = useMemo(() => {
    if (activityType === 'general') return dbContent;

    const targetCategory = (activityType || '').toLowerCase();

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

  // 3. Separar as Receitas por Categoria
  const groupedRecipes = useMemo(() => {
    const groups: Record<string, Content[]> = {};

    filteredContent.forEach((content) => {
      const isRecipe =
        content.type === 'recipe' ||
        content.category?.toLowerCase() === 'cooking';

      if (isRecipe) {
        // Se a categoria for "cooking", chamamos apenas "Recipes". Caso contrário, usamos a categoria real.
        const rawCat =
          content.category?.toLowerCase() === 'cooking'
            ? 'Recipes'
            : content.category;

        // Capitalizamos a primeira letra ou usamos um Fallback
        const categoryName = rawCat
          ? rawCat.charAt(0).toUpperCase() + rawCat.slice(1)
          : 'Other Recipes';

        if (!groups[categoryName]) {
          groups[categoryName] = [];
        }
        groups[categoryName].push(content);
      }
    });

    return groups;
  }, [filteredContent]);

  // 4. Separar Vídeos e Áudios (mantêm-se iguais)
  const videos = filteredContent.filter(
    (c) => c.type === 'video' || c.type === 'workout' || c.type === 'exercise',
  );
  const audios = filteredContent.filter(
    (c) =>
      c.type === 'audio' ||
      c.category?.toLowerCase() === 'audiobook' ||
      c.type === 'meditation',
  );

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
      subtitle={`Required: Select content for your ${activityType} session.`}
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

          {/* Renderiza um carrossel dinâmico para cada categoria de receita */}
          {Object.entries(groupedRecipes).map(([category, items]) =>
            renderCarousel(category, items),
          )}

          {/* Renderiza os restantes */}
          {renderCarousel('Video sessions', videos)}
          {renderCarousel('Audio sessions', audios)}
        </>
      )}
    </StepWrapper>
  );
};
