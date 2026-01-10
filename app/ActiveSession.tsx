import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Dimensions,
  Modal,
  ActivityIndicator,
} from 'react-native';
import {
  Ionicons,
  MaterialCommunityIcons,
  FontAwesome5,
  Feather,
} from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Audio from 'expo-audio';
import Svg, { Path } from 'react-native-svg';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withRepeat,
  interpolate,
} from 'react-native-reanimated';

const { width } = Dimensions.get('window');

// Ícones para as instruções
const ICON_MAP = [
  <MaterialCommunityIcons
    key="1"
    name="meditation"
    size={80}
    color="#354F52"
  />,
  <FontAwesome5 key="2" name="hands-helping" size={70} color="#354F52" />,
  <Feather key="3" name="smile" size={80} color="#354F52" />,
  <MaterialCommunityIcons
    key="4"
    name="weather-windy"
    size={80}
    color="#354F52"
  />,
];

const ALL_ACTIVITIES = [
  {
    id: '1',
    title: 'Italian Night',
    room: 'Kitchen',
    time: '45 min',
    instructions: ['Prepare ingredients', 'Boil pasta', 'Mix sauce', 'Serve'],
    content: 'Italian Jazz',
  },
  {
    id: '2',
    title: 'Sunrise Flow',
    room: 'Living Room',
    time: '15 min',
    instructions: ['Breathe', 'Stretch', 'Flow', 'Relax'],
    content: 'Morning Birds',
  },
  {
    id: '3',
    title: 'Gratitude Flow',
    room: 'Living Room',
    time: '10 min',
    instructions: ['Focus', 'Identify 3 things', 'Feel thanks', 'Smile'],
    content: 'Soft Piano',
  },
  {
    id: '4',
    title: 'Forest Bathing',
    room: 'Living Room',
    time: '20 min',
    instructions: ['Listen', 'Visualize trees', 'Deep breath', 'Peace'],
    content: 'Nature Sounds',
  },
];

