import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useFocusEffect } from 'expo-router';
import React, { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Animated, PanResponder, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UnifiedCard } from '@/components/activitiesScenarios/UnifiedCard';
import { CarouselSection } from '../../components/activitiesScenarios/CarouselSection';
import { HomeHeader } from '../../components/Homepage/HomeHeader';
import { StateWidget } from '../../components/Homepage/StateWidget';

import { CONTENTS, Activity } from '@/constants/data';
import { resolveCatalogImage } from '@/constants/data/catalogAssets';
import { useBiometrics } from '@/context/BiometricsContext';
import {
  AiActivityIdea,
  fetchAiActivityIdeas,
  getNidushAiErrorMessage,
  isAiRateLimitError,
  saveAiActivityIdea,
} from '@/utils/aiActivities';
import { isAiAutoInvocationEnabled } from '@/utils/aiConfig';
import { logger } from '@/utils/logger';
import { getDynamicRecommendations } from '@/utils/recommendationEngine';
import { getSessionUser, supabase } from '@/utils/supabase';
import {
  fetchActivityTemplates,
  mapUserActivity,
} from '@/utils/catalogTemplates';

type ShortcutRow = {
  id: number;
  displayorder: number;
  activity_idactivity: number | null;
  scenario_idscenario: number | null;
  user_id: string | null;
};

type ShortcutLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type CarouselActivity = Activity & {
  time?: string;
  room?: string;
  onPress?: () => void;
};

const getContentDuration = (contentId: string | undefined) => {
  if (!contentId) return undefined;
  return CONTENTS[contentId]?.duration;
};

const getActivityRoomLabel = (item: Activity) => item.room || item.room_id;

