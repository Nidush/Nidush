import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, ImageBackground, Text, View } from 'react-native';
import { ReviewCard } from '../ReviewCard';
import { ScenarioReviewCard } from '../ScenarioReviewCard'; // <--- Importa o novo componente
import { StepWrapper } from '../StepWrapper';

// Interfaces (mantêm-se para tipagem da prop 'data')
interface ScenarioDevice {
  deviceId: string;
  state: string;
  value?: string | number;
  brightness?: string;
}

interface Step6Props {
  data: {
    activityType: string;
    content: {
      title: string;
      image: any;
      duration: string;
      type: string;
    } | null;
    room: string;
    environment: {
      id: string;
      title: string;
      playlist?: string;
      focusMode: boolean;
      devices: ScenarioDevice[];
    } | null;
    activityName: string;
    description: string;
    activityImage: string | null;
  };
  onJumpToStep: (step: number) => void;
}

export const Step6_Review = ({ data, onJumpToStep }: Step6Props) => {
  const { content, environment } = data;

  return (
    <StepWrapper
      title="Review and save"
      subtitle="See if everything is right and save your new activity."
    >
      {/* Activity Type */}
      <ReviewCard label="Activity Type" onEdit={() => onJumpToStep(1)}>
        <View className="flex-row items-center">
          <View className="w-11 h-11 rounded-xl bg-[#C8E2C8] justify-center items-center mr-3">
            <MaterialIcons name="self-improvement" size={24} color="#354F52" />
          </View>
          <Text
            className="text-base text-[#2F4F4F]"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          >
            {data.activityType || 'Not selected'}
          </Text>
        </View>
      </ReviewCard>

      {/* Contents */}
      <ReviewCard label="Contents" onEdit={() => onJumpToStep(2)}>
        {content ? (
          <ImageBackground
            source={content.image}
            className="w-full h-[120px] overflow-hidden rounded-xl"
          >
            <View className="flex-1 bg-black/30 p-3 justify-end">
              <Text
                className="text-white text-base shadow-sm"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                {content.title}
              </Text>
              <View className="flex-row items-center gap-3 mt-1">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="time-outline" size={12} color="white" />
                  <Text
                    className="text-white text-xs"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  >
                    {content.duration}
                  </Text>
                </View>
                <View className="flex-row items-center gap-1">
                  <Ionicons
                    name={
                      content.type === 'audio' || content.type === 'audiobook'
                        ? 'headset'
                        : 'play-circle'
                    }
                    size={12}
                    color="white"
                  />
                  <Text
                    className="text-white text-xs capitalize"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  >
                    {content.type}
                  </Text>
                </View>
              </View>
            </View>
          </ImageBackground>
        ) : (
          <Text className="text-gray-400 italic">No content selected</Text>
        )}
      </ReviewCard>

      {/* Room */}
      <ReviewCard label="Room" onEdit={() => onJumpToStep(3)}>
        <View className="flex-row items-center">
          <View className="w-11 h-11 rounded-xl bg-[#C8E2C8] justify-center items-center mr-3">
            <MaterialIcons name="bed" size={24} color="#354F52" />
          </View>
          <Text
            className="text-base text-[#2F4F4F]"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          >
            {data.room || 'Not selected'}
          </Text>
        </View>
      </ReviewCard>

      {/* Environment (Agora usa o Componente Dedicado) */}
      <ScenarioReviewCard
        environment={environment}
        onEdit={() => onJumpToStep(4)}
      />

      {/* Activity Info */}
      <ReviewCard label="Activity Info" onEdit={() => onJumpToStep(5)}>
        <View className="flex-row items-center">
          {data.activityImage ? (
            <Image
              source={{ uri: data.activityImage }}
              className="w-20 h-24 rounded-xl"
            />
          ) : (
            <View className="w-20 h-24 rounded-xl bg-[#C8E2C8] justify-center items-center">
              <MaterialIcons
                name="image-not-supported"
                size={24}
                color="#354F52"
              />
            </View>
          )}

          <View className="flex-1 ml-3">
            <Text
              className="text-[15px] text-[#2F4F4F]"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              {data.activityName || 'Untitled Activity'}
            </Text>
            <Text
              className="text-[13px] text-[#6A7D5B] mt-1"
              style={{ fontFamily: 'Nunito_400Regular' }}
              numberOfLines={3}
            >
              {data.description || 'No description provided.'}
            </Text>
          </View>
        </View>
      </ReviewCard>
    </StepWrapper>
  );
};
