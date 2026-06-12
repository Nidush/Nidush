import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, ImageSourcePropType, Platform, StyleSheet, Text, View } from 'react-native';
import { getRoomIconName } from '@/utils/roomIcons';
import { ReviewCard } from '../ReviewCard';
import { ScenarioReviewCard } from '../ScenarioReviewCard';
import { StepWrapper } from '../StepWrapper';

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
      image: ImageSourcePropType;
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
    activityImage: ImageSourcePropType | string | null;
  };
  onJumpToStep: (step: number) => void;
}

const getActivityIcon = (type: string) => {
  const lowerType = type ? type.toLowerCase() : '';
  const props = { size: 24, color: '#354F52' };

  if (
    lowerType.includes('cook') ||
    lowerType.includes('eat') ||
    lowerType.includes('chef')
  ) {
    return <MaterialCommunityIcons name="chef-hat" {...props} />;
  }

  let iconName: keyof typeof MaterialIcons.glyphMap = 'category';

  if (lowerType.includes('meditat') || lowerType.includes('relax'))
    iconName = 'self-improvement';
  else if (
    lowerType.includes('exercise') ||
    lowerType.includes('work') ||
    lowerType.includes('fit')
  )
    iconName = 'fitness-center';
  else if (
    lowerType.includes('read') ||
    lowerType.includes('book') ||
    lowerType.includes('study')
  )
    iconName = 'menu-book';
  else if (lowerType.includes('sleep') || lowerType.includes('nap'))
    iconName = 'bedtime';
  else if (lowerType.includes('focus')) iconName = 'center-focus-strong';

  return <MaterialIcons name={iconName} {...props} />;
};

const getRoomIcon = (room: string) => {
  const props = { size: 24, color: '#354F52' };
  return <MaterialIcons name={getRoomIconName(room)} {...props} />;
};

export const Step6_Review = ({ data, onJumpToStep }: Step6Props) => {
  const { content, environment } = data;

  const activityImageSource = React.useMemo(() => {
    if (!data.activityImage || data.activityImage === '') return null;
    if (typeof data.activityImage === 'string')
      return { uri: data.activityImage };
    return data.activityImage;
  }, [data.activityImage]);

  return (
    <StepWrapper
      title="Review and save"
      subtitle="See if everything is right and save your new activity."
    >
      <ReviewCard label="Activity Type" onEdit={() => onJumpToStep(1)}>
        <View
          className="flex-row items-center"
          accessible={true}
          accessibilityLabel={`Selected activity type: ${data.activityType || 'Not selected'}`}
        >
          <View
            className="w-11 h-11 rounded-lg bg-[#C8E2C8] justify-center items-center mr-3"
            importantForAccessibility="no-hide-descendants"
          >
            {getActivityIcon(data.activityType)}
          </View>
          <Text
            className="text-lg text-[#2F4F4F] capitalize pr-1"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          >
            {data.activityType || 'Not selected'}
          </Text>
        </View>
      </ReviewCard>

      <ReviewCard label="Contents" onEdit={() => onJumpToStep(2)}>
        {content && content.image ? (
          <View
            className="w-full h-[120px] relative rounded-xl overflow-hidden bg-gray-900"
            accessible={true}
            accessibilityLabel={`${content.title}, Type: ${content.type}, Duration: ${content.duration}`}
          >
            <View
              style={StyleSheet.absoluteFill}
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden={true}
            >
              <Image
                source={content.image}
                className="w-full h-full"
                resizeMode="cover"
                blurRadius={Platform.OS === 'ios' ? 70 : 50}
              />
              <View className="absolute inset-0" />
            </View>

            <MaskedView
              style={StyleSheet.absoluteFill}
              importantForAccessibility="no"
              accessibilityElementsHidden={true}
              maskElement={
                <LinearGradient
                  colors={['black', 'black', 'transparent']}
                  locations={[0, 0.1, 0.5]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                />
              }
            >
              <Image
                source={content.image}
                className="w-full h-full"
                resizeMode="cover"
              />
            </MaskedView>

            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
              locations={[0.4, 0.7, 1]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />

            <View
              className="absolute bottom-0 w-full p-3 z-30"
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden={true}
            >
              <Text
                maxFontSizeMultiplier={1.2}
                className="text-white text-lg leading-tight mb-2"
                style={{ fontFamily: 'Nunito_700Bold' }}
                numberOfLines={2}
              >
                {content.title}
              </Text>

              <View className="flex-row items-center gap-3 opacity-95">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="time-outline" size={16} color="white" />
                  <Text
                    maxFontSizeMultiplier={1.2}
                    className="text-white text-md"
                    style={{ fontFamily: 'Nunito_600SemiBold' }}
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
                    size={16}
                    color="white"
                  />
                  <Text
                    maxFontSizeMultiplier={1.2}
                    className="text-white text-md capitalize"
                    style={{ fontFamily: 'Nunito_600SemiBold' }}
                  >
                    {content.type}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        ) : (
          <Text  maxFontSizeMultiplier={1.2} className="text-gray-400 italic">No content selected</Text>
        )}
      </ReviewCard>

      <ReviewCard label="Room" onEdit={() => onJumpToStep(3)}>
        <View
          className="flex-row items-center"
          accessible={true}
          accessibilityLabel={`Selected room: ${data.room || 'Not selected'}`}
        >
          <View
            className="w-11 h-11 rounded-lg bg-[#C8E2C8] justify-center items-center mr-3"
            importantForAccessibility="no-hide-descendants"
          >
            {getRoomIcon(data.room)}
          </View>
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-lg text-[#2F4F4F]"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          >
            {data.room || 'Not selected'}
          </Text>
        </View>
      </ReviewCard>

      <ScenarioReviewCard
        environment={environment}
        onEdit={() => onJumpToStep(4)}
      />

      <ReviewCard label="Activity Info" onEdit={() => onJumpToStep(5)}>
        <View
          className="flex-row items-center"
          accessible={true}
          accessibilityLabel={`Activity name: ${data.activityName || 'Untitled Activity'}. Description: ${data.description || 'No description provided'}`}
        >
          <View
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden={true}
          >
            {activityImageSource ? (
              <Image
                source={activityImageSource}
                className="w-20 h-20 rounded-xl"
                resizeMode="cover"
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
          </View>

          <View
            className="flex-1 ml-3"
            importantForAccessibility="no-hide-descendants"
            accessibilityElementsHidden={true}
          >
            <Text
              maxFontSizeMultiplier={1.2}
              className="text-[15px] text-[#2F4F4F]"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              {data.activityName || 'Untitled Activity'}
            </Text>
            <Text
              maxFontSizeMultiplier={1.2}
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