export default function ActiveSession() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // Estados principais
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<any>(null);
  const [isActive, setIsActive] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [totalSessionTime, setTotalSessionTime] = useState(0);
  const [showExitModal, setShowExitModal] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Valores Animados
  const progress = useSharedValue(0);
  const contentOpacity = useSharedValue(1);
  const pulseScale = useSharedValue(1);

  // 1. PLAYER SILENCIOSO (Para manter a App ativa em Background/Lock Screen)
  const player = Audio.useAudioPlayer(
    'https://github.com/anars/blank-audio/raw/master/10-minutes-of-silence.mp3',
  );

  useEffect(() => {
    async function setupAudio() {
      try {
        await Audio.setAudioModeAsync({
          shouldPlayInBackground: true,
          interruptionMode: 'doNotMix',
          shouldRouteThroughEarpiece: false,
        });
        player.loop = true;
        player.volume = 0;
        if (isActive) player.play();
      } catch (e) {
        console.log('Audio Error:', e);
      }
    }
    setupAudio();
  }, [player]);

  // 2. CARREGAMENTO DE DADOS (API READY)
  const loadData = useCallback(async () => {
    try {
      let found = ALL_ACTIVITIES.find((a) => String(a.id) === String(id));

      if (!found) {
        const stored = await AsyncStorage.getItem('@myActivities');
        if (stored) {
          const activities = JSON.parse(stored);
          found = activities.find((a: any) => String(a.id) === String(id));
        }
      }

      const finalActivity = found || {
        ...ALL_ACTIVITIES[2],
        title: 'Session',
        instructions: [
          'Ready to begin',
          'Focus on your breath',
          'Enjoy the moment',
        ],
      };

      setActivity(finalActivity);
      const timeStr = String(finalActivity.time || '10');
      const totalSecs = (parseInt(timeStr.split(' ')[0]) || 10) * 60;

      setSecondsLeft(totalSecs);
      setTotalSessionTime(totalSecs);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // 3. ANIMAÇÃO DE PULSAÇÃO
  useEffect(() => {
    if (isActive) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 2000 }),
          withTiming(1, { duration: 2000 }),
        ),
        -1,
        true,
      );
    } else {
      pulseScale.value = withTiming(1);
    }
  }, [isActive]);

  // 4. CRONÓMETRO E PROGRESSO
  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => setSecondsLeft((p) => p - 1), 1000);
    }
    if (totalSessionTime > 0) {
      progress.value = withTiming(
        ((totalSessionTime - secondsLeft) / totalSessionTime) * 100,
        { duration: 1000 },
      );
    }
    if (secondsLeft === 0 && !loading && totalSessionTime > 0)
      router.replace('/Activities');
    return () => clearInterval(interval);
  }, [isActive, secondsLeft, loading, totalSessionTime]);

  // 5. TROCA DE INSTRUÇÕES
  useEffect(() => {
    const steps = activity?.instructions;
    if (!steps || totalSessionTime === 0) return;

    const stepDuration = totalSessionTime / steps.length;
    const nextIndex = Math.min(
      Math.floor((totalSessionTime - secondsLeft) / stepDuration),
      steps.length - 1,
    );

    if (nextIndex !== currentStepIndex) {
      contentOpacity.value = withSequence(
        withTiming(0, { duration: 500 }),
        withTiming(1, { duration: 500 }),
      );
      setTimeout(() => setCurrentStepIndex(nextIndex), 500);
    }
  }, [secondsLeft, activity, totalSessionTime]);

  // Estilos Animados
  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: interpolate(pulseScale.value, [1, 1.08], [1, 0.9]),
  }));
  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));
  const animatedContentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
  }));

  if (loading || !activity) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F1F4EE]">
        <ActivityIndicator size="large" color="#5E8C5D" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F1F4EE]">
      <Modal animationType="fade" transparent visible={showExitModal}>
        <View className="flex-1 bg-black/40 justify-center items-center px-8">
          <View className="bg-[#F1F4EE] w-full rounded-[40px] p-8 items-center shadow-2xl">
            <Text className="text-[#354F52] text-3xl font-bold mb-4">
              End activity?
            </Text>
            <TouchableOpacity
              onPress={() => {
                setShowExitModal(false);
                setIsActive(true);
                player.play();
              }}
              className="bg-[#5E8C5D] w-full py-4 rounded-full mb-4"
            >
              <Text className="text-white text-center text-xl font-bold">
                Resume
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.replace('/Activities')}>
              <Text className="text-[#5E8C5D] text-xl font-medium">
                End now
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-2">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={30} color="#354F52" />
        </TouchableOpacity>
        <Text className="text-[#354F52] text-xl font-semibold">
          {activity.title}
        </Text>
        <TouchableOpacity
          onPress={() => {
            setIsActive(false);
            player.pause();
            setShowExitModal(true);
          }}
        >
          <Text className="text-[#7DA87B] text-lg font-medium">Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Área Central Animada */}
      <View className="flex-1 items-center justify-center px-10">
        <Animated.View
          style={[animatedIconStyle, animatedContentStyle]}
          className="items-center"
        >
          <View className="bg-[#D6E4D3] p-12 rounded-full shadow-sm mb-10">
            {ICON_MAP[currentStepIndex % ICON_MAP.length]}
          </View>
          <Text className="text-[#354F52] text-3xl font-bold text-center leading-10">
            {activity.instructions
              ? activity.instructions[currentStepIndex]
              : '...'}
          </Text>
        </Animated.View>
      </View>

      {/* Ondas Visuais */}
      <View className="h-24 w-full justify-end overflow-hidden">
        <Svg height="120" width={width} viewBox="0 0 1440 320">
          <Path
            fill="#D7E8D6"
            d="M0,256L80,240C160,224,320,192,480,197.3C640,203,800,245,960,250.7C1120,256,1280,224,1360,208L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
          />
        </Svg>
      </View>

      {/* Painel de Controle */}
      <View className="bg-[#F1F4EE] px-10 pb-8">
        <View className="items-center mb-6">
          <Text className="text-[#354F52] text-6xl font-bold tabular-nums">
            {Math.floor(secondsLeft / 60)}:
            {(secondsLeft % 60).toString().padStart(2, '0')}
          </Text>
          <View className="w-full h-1.5 bg-[#DDE5D7] mt-6 rounded-full overflow-hidden">
            <Animated.View
              style={[animatedProgressStyle]}
              className="h-full bg-[#7DA87B]"
            />
          </View>
        </View>

        <View className="flex-row items-center bg-white/40 border border-[#7DA87B]/20 p-4 rounded-3xl mb-8">
          <Image
            source={{ uri: 'https://picsum.photos/seed/6/100/100' }}
            className="w-12 h-12 rounded-lg"
          />
          <View className="flex-1 ml-4">
            <Text className="text-[#354F52] font-bold">
              {activity.content || 'Session'}
            </Text>
            <Text className="text-[#354F52]/60 text-xs">
              Playing in {activity.room}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => {
              isActive ? player.pause() : player.play();
              setIsActive(!isActive);
            }}
          >
            <Ionicons
              name={isActive ? 'pause-circle' : 'play-circle'}
              size={44}
              color="#7DA87B"
            />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={() => {
            isActive ? player.pause() : player.play();
            setIsActive(!isActive);
          }}
          className="bg-[#5E8C5D] py-4 rounded-full items-center"
        >
          <Text className="text-white text-xl font-bold">
            {isActive ? 'Pause' : 'Resume'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
