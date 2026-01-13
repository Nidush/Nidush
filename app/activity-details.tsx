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
import { CustomAlert } from '@/components/CustomAlert';
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

// 1. DEFINIÇÃO DO TIPO PARA O ESTADO DO ALERTA
type AlertConfigState = {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  isDestructive: boolean;
  onConfirm?: () => void;
};

export default function ActivityDetails() {
  const { id, isNew } = useLocalSearchParams<{ id: string; isNew?: string }>();

  const [mainItem, setMainItem] = useState<Activity | Scenario | null>(null);
  const [relatedScenario, setRelatedScenario] = useState<Scenario | null>(null);
  const [relatedContent, setRelatedContent] = useState<Content | null>(null);
  const [focusEnabled, setFocusEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);

  const isActivity = mainItem ? 'type' in mainItem : false;

  // 2. CORREÇÃO DO USESTATE (Adicionado <AlertConfigState>)
  const [alertConfig, setAlertConfig] = useState<AlertConfigState>({
    visible: false,
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    isDestructive: false,
    onConfirm: undefined,
  });

  // Notificação de "Atividade Criada"
  useEffect(() => {
    // Restaurada a condição para só mostrar se for nova
    if (isNew === 'true') {
      setShowToast(true);
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  // Carregamento de Dados
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

  const handleCustomBack = () => {
    if (isNew === 'true') {
      router.navigate('/Activities');
    } else {
      router.back();
    }
  };

  const closeAlert = () =>
    setAlertConfig((prev) => ({ ...prev, visible: false }));

  // Handlers do Menu
  const handleAddToShortcuts = () => {
    setAlertConfig({
      visible: true,
      title: 'Shortcuts',
      message: 'Shortcuts feature coming soon!',
      confirmText: 'OK',
      cancelText: '',
      isDestructive: false,
      onConfirm: undefined,
    });
  };

  const handleEditActivity = () => {
    setAlertConfig({
      visible: true,
      title: 'Edit',
      message: 'Edit feature coming soon!',
      confirmText: 'OK',
      cancelText: '',
      isDestructive: false,
      onConfirm: undefined,
    });
  };

  const handleDeleteActivity = () => {
    setAlertConfig({
      visible: true,
      title: 'Delete Activity',
      message:
        'Are you sure you want to delete this activity? This action cannot be undone.',
      confirmText: 'Delete',
      cancelText: 'Cancel',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const stored = await AsyncStorage.getItem('@myActivities');
          if (stored) {
            const activities: Activity[] = JSON.parse(stored);
            const updatedActivities = activities.filter((a) => a.id !== id);
            await AsyncStorage.setItem(
              '@myActivities',
              JSON.stringify(updatedActivities),
            );
            router.navigate('/(tabs)');
          }
        } catch (e) {
          console.log('Error while trying to delete', e);
        }
      },
    });
  };

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
    <View className="flex-1 bg-[#F0F2EB] relative">
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
          onBack={handleCustomBack}
          onAddToShortcuts={handleAddToShortcuts}
          onEdit={handleEditActivity}
          onDelete={handleDeleteActivity}
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

      {/* Botão de Start */}
      <View className="absolute bottom-10 left-0 right-0 items-center px-5 z-0">
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

      {/* Notificação Toast */}
      {showToast && (
        <View
          className="absolute top-14 left-5 right-5 bg-[#F0F2EB] p-4 rounded-2xl shadow-lg flex-row justify-between items-center z-50 border border-[#E8F3E8]"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          }}
        >
          <View className="w-10 h-10 bg-[#548F53] rounded-full justify-center items-center mr-5">
            <Ionicons name="checkmark" size={24} color="white" />
          </View>
          <View className="flex-1">
            <Text
              className="text-[#2F4F4F] text-lg"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              Activity created successfully!
            </Text>
          </View>
        </View>
      )}

      {/* Alerta Personalizado */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        confirmText={alertConfig.confirmText}
        cancelText={alertConfig.cancelText}
        isDestructive={alertConfig.isDestructive}
        onConfirm={alertConfig.onConfirm}
        onClose={closeAlert}
      />
    </View>
  );
}
