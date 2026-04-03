import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { Stack, router, useFocusEffect } from 'expo-router';
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { UnifiedCard } from '@/components/activitiesScenarios/UnifiedCard';
import { CarouselSection } from '../../components/activitiesScenarios/CarouselSection';
import { HomeHeader } from '../../components/Homepage/HomeHeader';
import { StateWidget } from '../../components/Homepage/StateWidget';

import { ACTIVITIES, CONTENTS, SCENARIOS, Activity } from '@/constants/data';
import { useBiometrics } from '@/context/BiometricsContext';
import { getDynamicRecommendations } from '@/utils/recommendationEngine';
import { supabase } from '@/utils/supabase';

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

  // O userName deve ser atualizado quando ganhamos foco também
  const fetchUserName = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      
      if (user) {
        setAvatarUrl(user.user_metadata?.avatar_url || null);
        setUserName(user.user_metadata?.first_name || user.email?.split('@')[0] || 'Utilizador');
      } else {
        // Tentar getUser() se session for null, às vezes ajuda na consistência
        const { data: { user: verifiedUser } } = await supabase.auth.getUser();
        if (verifiedUser) {
          setAvatarUrl(verifiedUser.user_metadata?.avatar_url || null);
          setUserName(verifiedUser.user_metadata?.first_name || verifiedUser.email?.split('@')[0] || 'Utilizador');
        } else {
          setUserName('Visitante');
        }
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
        setUserName(session.user.user_metadata?.first_name || session.user.email?.split('@')[0] || 'Utilizador');
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
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setMyActivities([]); // Importante: Limpar se não houver user
          setAvatarUrl(null);
          setUserName('Visitante');
          return;
        }

        // Atualizar o nome também por precaução
        setAvatarUrl(user.user_metadata?.avatar_url || null);
        setUserName(user.user_metadata?.first_name || user.email?.split('@')[0] || 'Utilizador');
        
        const { data, error } = await supabase
          .from('activity')
          .select('*')
          .eq('user_iduser', user.id);
          
        if (!error && data) {
          const mapped = data.map(d => ({
            id: d.idactivity,
            title: d.title,
            description: d.description,
            room: d.room,
            image: d.image,
            category: d.category,
            type: d.type,
            contentId: d.contentid,
            scenarioId: d.scenarioid,
            shortcuts: d.shortcuts === true || d.shortcuts === 'true',
          }));
          setMyActivities(mapped as any);
        } else {
          setMyActivities([]);
        }
      };
      loadActivities();
    }, [])
  );

  // --- LÓGICA DO CARROSSEL (Recomendações) ---
  const dynamicActivities = useMemo(() => {
    const appActivities = ACTIVITIES.filter(
      (item) => item.category !== 'My creations',
    );
    const sortedList = getDynamicRecommendations(
      appActivities,
      currentState,
    ).slice(0, 5);

    return sortedList.map((item) => {
      let duration: string | undefined = undefined;
      if ('contentId' in item && item.contentId) {
        const contentData = (CONTENTS as any)[item.contentId];
        if (contentData) {
          duration = contentData.duration;
        }
      }
      return { ...item, time: duration };
    });
  }, [currentState]);

  const dynamicTitle = useMemo(() => 'Activities for you', []);

  // --- NOVA LÓGICA DOS SHORTCUTS (USANDO 'shortcuts' NO PLURAL) ---
  const shortcuts = useMemo(() => {
    const allActivities = [...ACTIVITIES, ...myActivities];

    // 1. Filtrar ATIVIDADES onde shortcuts === true
    const favActivities = allActivities.filter(
      (a: any) => a.shortcuts === true,
    ).map((item) => {
      // Tentar encontrar a duração no CONTENTS
      let duration = undefined;
      if (item.contentId && (CONTENTS as any)[item.contentId]) {
        duration = (CONTENTS as any)[item.contentId].duration;
      }

      return {
        id: item.id,
        title: item.title,
        room: item.room,
        image: item.image,
        time: duration,
        // Adicionamos type activity para ajudar na lógica se precisares
        type: 'activity',
      };
    });

    // 2. Filtrar CENÁRIOS onde shortcuts === true
    const favScenarios = SCENARIOS.filter((s: any) => s.shortcuts === true).map(
      (item) => {
        return {
          id: item.id,
          title: item.title,
          room: item.room,
          image: item.image,
          time: undefined, // Cenários não costumam ter duração definida nos cards
          type: 'scenario',
        };
      },
    );

    // 3. Juntar as duas listas
    return [...favActivities, ...favScenarios];
  }, [myActivities]); // Agora depende das myActivities vindas no Supabase

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
              Alert.alert('Shortcuts', 'Shortcuts edit feature coming soon!')
            }
            accessibilityRole="button"
            accessibilityLabel="Edit shortcuts"
            accessibilityHint="Opens the shortcuts editor."
            hitSlop={10}
          >
            <Text
              maxFontSizeMultiplier={1.2}
              style={{ fontFamily: 'Nunito_600SemiBold' }}
              className="text-[#548F53] underline text-xl"
            >
              Edit
            </Text>
          </Pressable>
        </View>

        <View className="flex-row flex-wrap justify-between pb-10">
          {shortcuts.length > 0 ? (
            shortcuts.map((item) => (
              <View key={item.id} className="w-[48%] mb-4">
                <UnifiedCard
                  id={item.id}
                  title={item.title}
                  image={item.image}
                  time={item.time}
                  room={item.room}
                  width="100%"
                  aspectRatio={0.95}
                  onPress={() =>
                    router.push({
                      pathname: '/activity-details',
                      params: { id: item.id },
                    })
                  }
                />
              </View>
            ))
          ) : (
            // Mensagem caso não haja shortcuts definidos
            <Text
              maxFontSizeMultiplier={1.2}
              style={{ fontFamily: 'Nunito_400Regular' }}
              className="text-gray-500 w-full text-center mt-2 italic"
            >
              {'No shortcuts selected yet. Click "Edit" to add some!'}
            </Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
