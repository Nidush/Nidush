import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions, Modal, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
// Removi o import do expo-audio para não causar conflitos agora
import Svg, { Path } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withSequence } from 'react-native-reanimated';

const { width } = Dimensions.get('window');

const ICON_MAP = [
  <MaterialCommunityIcons name="meditation" size={80} color="#354F52" />,
  <FontAwesome5 name="hands-helping" size={70} color="#354F52" />,
  <Feather name="smile" size={80} color="#354F52" />,
  <MaterialCommunityIcons name="weather-windy" size={80} color="#354F52" />,
];

export default function ActiveSession() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  const [loading, setLoading] = useState(true);
  const [activity, setActivity] = useState<any>(null);
  const [isActive, setIsActive] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [totalSessionTime, setTotalSessionTime] = useState(60);
  const [showExitModal, setShowExitModal] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  
  const progress = useSharedValue(0);
  const contentOpacity = useSharedValue(1);

  // 1. CARREGAR DADOS DA ATIVIDADE SELECIONADA
  useEffect(() => {
    const loadData = async () => {
      try {
        const stored = await AsyncStorage.getItem('@myActivities');
        let foundActivity = null;

        if (stored) {
          const activities = JSON.parse(stored);
          foundActivity = activities.find((a: any) => a.id === id);
        }

        if (foundActivity) {
          setActivity(foundActivity);
          // Converte tempo "5 min" para segundos
          const timeStr = foundActivity.time.split(' ')[0];
          const secs = timeStr.includes(':') 
            ? parseInt(timeStr.split(':')[0]) * 60 + parseInt(timeStr.split(':')[1])
            : parseInt(timeStr) * 60;
          
          setSecondsLeft(secs);
          setTotalSessionTime(secs);
        } else {
          // Atividade padrão caso o ID falhe
          setActivity({
            title: "Gratitude Flow",
            instructions: ["Sit and put your hand on your heart", "Find 3 things you have", "Think of one person", "Take 3 deep breaths"],
            room: "Living Room",
            content: "Nature Sounds"
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  // 2. FUNÇÕES DE CONTROLE
  const handleOpenExitModal = () => {
    setIsActive(false);
    setShowExitModal(true);
  };

  const toggleSession = () => {
    setIsActive(!isActive);
  };

  // 3. CRONÔMETRO
  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => setSecondsLeft((p) => p - 1), 1000);
    }
    progress.value = withTiming(((totalSessionTime - secondsLeft) / totalSessionTime) * 100, { duration: 1000 });
    
    if (secondsLeft === 0 && !loading) {
        router.replace('/Activities'); 
    }
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  // 4. MUDANÇA AUTOMÁTICA DE INSTRUÇÕES
  useEffect(() => {
    if (!activity?.instructions) return;
    const stepDuration = totalSessionTime / activity.instructions.length;
    const nextIndex = Math.min(
      Math.floor((totalSessionTime - secondsLeft) / stepDuration),
      activity.instructions.length - 1
    );

    if (nextIndex !== currentStepIndex) {
      contentOpacity.value = withSequence(withTiming(0, { duration: 500 }), withTiming(1, { duration: 500 }));
      setTimeout(() => setCurrentStepIndex(nextIndex), 500);
    }
  }, [secondsLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const animatedProgressStyle = useAnimatedStyle(() => ({ width: `${progress.value}%` }));
  const animatedContentStyle = useAnimatedStyle(() => ({ opacity: contentOpacity.value }));

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F1F4EE]">
        <ActivityIndicator size="large" color="#5E8C5D" />
      </View>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-[#F1F4EE]">
      
      {/* MODAL DE SAÍDA */}
      <Modal animationType="fade" transparent visible={showExitModal}>
        <View className="flex-1 bg-black/40 justify-center items-center px-8">
          <View className="bg-[#F1F4EE] w-full rounded-[40px] p-8 items-center shadow-2xl">
            <View className="w-16 h-16 rounded-full border-4 border-[#5E8C5D] items-center justify-center mb-6">
               <View className="w-6 h-6 bg-[#5E8C5D] rounded-sm" />
            </View>
            <Text className="text-[#354F52] text-3xl font-bold mb-4">End the activity?</Text>
            <TouchableOpacity 
              onPress={() => { setShowExitModal(false); setIsActive(true); }}
              className="bg-[#5E8C5D] w-full py-4 rounded-full mb-4"
            >
              <Text className="text-white text-center text-xl font-bold">Resume</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.replace('/Activities')} className="py-2">
              <Text className="text-[#5E8C5D] text-xl font-medium">End activity</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* HEADER */}
      <View className="flex-row justify-between items-center px-6 py-2">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={30} color="#354F52" />
        </TouchableOpacity>
        <Text className="text-[#354F52] text-xl font-semibold">{activity?.title}</Text>
        <TouchableOpacity onPress={handleOpenExitModal}>
          <Text className="text-[#7DA87B] text-lg font-medium">Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* ÁREA CENTRAL DINÂMICA */}
      <Animated.View style={[animatedContentStyle]} className="flex-1 items-center justify-center px-10">
        <View className="mb-10">
          {ICON_MAP[currentStepIndex % ICON_MAP.length]}
        </View>
        <Text className="text-[#354F52] text-3xl font-bold text-center leading-10">
          {activity?.instructions[currentStepIndex]}
        </Text>
      </Animated.View>

      {/* ONDAS */}
      <View className="h-24 w-full justify-end overflow-hidden">
        <Svg height="120" width={width} viewBox="0 0 1440 320">
          <Path fill="#D7E8D6" d="M0,256L80,240C160,224,320,192,480,197.3C640,203,800,245,960,250.7C1120,256,1280,224,1360,208L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z" />
        </Svg>
      </View>

      {/* PAINEL INFERIOR */}
      <View className="bg-[#F1F4EE] px-10 pb-8">
        <View className="items-center mb-6">
          <Text className="text-[#354F52] text-6xl font-bold tabular-nums">
            {formatTime(secondsLeft)}
          </Text>
          <View className="w-full h-1.5 bg-[#DDE5D7] mt-6 rounded-full overflow-hidden">
            <Animated.View style={[animatedProgressStyle]} className="h-full bg-[#7DA87B]" />
          </View>
        </View>

        {/* MINI PLAYER (APENAS VISUAL) */}
        <View className="flex-row items-center bg-white/40 border border-[#7DA87B]/20 p-4 rounded-3xl mb-8">
          <Image source={{ uri: 'https://i.scdn.co/image/ab67616d0000b2738b52c6b9bc3c43d008c0ad22' }} className="w-12 h-12 rounded-lg" />
          <View className="flex-1 ml-4">
            <Text className="text-[#354F52] font-bold">{activity?.content || 'Silent Session'}</Text>
            <Text className="text-[#354F52]/60 text-xs">Environment: {activity?.room}</Text>
          </View>
          <TouchableOpacity onPress={toggleSession}>
            <Ionicons name={isActive ? "pause-circle" : "play-circle"} size={44} color="#7DA87B" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          onPress={toggleSession}
          className="bg-[#5E8C5D] py-4 rounded-full items-center"
        >
          <Text className="text-white text-xl font-bold">{isActive ? 'Pause' : 'Resume'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}