import { Ionicons } from '@expo/vector-icons';
import { supabase, apiLog } from '@/utils/supabase';

import { router, Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

import { ActivityHeader } from '@/components/activityDetails/ActivityHeader';
import { ContentSection } from '@/components/activityDetails/ContentSection';
import { DeviceSection } from '@/components/activityDetails/DeviceSection';
import { FocusSection } from '@/components/activityDetails/FocusSection';
import { MediaSection } from '@/components/activityDetails/MediaSection';
import { CustomAlert } from '@/components/CustomAlert';

import {
  Activity,
  Content,
  CONTENTS,
  Scenario,
  ScenarioDeviceState,
} from '@/constants/data';
import { resolveCatalogImage } from '@/constants/data/catalogAssets';
import { SMART_HOME_DEVICES } from '@/constants/devices';
import {
  fetchActivityTemplateById,
  fetchScenarioTemplateById,
  mapUserActivity,
} from '@/utils/catalogTemplates';

type AlertConfigState = {
  visible: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  isDestructive: boolean;
  onConfirm?: () => void;
};

type ShortcutRow = {
  id: number;
  displayorder: number;
  activity_idactivity: number | null;
  scenario_idscenario: number | null;
  user_id: string | null;
};

export default function ActivityDetails() {
  const { id, isNew } = useLocalSearchParams<{ id: string; isNew?: string }>();

  const [mainItem, setMainItem] = useState<Activity | Scenario | null>(null);
  const [relatedScenario, setRelatedScenario] = useState<Scenario | null>(null);
  const [relatedContent, setRelatedContent] = useState<Content | null>(null);
  const [focusEnabled, setFocusEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isUpdatingShortcut, setIsUpdatingShortcut] = useState(false);

  const isActivity = mainItem ? 'type' in mainItem : false;

  const [alertConfig, setAlertConfig] = useState<AlertConfigState>({
    visible: false,
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Cancel',
    isDestructive: false,
    onConfirm: undefined,
  });

  useEffect(() => {
    if (isNew === 'true') {
      setToastMessage('Atividade criada com sucesso!');
      setShowToast(true);
      AccessibilityInfo.announceForAccessibility(
        'Atividade criada com sucesso!',
      );
      const timer = setTimeout(() => {
        setShowToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [isNew]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      let foundActivity = await fetchActivityTemplateById(id);

      if (!foundActivity) {
        apiLog('SELECT', 'activities', { id });
        const { data, error } = await supabase
          .from('activities')
          .select('*')
          .eq('id', id)
          .single();

          
        if (data && !error) {
          foundActivity = mapUserActivity(data);
        }
      }

      if (foundActivity) {
        const shortcutPromise = (async () => {
          if (String(foundActivity.id).startsWith('template:')) {
            return foundActivity.shortcuts;
          }

          const { data: { user } } = await supabase.auth.getUser();
          const activityId = Number(foundActivity.id);

          if (user && Number.isFinite(activityId)) {
            const { data: shortcutData, error: shortcutError } = await supabase
              .from('shortcuts')
              .select('id')
              .eq('user_id', user.id)
              .eq('activity_idactivity', activityId)
              .maybeSingle();

            if (!shortcutError) {
              return Boolean(shortcutData);
            }
          }

          return foundActivity.shortcuts;
        })();

        const scenarioPromise = foundActivity.scenario_id
          ? (async () => {
              let scen = await fetchScenarioTemplateById(foundActivity.scenario_id!);

              if (!scen) {
                console.log('[ActivityDetails] Fetching scenario from DB:', foundActivity.scenario_id);
                const { data: scenData } = await supabase
                  .from('scenarios')
                  .select('*')
                  .eq('id', foundActivity.scenario_id)
                  .maybeSingle();

                if (scenData) {
                  scen = {
                    id: scenData.id.toString(),
                    title: scenData.name,
                    description: scenData.description || '',
                    playlist: scenData.playlist_id ? 'Spotify Music' : (scenData.playlist_name || 'No music'),
                    playlist_id: scenData.playlist_id,
                    focusMode: false, // Default fallback
                    shortcuts: false,
                    devices: [], // Fallback
                    image: { uri: 'https://picsum.photos/200' } // Fallback
                  } as Scenario;
                }
              }

              return scen || null;
            })()
          : Promise.resolve(null);

        const contentPromise = foundActivity.content_id
          ? (async () => {
              const localContent = CONTENTS[foundActivity.content_id as any];
              const { data: contentRows, error: contentError } = await supabase
                .from('contents')
                .select('*')
                .eq('id', foundActivity.content_id)
                .limit(1);

              if (contentRows && contentRows.length > 0 && !contentError) {
                const contentData = contentRows[0];
                return {
                  id: contentData.id,
                  title: contentData.title,
                  type: contentData.type,
                  category: contentData.category,
                  description: contentData.description,
                  duration: contentData.duration,
                  image: resolveCatalogImage(contentData.image || localContent?.image),
                  instructions: contentData.instructions || localContent?.instructions,
                  ingredients: contentData.ingredients || localContent?.ingredients,
                  videoUrl: localContent?.videoUrl || contentData.video_url,
                  author: contentData.author || localContent?.author,
                } as Content;
              }

              return localContent || null;
            })()
          : Promise.resolve(null);

        const [shortcutValue, scen, content] = await Promise.all([
          shortcutPromise,
          scenarioPromise,
          contentPromise,
        ]);
        const activityWithShortcut = { ...foundActivity, shortcuts: shortcutValue };

        setMainItem(activityWithShortcut);
        setRelatedScenario(scen);
        setRelatedContent(content);
        if (scen) setFocusEnabled(scen.focusMode);
      } else {
        const foundScenario = await fetchScenarioTemplateById(id);
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

  const handleStartPress = () => {
    if (!mainItem) return;

    // Permitir todas as atividades e cenários avançarem para o ecrã de execução
    if (mainItem) {
      // 🎵 Removido daqui para tocar apenas no ecrã de exercício (como pedido)
      router.push({
        pathname: '/LoadingActivity',
        params: {
          id: mainItem.id,
          title: mainItem.title,
          type: isActivity ? 'activity' : 'scenario',
          focusMode: focusEnabled.toString(),
        },
      });
    } else {
      setAlertConfig({
        visible: true,
        title: 'Error',
        message: 'Could not load item details. Please try again.',
        confirmText: 'OK',
        cancelText: '',
        isDestructive: false,
        onConfirm: undefined,
      });
    }
  };

  const handleAddToShortcuts = async () => {
    const activityId = String(id);

    if (isUpdatingShortcut) return;

    if (!isActivity || activityId.startsWith('template:')) {
      setAlertConfig({
        visible: true,
        title: 'Shortcuts',
        message: 'Only your own created activities can be added to shortcuts.',
        confirmText: 'OK',
        cancelText: '',
        isDestructive: false,
        onConfirm: undefined,
      });
      return;
    }

    const activity = mainItem as Activity;
    const nextShortcutValue = !activity.shortcuts;
    const numericActivityId = Number(activityId);

    if (!Number.isFinite(numericActivityId)) {
      setAlertConfig({
        visible: true,
        title: 'Shortcuts',
        message: 'Could not identify this activity in the shortcuts table.',
        confirmText: 'OK',
        cancelText: '',
        isDestructive: false,
        onConfirm: undefined,
      });
      return;
    }

    try {
      setIsUpdatingShortcut(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      apiLog(nextShortcutValue ? 'INSERT' : 'DELETE', 'shortcuts', {
        id: activityId,
        activity_idactivity: numericActivityId,
        user_id: user.id,
      });

      if (nextShortcutValue) {
        const { data: existingShortcut, error: existingError } = await supabase
          .from('shortcuts')
          .select('id')
          .eq('user_id', user.id)
          .eq('activity_idactivity', numericActivityId)
          .maybeSingle();

        if (existingError) throw existingError;

        if (!existingShortcut) {
          const { data: orderRows, error: orderError } = await supabase
            .from('shortcuts')
            .select('displayorder')
            .eq('user_id', user.id)
            .order('displayorder', { ascending: false })
            .limit(1);

          if (orderError) throw orderError;

          const nextDisplayOrder =
            ((orderRows?.[0] as Pick<ShortcutRow, 'displayorder'> | undefined)?.displayorder ?? 0) + 1;

          const { error: insertError } = await supabase
            .from('shortcuts')
            .insert({
              user_id: user.id,
              activity_idactivity: numericActivityId,
              scenario_idscenario: null,
              displayorder: nextDisplayOrder,
            });

          if (insertError) throw insertError;
        }
      } else {
        const { error: deleteError } = await supabase
          .from('shortcuts')
          .delete()
          .eq('activity_idactivity', numericActivityId)
          .eq('user_id', user.id);

        if (deleteError) throw deleteError;
      }

      setMainItem({
        ...activity,
        shortcuts: nextShortcutValue,
      });

      const { error: mirrorError } = await supabase
        .from('activities')
        .update({ shortcuts: nextShortcutValue })
        .eq('id', numericActivityId)
        .eq('user_id', user.id)
        .select('id')
        .maybeSingle();

      if (mirrorError) {
        console.warn('Shortcut saved, but activities.shortcuts mirror was not updated:', mirrorError);
      }

      setShowToast(true);
      setToastMessage(
        nextShortcutValue
          ? 'Atividade adicionada aos shortcuts.'
          : 'Atividade removida dos shortcuts.',
      );
      AccessibilityInfo.announceForAccessibility(
        nextShortcutValue
          ? 'Atividade adicionada aos shortcuts.'
          : 'Atividade removida dos shortcuts.',
      );

      if (nextShortcutValue) {
        router.navigate('/(tabs)');
      } else {
        setTimeout(() => setShowToast(false), 3000);
      }
    } catch (error: any) {
      console.error('Failed to update shortcuts:', error);
      setAlertConfig({
        visible: true,
        title: 'Shortcuts',
        message: error?.message
          ? `Could not update shortcuts: ${error.message}`
          : 'Could not update shortcuts. Please try again.',
        confirmText: 'OK',
        cancelText: '',
        isDestructive: false,
        onConfirm: undefined,
      });
    } finally {
      setIsUpdatingShortcut(false);
    }
  };

  const handleEditActivity = () => {
    if (!isActivity || String(id).startsWith('template:')) {
      setAlertConfig({
        visible: true,
        title: 'Edit',
        message: 'Only your own created activities can be edited.',
        confirmText: 'OK',
        cancelText: '',
        isDestructive: false,
        onConfirm: undefined,
      });
      return;
    }

    router.push({
      pathname: '/new-activity',
      params: { editId: id },
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
          // Deletar a atividade na nuvem do Supabase
          apiLog('DELETE', 'activities', { id });
          const { error } = await supabase.from('activities').delete().eq('id', id);



          if (error) throw error;
          
          router.navigate('/Activities');
        } catch (e) {
          console.log('Error while trying to delete', e);
        }
      },
    });
  };

  if (loading)
    return (
      <View className="flex-1 justify-center items-center bg-[#F0F2EB]">
        <ActivityIndicator
          size="large"
          color="#548F53"
          accessibilityLabel="Loading activity details"
        />
      </View>
    );

  if (!mainItem)
    return (
      <View className="flex-1 justify-center items-center bg-[#F0F2EB]">
        <Text maxFontSizeMultiplier={1.2}  accessibilityRole="header">Item not found</Text>
      </View>
    );

  const imgObj = mainItem.image || relatedContent?.image;
  const isNumeric = typeof imgObj === 'string' && /^\d+$/.test(imgObj);
  const imageSource = isNumeric
    ? { uri: `https://picsum.photos/seed/${imgObj}/400/600` }
    : typeof imgObj === 'string'
      ? { uri: imgObj }
      : imgObj || { uri: 'https://picsum.photos/400/600' };

  const devicesToShow: ScenarioDeviceState[] =
    relatedScenario?.devices || (mainItem as Scenario).devices || [];

  const activeSpeakerConfig = devicesToShow.find((config) => {
    const device = SMART_HOME_DEVICES[config.deviceId];
    return device?.type === 'speaker';
  });

  const audioStatusText = activeSpeakerConfig
    ? `Playlist will be played on ${SMART_HOME_DEVICES[activeSpeakerConfig.deviceId].name}`
    : 'Playlist will be played';

  // Helper: parse JSON safely (handles strings, arrays, objects)
  const safeParse = (value: any): any => {
    if (!value) return [];
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return []; }
    }
    return value;
  };

  // Instructions: can be JSON string (from API), array of strings, or array of {text, duration}
  const rawInstructions = safeParse(relatedContent?.instructions);
  const instructions: any[] = Array.isArray(rawInstructions)
    ? rawInstructions.map((s: any) => typeof s === 'string' ? s : s?.text || '')
    : [];

  // Ingredients: API format is ["400g Pasta", "100g Bacon"], ContentSection expects [{item, amount}]
  const rawIngredients = safeParse(relatedContent?.ingredients);
  const ingredients = relatedContent?.type === 'recipe' && Array.isArray(rawIngredients)
    ? rawIngredients.map((s: any) => {
        if (typeof s === 'object' && s?.item) return s; // Already {item, amount} format
        // API format: "400g Pasta" → split on first space
        const str = String(s);
        const spaceIdx = str.indexOf(' ');
        if (spaceIdx === -1) return { item: str, amount: '' };
        return { amount: str.slice(0, spaceIdx), item: str.slice(spaceIdx + 1) };
      })
    : [];

  const displayTime = isActivity
    ? relatedContent?.duration || null
    : null;

  return (
    <View
      className="flex-1 bg-[#F0F2EB] relative"
      accessibilityLanguage="en-US"
    >
      <Stack.Screen
        options={{
          // Se já carregou, diz o nome da atividade. Se não, diz "Loading"
          title: mainItem ? mainItem.title : 'Activity details',
          headerShown: false, // Mantém o teu cabeçalho customizado (ActivityHeader) e esconde o nativo
        }}
      />
      <ScrollView
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        accessible={true}
      >
        <ActivityHeader
          imageSource={imageSource}
          type={isActivity ? (mainItem as Activity).type : 'Scenario'}
          title={mainItem.title}
          room={(mainItem as any).room_id || (mainItem as any).room}
          duration={displayTime}
          isActivity={isActivity}
          onBack={handleCustomBack}
          onAddToShortcuts={handleAddToShortcuts}
          onEdit={handleEditActivity}
          onDelete={handleDeleteActivity}
          isShortcut={isActivity ? (mainItem as Activity).shortcuts : false}
          isUpdatingShortcut={isUpdatingShortcut}
        />

        <View className="px-6 pt-8">
          <DeviceSection devices={devicesToShow} />
          <View className="mb-8">
            <Text
              maxFontSizeMultiplier={1.2}
              className="text-[#354F52] text-xl mb-2"
              style={{ fontFamily: 'Nunito_700Bold' }}
              accessibilityRole="header"
            >
              Description
            </Text>
            <Text
              maxFontSizeMultiplier={1.2}
              className="text-[#586963] text-[16px] leading-6"
              style={{ fontFamily: 'Nunito_400Regular' }}
            >
              {mainItem.description}
            </Text>
          </View>

          <FocusSection enabled={focusEnabled} onToggle={setFocusEnabled} />
          <MediaSection
            isVisible={
              !!(relatedScenario?.playlist || relatedContent?.videoUrl || ['workout', 'cooking', 'meditation'].includes((mainItem as any).type?.toLowerCase()))
            }
            title={relatedScenario?.playlist || relatedContent?.title || (
              (mainItem as any).type?.toLowerCase() === 'workout' ? 'Workout Beats' :
              (mainItem as any).type?.toLowerCase() === 'cooking' ? 'Cooking Vibes' :
              (mainItem as any).type?.toLowerCase() === 'meditation' ? 'Nature Sounds' : 'Recommended Music'
            )}
            subtitle={audioStatusText}
          />
          <ContentSection
            ingredients={ingredients}
            instructions={instructions}
          />
        </View>
      </ScrollView>

      <View className="absolute bottom-10 left-0 right-0 items-center px-5 z-0">
        <TouchableOpacity
          activeOpacity={0.9}
          className="bg-[#548F53] w-72 py-4 rounded-full flex-row items-center justify-center shadow-lg shadow-[#548F53]/40"
          onPress={handleStartPress}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel={
            isActivity
              ? `Start activity: ${mainItem.title}`
              : `Activate scenario: ${mainItem.title}`
          }
        >
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-white text-2xl mr-2"
            style={{ fontFamily: 'Nunito_700Bold' }}
            importantForAccessibility="no-hide-descendants" // REDUÇÃO RUÍDO
            accessibilityElementsHidden={true}
          >
            {isActivity ? 'Start Activity' : 'Activate Scenario'}
          </Text>
          <Ionicons
            name={isActivity ? 'play' : 'power'}
            size={24}
            color="white"
            importantForAccessibility="no" // REDUÇÃO RUÍDO
            accessibilityElementsHidden={true}
          />
        </TouchableOpacity>
      </View>

      {showToast && (
        <View
          className="absolute top-14 left-5 right-5 bg-[#F0F2EB] p-4 rounded-2xl shadow-lg flex-row justify-between items-center z-50 border border-[#E8F3E8]"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.1,
            shadowRadius: 8,
          }}
          accessible={false}
          importantForAccessibility="no-hide-descendants"
        >
          <View className="w-10 h-10 bg-[#548F53] rounded-full justify-center items-center mr-5">
            <Ionicons name="checkmark" size={24} color="white" />
          </View>
          <View className="flex-1">
            <Text 
              maxFontSizeMultiplier={1.2}
              className="text-[#2F4F4F] text-lg"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              {toastMessage}
            </Text>
          </View>
        </View>
      )}

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
