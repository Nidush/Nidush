import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import { UnifiedCard } from './UnifiedCard';

interface CarouselSectionProps {
  title: string;
  data: any[];
  showTime?: boolean;
}

export const CarouselSection = ({
  title,
  data,
  showTime,
}: CarouselSectionProps) => {
  if (data.length === 0) return null;

  return (
    <View className="mb-8">
      <View className="flex-row items-center mb-4 px-4">
        <Text
          className="text-2xl text-[#354F52]"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
        >
          {title}
        </Text>
        <Ionicons name="chevron-forward" size={20} color="#548F53" />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingLeft: 16, paddingRight: 8 }}
      >
        {data.map((item) => (
          <View key={item.id} className="mr-4">
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
      </ScrollView>
    </View>
  );
};
