import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as Audio from 'expo-audio'; 
import Svg, { Path } from 'react-native-svg';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

const { width } = Dimensions.get('window');
const TOTAL_TIME = 8 * 60; 

export default function ActiveSession() {
  const [isActive, setIsActive] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(TOTAL_TIME);
  const progress = useSharedValue(0);

  const player = Audio.useAudioPlayer('https://github.com/anars/blank-audio/raw/master/10-minutes-of-silence.mp3');

  useEffect(() => {
    Audio.setAudioModeAsync({
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
    });
    player.loop = true;
    player.volume = 0;
    if (isActive) player.play();
  }, [player]);

  useEffect(() => {
    let interval: any = null;
    if (isActive && secondsLeft > 0) {
      interval = setInterval(() => setSecondsLeft((p) => p - 1), 1000);
    }
    progress.value = withTiming(((TOTAL_TIME - secondsLeft) / TOTAL_TIME) * 100, { duration: 1000 });
    return () => clearInterval(interval);
  }, [isActive, secondsLeft]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const animatedProgressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const toggleSession = () => {
    isActive ? player.pause() : player.play();
    setIsActive(!isActive);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F1F4EE]">
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-2">
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={30} color="#354F52" />
        </TouchableOpacity>
        <Text className="text-[#354F52] text-xl font-semibold">Gratitude Flow</Text>
        <TouchableOpacity onPress={() => router.replace('/')}>
          <Text className="text-[#7DA87B] text-lg font-medium">Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Ilustração Central */}
      <View className="flex-1 items-center justify-end pb-6">
        <MaterialCommunityIcons name="meditation" size={80} color="#354F52" />
        <Text className="text-[#354F52] text-3xl font-bold text-center mt-8 px-10">
          Sit and put your hand on your heart
        </Text>
      </View>

      {/* Efeito de 3 Ondas Sobrepostas */}
      <View className="h-32 w-full justify-end overflow-hidden">
        <Svg height="160" width={width} viewBox="0 0 1440 320" style={{ marginBottom: -5 }}>
          {/* Onda de Trás (Mais Clara) */}
          <Path
            fill="#D7E8D6"
            fillOpacity="0.3"
            d="M0,160L48,176C96,192,192,224,288,224C384,224,480,192,576,165.3C672,139,768,117,864,138.7C960,160,1056,224,1152,245.3C1248,267,1344,245,1392,234.7L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
          {/* Onda do Meio */}
          <Path
            fill="#D7E8D6"
            fillOpacity="0.5"
            d="M0,224L60,213.3C120,203,240,181,360,181.3C480,181,600,203,720,224C840,245,960,267,1080,245.3C1200,224,1320,160,1380,128L1440,96L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          />
          {/* Onda da Frente (Mais Escura/Visível) */}
          <Path
            fill="#D7E8D6"
            fillOpacity="0.8"
            d="M0,256L80,240C160,224,320,192,480,197.3C640,203,800,245,960,250.7C1120,256,1280,224,1360,208L1440,192L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
          />
        </Svg>
      </View>

      {/* Painel Inferior */}
      <View className="bg-[#F1F4EE] px-10 pb-8">
        <View className="items-center mb-6">
          <Text className="text-[#354F52] text-6xl font-bold tabular-nums">
            {formatTime(secondsLeft)} <Text className="text-2xl font-normal">min</Text>
          </Text>
          <Text className="text-[#354F52]/50 text-lg font-medium">remaining</Text>
          
          <View className="w-full h-1.5 bg-[#DDE5D7] mt-6 rounded-full overflow-hidden">
            <Animated.View style={[animatedProgressStyle]} className="h-full bg-[#7DA87B]" />
          </View>
        </View>

        {/* Mini Player */}
        <View className="flex-row items-center bg-white/40 border border-[#7DA87B]/20 p-4 rounded-3xl mb-8">
          <Image 
            source={{ uri: 'https://i.scdn.co/image/ab67616d0000b2738b52c6b9bc3c43d008c0ad22' }} 
            className="w-12 h-12 rounded-lg"
          />
          <View className="flex-1 ml-4">
            <Text className="text-[#354F52] font-bold">Anchor</Text>
            <Text className="text-[#354F52]/60 text-xs">Novo Amor</Text>
          </View>
          <View className="flex-row items-center space-x-4">
            <Ionicons name="play-skip-back" size={22} color="#7DA87B" />
            <TouchableOpacity onPress={toggleSession}>
              <Ionicons name={isActive ? "pause-circle" : "play-circle"} size={44} color="#7DA87B" />
            </TouchableOpacity>
            <Ionicons name="play-skip-forward" size={22} color="#7DA87B" />
          </View>
        </View>

        {/* Botão Pause */}
        <TouchableOpacity 
          onPress={toggleSession}
          className="bg-[#5E8C5D] py-4 rounded-full flex-row justify-center items-center"
        >
          <Text className="text-white text-xl font-bold mr-2">Pause</Text>
          <Ionicons name="pause" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}