const parseHobbies = (value: unknown) => {
  if (!value) return [];

  const raw = Array.isArray(value) ? value.join(',') : String(value);
  return Array.from(
    new Set(
      raw
        .replace(/[\[\]"]/g, '')
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  );
};

export default function Index() {
  const [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Nunito_600SemiBold,
    Nunito_400Regular,
  });

  const { currentState } = useBiometrics();
  const [userName, setUserName] = useState('...');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [myActivities, setMyActivities] = useState<Activity[]>([]);
  const [activityTemplates, setActivityTemplates] = useState<Activity[]>([]);
  const [shortcutRows, setShortcutRows] = useState<ShortcutRow[]>([]);
  const [userHobbies, setUserHobbies] = useState<string[]>([]);
  const [aiHomeIdeas, setAiHomeIdeas] = useState<AiActivityIdea[]>([]);
  const [isLoadingAiHomeIdeas, setIsLoadingAiHomeIdeas] = useState(false);
  const [isSavingAiHomeIdeaId, setIsSavingAiHomeIdeaId] = useState<string | null>(null);
  const [isEditingShortcuts, setIsEditingShortcuts] = useState(false);
  const [isSavingShortcutOrder, setIsSavingShortcutOrder] = useState(false);
  const [draggingShortcutId, setDraggingShortcutId] = useState<number | null>(null);
  const shortcutDragOffsets = useRef(new Map<number, Animated.ValueXY>()).current;
  const shortcutLayoutsRef = useRef<Record<number, ShortcutLayout>>({});
  const lastAiHomeIdeasRequestKeyRef = useRef<string | null>(null);


  // O userName deve ser atualizado quando ganhamos foco também
  const fetchUserName = useCallback(async () => {
    try {
      const user = await getSessionUser();
      
      if (user) {
        setAvatarUrl(user.user_metadata?.avatar_url || null);
        setUserName(user.user_metadata?.first_name || user.email?.split('@')[0] || 'User');

        // Buscar hobbies da tabela users
        const { data: dbUser } = await supabase
          .from('users')
          .select('hobbies')
          .eq('email', user.email)
          .maybeSingle();

        if (dbUser?.hobbies) {
          const raw = Array.isArray(dbUser.hobbies) ? dbUser.hobbies.join(',') : String(dbUser.hobbies);
          const hooks = raw.replace(/[\[\]"]/g, '').split(',').map((s: string) => s.trim()).filter(Boolean);
          setUserHobbies(Array.from(new Set(hooks)));
        }
      } else {
        setUserName('Visitante');
      }

    } catch (e) {
      console.error('Error fetching user name:', e);
      setUserName('Visitante');
    }
  }, []);

  useEffect(() => {
    fetchUserName();

    // Listener para mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setAvatarUrl(session.user.user_metadata?.avatar_url || null);
        setUserName(session.user.user_metadata?.first_name || session.user.email?.split('@')[0] || 'User');
      } else {
        setAvatarUrl(null);
        setUserName('Visitante');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchUserName]);

  useFocusEffect(
    useCallback(() => {
      const loadActivities = async () => {
        const user = await getSessionUser();

        if (!user) {
          setMyActivities([]); // Importante: Limpar se não houver user
          setShortcutRows([]);
          setUserHobbies([]);
          setAvatarUrl(null);
          setUserName('Visitante');
          return;
        }

        // Atualizar o nome também por precaução
        setAvatarUrl(user.user_metadata?.avatar_url || null);
        setUserName(user.user_metadata?.first_name || user.email?.split('@')[0] || 'User');
        
        let [
          homeAssocResult,
          activitiesResult,
          shortcutsResult,
          userResult,
        ] = await Promise.all([
          supabase
            .from('user_homes')
            .select('home_id')
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('activities')
            .select('*, rooms(name)')
            .order('created_at', { ascending: false }),
          supabase
            .from('shortcuts')
            .select('id, displayorder, activity_idactivity, scenario_idscenario, user_id')
            .eq('user_id', user.id)
            .order('displayorder', { ascending: true }),
          supabase
            .from('users')
            .select('hobbies')
            .eq('auth_uid', user.id)
            .maybeSingle(),
        ]);

        if (homeAssocResult.data?.home_id) {
          activitiesResult = await supabase
            .from('activities')
            .select('*, rooms(name)')
            .eq('home_id', homeAssocResult.data.home_id)
            .order('created_at', { ascending: false });
        } else {
          activitiesResult = await supabase
            .from('activities')
            .select('*, rooms(name)')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });
        }

        if ((!userResult.data || userResult.error) && user.email) {
          userResult = await supabase
            .from('users')
            .select('hobbies')
            .eq('email', user.email)
            .maybeSingle();
        }
          
        if (!activitiesResult.error && activitiesResult.data) {
          setMyActivities(activitiesResult.data.map(mapUserActivity));
        } else {
          setMyActivities([]);
        }

        if (!shortcutsResult.error && shortcutsResult.data) {
          setShortcutRows(shortcutsResult.data);
        } else {
          setShortcutRows([]);
        }

        setUserHobbies(parseHobbies(userResult.data?.hobbies));
      };
      const loadTemplates = async () => {
        try {
          const activities = await fetchActivityTemplates();
          setActivityTemplates(activities);
        } catch (error) {
          console.error('Failed to load home catalog templates:', error);
          setActivityTemplates([]);
        }
      };
      loadTemplates();
      loadActivities();
    }, [])
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        lastAiHomeIdeasRequestKeyRef.current = null;
      };
    }, []),
  );

  useFocusEffect(
    useCallback(() => {
      if (!isAiAutoInvocationEnabled) {
        setAiHomeIdeas([]);
        setIsLoadingAiHomeIdeas(false);
        return;
      }

      const requestKey = `home:${currentState}`;
      if (lastAiHomeIdeasRequestKeyRef.current === requestKey) {
        return;
      }

      let isActive = true;
      lastAiHomeIdeasRequestKeyRef.current = requestKey;

      const loadAiHomeIdeas = async () => {
        setIsLoadingAiHomeIdeas(true);

        try {
          const ideas = await fetchAiActivityIdeas({
            mood: currentState,
            source: 'home-auto',
          });

          if (!isActive) return;
          setAiHomeIdeas(ideas.slice(0, 5));
        } catch (error) {
          if (!isActive) return;
          logger.warn('Failed to auto-load AI home ideas:', error);
          const message = await getNidushAiErrorMessage(error);
          logger.warn(message);
          setAiHomeIdeas([]);
        } finally {
          if (isActive) {
            setIsLoadingAiHomeIdeas(false);
          }
        }
      };

      void loadAiHomeIdeas();

      return () => {
        isActive = false;
      };
    }, [currentState]),
  );

  const saveHomeAiIdea = useCallback(async (idea: AiActivityIdea) => {
    if (isSavingAiHomeIdeaId) return;

    setIsSavingAiHomeIdeaId(idea.id);

    try {
      const savedActivity = await saveAiActivityIdea(idea);
      setMyActivities((current) => [savedActivity, ...current]);
      setAiHomeIdeas((current) => current.filter((item) => item.id !== idea.id));
      router.push({
        pathname: '/activity-details',
        params: {
          id: savedActivity.id,
          isNew: 'true',
        },
      });
    } catch (error) {
      if (!(await isAiRateLimitError(error))) {
        console.error('Failed to save AI home recommendation:', error);
      }
    } finally {
      setIsSavingAiHomeIdeaId(null);
    }
  }, [isSavingAiHomeIdeaId]);

  // --- LÓGICA DO CARROSSEL (Recomendações) ---
  const dynamicActivities = useMemo(() => {
    if (aiHomeIdeas.length > 0) {
      return aiHomeIdeas.map((idea) => ({
        id: idea.id,
        title: idea.title,
        image: resolveCatalogImage(idea.image),
        time: isSavingAiHomeIdeaId === idea.id ? 'Saving...' : `${idea.durationMinutes} min`,
        room: idea.roomName,
        onPress: () => saveHomeAiIdea(idea),
      }));
    }

    const formatActivityForCarousel = (item: Activity): CarouselActivity => {
      const duration = getContentDuration(item.content_id || item.contentId);

      return {
        ...item,
        time: duration,
        room: getActivityRoomLabel(item),
      };
    };

    // 1. Aplicar filtro de Hobbies se o utilizador tiver algum selecionado
    const appActivities = activityTemplates.filter((item) => {
      // Se o user tiver hobbies, filtramos; se não tiver, mostramos todos
      if (userHobbies.length > 0) {
        // item.type (meditation, cooking, workout, audiobooks)
        return userHobbies.some(h => h.toLowerCase() === item.type?.toLowerCase());
      }
      
      return true;
    });

    const sortedList = getDynamicRecommendations(
      appActivities,
      currentState,
    ) as Activity[];

    const combinedList = [...myActivities, ...sortedList];
    const seenIds = new Set<string>();

    return combinedList
      .filter((item) => {
        const key = String(item.id);
        if (seenIds.has(key)) return false;
        seenIds.add(key);
        return true;
      })
      .slice(0, 8)
      .map(formatActivityForCarousel);
  }, [activityTemplates, aiHomeIdeas, currentState, isSavingAiHomeIdeaId, myActivities, saveHomeAiIdea, userHobbies]);


  const dynamicTitle = useMemo(() => {
    if (isLoadingAiHomeIdeas || aiHomeIdeas.length > 0) return 'AI activities for you';
    return 'Activities for you';
  }, [aiHomeIdeas.length, isLoadingAiHomeIdeas]);

  // --- NOVA LÓGICA DOS SHORTCUTS (USANDO 'shortcuts' NO PLURAL) ---
  const shortcuts = useMemo(() => {
    const activityShortcutMap = new Map(
      shortcutRows
        .filter((shortcut) => shortcut.activity_idactivity !== null)
        .map((shortcut, index) => [
          String(shortcut.activity_idactivity),
          {
            shortcutId: shortcut.id,
            displayorder: shortcut.displayorder ?? index,
          },
        ]),
    );

    const favActivities = myActivities
      .filter((activity) => activityShortcutMap.has(String(activity.id)))
      .sort(
        (a, b) =>
          (activityShortcutMap.get(String(a.id))?.displayorder ?? 0) -
          (activityShortcutMap.get(String(b.id))?.displayorder ?? 0),
      )
      .map((item) => {
      // Tentar encontrar a duração no CONTENTS
      const duration = getContentDuration(item.content_id || item.contentId);

      return {
        shortcutId: activityShortcutMap.get(String(item.id))!.shortcutId,
        displayorder: activityShortcutMap.get(String(item.id))!.displayorder,
        id: item.id,
        title: item.title,
        room: getActivityRoomLabel(item),
        image: item.image,
        time: duration,
        // Adicionamos type activity para ajudar na lógica se precisares
        type: 'activity',
      };
    });

    return favActivities;
  }, [myActivities, shortcutRows]);

  const saveShortcutOrder = async (orderedRows: ShortcutRow[]) => {
    setIsSavingShortcutOrder(true);
    try {
      const updates = orderedRows.map((row, index) =>
        supabase
          .from('shortcuts')
          .update({ displayorder: index + 1 })
          .eq('id', row.id),
      );

      const results = await Promise.all(updates);
      const failed = results.find((result) => result.error);
      if (failed?.error) throw failed.error;
    } catch (error) {
      console.error('Failed to save shortcut order:', error);
    } finally {
      setIsSavingShortcutOrder(false);
    }
  };

  const getShortcutDragOffset = (shortcutId: number) => {
    let offset = shortcutDragOffsets.get(shortcutId);
    if (!offset) {
      offset = new Animated.ValueXY({ x: 0, y: 0 });
      shortcutDragOffsets.set(shortcutId, offset);
    }
    return offset;
  };

  const reorderShortcut = (shortcutId: number, targetShortcutId: number) => {
    if (isSavingShortcutOrder) return;

    const orderedRows = shortcutRows
      .filter((row) => row.activity_idactivity !== null)
      .sort((a, b) => (a.displayorder ?? 0) - (b.displayorder ?? 0));

    const currentIndex = orderedRows.findIndex((row) => row.id === shortcutId);
    const targetIndex = orderedRows.findIndex((row) => row.id === targetShortcutId);

    if (currentIndex < 0 || targetIndex < 0 || currentIndex === targetIndex) return;

    const reorderedRows = [...orderedRows];
    const [movedRow] = reorderedRows.splice(currentIndex, 1);
    reorderedRows.splice(targetIndex, 0, movedRow);

    const normalizedRows = reorderedRows.map((row, index) => ({
      ...row,
      displayorder: index + 1,
    }));

    const rowById = new Map(normalizedRows.map((row) => [row.id, row]));
    setShortcutRows((prev) =>
      prev.map((row) => rowById.get(row.id) ?? row),
    );

    void saveShortcutOrder(normalizedRows);
  };

  const handleShortcutDrop = (shortcutId: number, dx: number, dy: number) => {
    const currentLayout = shortcutLayoutsRef.current[shortcutId];
    if (!currentLayout) return;

    const dropCenter = {
      x: currentLayout.x + currentLayout.width / 2 + dx,
      y: currentLayout.y + currentLayout.height / 2 + dy,
    };

    const closestShortcut = shortcuts.reduce<{ id: number; distance: number } | null>(
      (closest, shortcut) => {
        const layout = shortcutLayoutsRef.current[shortcut.shortcutId];
        if (!layout) return closest;

        const layoutCenter = {
          x: layout.x + layout.width / 2,
          y: layout.y + layout.height / 2,
        };
        const distance = Math.hypot(dropCenter.x - layoutCenter.x, dropCenter.y - layoutCenter.y);

        if (!closest || distance < closest.distance) {
          return { id: shortcut.shortcutId, distance };
        }
        return closest;
      },
      null,
    );

    if (closestShortcut) {
      reorderShortcut(shortcutId, closestShortcut.id);
    }
  };

  const updateShortcutLayout = useCallback(
    (shortcutId: number, layout: ShortcutLayout) => {
      const current = shortcutLayoutsRef.current[shortcutId];

      if (
        current &&
        current.x === layout.x &&
        current.y === layout.y &&
        current.width === layout.width &&
        current.height === layout.height
      ) {
        return;
      }

      shortcutLayoutsRef.current[shortcutId] = layout;
    },
    [],
  );

  const createShortcutPanResponder = (shortcutId: number) =>
    PanResponder.create({
      onStartShouldSetPanResponder: () => isEditingShortcuts && !isSavingShortcutOrder,
      onMoveShouldSetPanResponder: () => isEditingShortcuts && !isSavingShortcutOrder,
      onPanResponderGrant: () => {
        setDraggingShortcutId(shortcutId);
        getShortcutDragOffset(shortcutId).setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, gesture) => {
        getShortcutDragOffset(shortcutId).setValue({ x: gesture.dx, y: gesture.dy });
      },
      onPanResponderRelease: (_, gesture) => {
        handleShortcutDrop(shortcutId, gesture.dx, gesture.dy);
        Animated.spring(getShortcutDragOffset(shortcutId), {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start(() => setDraggingShortcutId(null));
      },
      onPanResponderTerminate: () => {
        Animated.spring(getShortcutDragOffset(shortcutId), {
          toValue: { x: 0, y: 0 },
          useNativeDriver: true,
        }).start(() => setDraggingShortcutId(null));
      },
    });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView
      className="flex-1 bg-[#F0F2EB]"
      edges={['top']}
      accessibilityLanguage="en-US"
    >
      <Stack.Screen
        options={{
          title: 'Home', // O que o leitor de ecrã pode ler como título da página
          headerShown: false, // Esconde visualmente porque tu já tens o teu HomeHeader
        }}
      />
      <ScrollView
        className="px-5"
        scrollEnabled={!isEditingShortcuts}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        style={{ paddingTop: Platform.OS === 'android' ? 20 : 0 }}
      >
        <HomeHeader userName={userName} avatarUrl={avatarUrl} />

        <StateWidget />

        <View className="-mx-5">
          <CarouselSection
            title={dynamicTitle}
            data={dynamicActivities}
            showTime={true}
            isLoadingMore={isLoadingAiHomeIdeas}
          />
        </View>

        {/* SECÇÃO SHORTCUTS DINÂMICA */}
        <View className="flex-row justify-between items-center mb-4 mt-2">
          <Text
            maxFontSizeMultiplier={1.2}
            style={{ fontFamily: 'Nunito_600SemiBold' }}
            className="text-2xl text-[#354F52]"
            accessibilityRole="header"
          >
            Shortcuts
          </Text>
          <Pressable
            onPress={() =>
              shortcuts.length === 0
                ? router.push('/Activities')
                : setIsEditingShortcuts((value) => !value)
            }
            accessibilityRole="button"
            accessibilityLabel={
              shortcuts.length === 0
                ? 'Add shortcuts'
                : isEditingShortcuts
                  ? 'Finish editing shortcuts'
                  : 'Edit shortcuts'
            }
            accessibilityHint={
              shortcuts.length === 0
                ? 'Opens activities so you can add shortcuts.'
                : 'Lets you manually change the position of your shortcut cards.'
            }
            hitSlop={10}
          >
            <Text
              maxFontSizeMultiplier={1.2}
              style={{ fontFamily: 'Nunito_600SemiBold' }}
              className="text-[#548F53] underline text-xl"
            >
              {shortcuts.length === 0 ? 'Add' : isEditingShortcuts ? 'Done' : 'Edit'}
            </Text>
          </Pressable>
        </View>

        <View className="flex-row flex-wrap justify-between pb-10">
          {shortcuts.length > 0 ? (
            shortcuts.map((item, index) => {
              const dragOffset = getShortcutDragOffset(item.shortcutId);
              const panResponder = createShortcutPanResponder(item.shortcutId);
              const isDragging = draggingShortcutId === item.shortcutId;

              return (
                <Animated.View
                  key={item.id}
                  className="w-[48%] mb-4"
                  onLayout={(event) => {
                    const { x, y, width, height } = event.nativeEvent.layout;
                    updateShortcutLayout(item.shortcutId, { x, y, width, height });
                  }}
                  style={{
                    transform: dragOffset.getTranslateTransform(),
                    zIndex: isDragging ? 20 : 1,
                    elevation: isDragging ? 20 : 0,
                    opacity: isDragging ? 0.92 : 1,
                  }}
                >
                  <UnifiedCard
                    id={item.id}
                    title={item.title}
                    image={item.image}
                    time={item.time}
                    room={item.room}
                    width="100%"
                    aspectRatio={1}
                    onPress={() =>
                      isEditingShortcuts
                        ? undefined
                        : router.push({
                            pathname: '/activity-details',
                            params: { id: item.id },
                          })
                    }
                  />
                  {isEditingShortcuts && (
                    <View
                      className="absolute inset-0 rounded-2xl border-2 border-[#548F53] bg-black/20"
                      {...panResponder.panHandlers}
                    >
                      <View className="absolute left-3 top-3 h-9 min-w-9 rounded-full bg-[#F0F2EB] px-3 items-center justify-center">
                        <Text
                          maxFontSizeMultiplier={1.2}
                          className="text-[#354F52] text-base"
                          style={{ fontFamily: 'Nunito_700Bold' }}
                        >
                          {index + 1}
                        </Text>
                      </View>

                      <View className="absolute bottom-3 left-3 right-3 flex-row items-center justify-center rounded-full bg-white/95 py-2">
                        <Ionicons name="reorder-three" size={26} color="#354F52" />
                        <Text
                          maxFontSizeMultiplier={1.2}
                          className="ml-1 text-[#354F52] text-sm"
                          style={{ fontFamily: 'Nunito_700Bold' }}
                        >
                          Drag
                        </Text>
                      </View>
                    </View>
                  )}
                </Animated.View>
              );
            })
          ) : (
            // Mensagem caso não haja shortcuts definidos
            <Text
              maxFontSizeMultiplier={1.2}
              style={{ fontFamily: 'Nunito_400Regular' }}
              className="text-gray-500 w-full text-center mt-2 italic"
            >
              {'No shortcuts selected yet. Tap "Add" to choose one.'}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
