import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View, NativeSyntheticEvent, NativeScrollEvent, ActivityIndicator } from 'react-native';
import { UnifiedCard } from './UnifiedCard';

interface CarouselSectionProps {
  title: string;
  data: any[];
  showTime?: boolean;
  onEndReached?: () => void;
  isLoadingMore?: boolean;
}

export const CarouselSection = ({
  title,
  data,
  showTime,
  onEndReached,
  isLoadingMore,
}: CarouselSectionProps) => {
  if (data.length === 0) return null;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    
    // Dispara quando faltarem 150px para o fim
    const isCloseToRight = layoutMeasurement.width + contentOffset.x >= contentSize.width - 150;
    
    if (isCloseToRight && onEndReached) {
      console.log(`[API] Fim do Carrossel "${title}" detetado. A buscar fatias de 10...`);
      onEndReached();
    }
  };




  return (
    <View className="mb-8">
      <View className="flex-row items-center mb-4 px-4">
        <Text
          maxFontSizeMultiplier={1.2}
          className="text-2xl text-[#354F52]"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
          accessibilityRole="header"
        >
          {title}
        </Text>
        <Ionicons
          name="chevron-forward"
          size={20}
          color="#548F53"
          importantForAccessibility="no"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
      >
        {data.map((item, index) => (
          <View key={`${item.id}_${index}`} className="mr-4">
            <UnifiedCard
              id={item.id}
              title={item.title}
              image={item.image}
              time={showTime ? item.time : undefined}
              room={item.room}
              width={180}
              aspectRatio={1}
              onPress={() =>
                router.push({
                  pathname: '/activity-details',
                  params: { id: item.id },
                })
              }
            />
          </View>
        ))}
        {isLoadingMore && (
          <View className="justify-center items-center px-4">
            <ActivityIndicator color="#548F53" />
          </View>
        )}
      </ScrollView>
    </View>
  );
};
