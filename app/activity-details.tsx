import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ContentSection } from '@/components/activityDetails/ContentSection';
import { DeviceSection } from '@/components/activityDetails/DeviceSection';
import { FocusSection } from '@/components/activityDetails/FocusSection';
import { MediaSection } from '@/components/activityDetails/MediaSection';
import { ActivityHeader } from '../components/activityDetails/ActivityHeader';

import {
  ACTIVITIES,
  Activity,
  Content,
  CONTENTS,
  Scenario,
  ScenarioDeviceState,
  SCENARIOS,
} from '@/constants/data';
import { SMART_HOME_DEVICES } from '@/constants/devices';

export default function ActivityDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [mainItem, setMainItem] = useState<Activity | Scenario | null>(null);
  const [relatedScenario, setRelatedScenario] = useState<Scenario | null>(null);
  const [relatedContent, setRelatedContent] = useState<Content | null>(null);
  const [focusEnabled, setFocusEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const isActivity = mainItem ? 'type' in mainItem : false;

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      let foundActivity = ACTIVITIES.find((a) => a.id === id);

      if (!foundActivity) {
        const stored = await AsyncStorage.getItem('@myActivities');
        if (stored) {
          const userActivities: Activity[] = JSON.parse(stored);
          foundActivity = userActivities.find((a) => a.id === id);
        }
      }

      if (foundActivity) {
        setMainItem(foundActivity);
        if (foundActivity.scenarioId) {
          const scen = SCENARIOS.find((s) => s.id === foundActivity.scenarioId);
          setRelatedScenario(scen || null);
          if (scen) setFocusEnabled(scen.focusMode);
        }
        if (foundActivity.contentId) {
          const cont = CONTENTS[foundActivity.contentId];
          setRelatedContent(cont || null);
        }
      } else {
        const foundScenario = SCENARIOS.find((s) => s.id === id);
        if (foundScenario) {
          setMainItem(foundScenario);
          setRelatedScenario(foundScenario);
          setFocusEnabled(foundScenario.focusMode);
        }
      }
      setLoading(false);
    };
    loadData();
  }, [id]);

  if (loading)
    return (
      <View className="flex-1 justify-center items-center bg-[#F0F2EB]">
        <ActivityIndicator size="large" color="#548F53" />
      </View>
    );
  if (!mainItem)
    return (
      <View className="flex-1 justify-center items-center bg-[#F0F2EB]">
        <Text>Item not found</Text>
      </View>
    );

  const imageSource =
    typeof mainItem.image === 'string'
      ? { uri: mainItem.image }
      : mainItem.image;

  const devicesToShow: ScenarioDeviceState[] =
    relatedScenario?.devices || (mainItem as Scenario).devices || [];

  const activeSpeakerConfig = devicesToShow.find((config) => {
    const device = SMART_HOME_DEVICES[config.deviceId];
    return device?.type === 'speaker';
  });

  const audioStatusText = activeSpeakerConfig
    ? `Playlist will be played on ${SMART_HOME_DEVICES[activeSpeakerConfig.deviceId].name}`
    : 'Playlist will be played';

  const instructions = relatedContent?.instructions || [];
  const ingredients =
    relatedContent?.type === 'recipe' ? relatedContent.ingredients : [];
  const displayTime = isActivity
    ? relatedContent?.duration || 'Duration N/A'
    : null;

  return (
    <View className="flex-1 bg-[#F0F2EB]">
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <ActivityHeader
          imageSource={imageSource}
          type={isActivity ? (mainItem as Activity).type : 'Scenario'}
          title={mainItem.title}
          room={mainItem.room}
          duration={displayTime}
          isActivity={isActivity}
        />

        <View className="px-6 pt-8">
          <DeviceSection devices={devicesToShow} />
          <View className="mb-8">
            <Text
              className="text-[#354F52] text-xl mb-2"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              Description
            </Text>
            <Text
              className="text-[#586963] text-[16px] leading-6"
              style={{ fontFamily: 'Nunito_400Regular' }}
            >
              {mainItem.description}
            </Text>
          </View>

          <FocusSection enabled={focusEnabled} onToggle={setFocusEnabled} />
          <MediaSection
            isVisible={
              !!(relatedScenario?.playlist || relatedContent?.videoUrl)
            }
            title={relatedScenario?.playlist || relatedContent?.title}
            subtitle={audioStatusText}
          />
          <ContentSection
            ingredients={ingredients}
            instructions={instructions}
          />
        </View>
      </ScrollView>
      <View className="absolute bottom-10 left-0 right-0 items-center px-5">
        <TouchableOpacity
          activeOpacity={0.9}
          className="bg-[#548F53] w-72 py-4 rounded-full flex-row items-center justify-center shadow-lg shadow-[#548F53]/40"
          onPress={() =>
            router.push({
              pathname: '/LoadingActivity',
              params: {
                id: mainItem.id,
                title: mainItem.title,
                type: isActivity ? 'activity' : 'scenario',
                focusMode: focusEnabled.toString(),
              },
            })
          }
        >
          <Text
            className="text-white text-2xl mr-2"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            {isActivity ? 'Start Activity' : 'Activate Scenario'}
          </Text>
          <Ionicons
            name={isActivity ? 'play' : 'power'}
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}
