import { Ionicons } from '@expo/vector-icons';
import { ResizeMode, Video } from 'expo-av';
import React, { useRef, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SessionVideoProps {
  videoUrl?: string; // Link do YouTube ou ficheiro local
  poster?: any; // Imagem de capa
}

export const SessionVideo = ({ videoUrl, poster }: SessionVideoProps) => {
  const video = useRef<Video>(null);
  const [status, setStatus] = useState<any>({});

  // Se for um link do YouTube, normalmente precisaríamos de um WebView.
  // Como exemplo, vou assumir que é um vídeo direto ou mostrar um placeholder estético.

  const isYouTube =
    videoUrl?.includes('youtube') || videoUrl?.includes('youtu.be');

  if (isYouTube) {
    return (
      <View className="flex-1 justify-center items-center px-4">
        <View className="w-full aspect-video bg-black rounded-3xl overflow-hidden justify-center items-center shadow-2xl relative">
          {/* Aqui entraria o componente <WebView source={{ uri: videoUrl }} /> */}
          <Text className="text-white font-bold mb-2">
            YouTube Player Placeholder
          </Text>
          <Text className="text-gray-400 text-xs text-center px-4">
            {videoUrl}
          </Text>

          <TouchableOpacity className="mt-4 bg-[#ff0000] px-6 py-3 rounded-full flex-row items-center">
            <Ionicons name="play" size={20} color="white" />
            <Text className="text-white font-bold ml-2">Watch on YouTube</Text>
          </TouchableOpacity>
        </View>
        <Text className="mt-8 text-[#354F52] text-center px-6 leading-6">
          Watch the video tutorial above to complete your session.
        </Text>
      </View>
    );
  }

  // Player de Vídeo Nativo (Expo AV) para ficheiros locais ou URLs diretos (.mp4)
  return (
    <View className="flex-1 justify-center items-center px-0">
      <View className="w-full aspect-[3/4] bg-black rounded-[32px] overflow-hidden shadow-2xl border-4 border-white">
        <Video
          ref={video}
          style={StyleSheet.absoluteFill}
          source={{
            uri:
              videoUrl ||
              'https://d23dyxeqlo5psv.cloudfront.net/big_buck_bunny.mp4', // Exemplo
          }}
          useNativeControls
          resizeMode={ResizeMode.COVER}
          isLooping
          onPlaybackStatusUpdate={(status) => setStatus(() => status)}
        />

        {/* Botão Play Personalizado no centro se estiver pausado */}
        {!status.isPlaying && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => video.current?.playAsync()}
            className="absolute inset-0 justify-center items-center bg-black/30"
          >
            <View className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full justify-center items-center border border-white/50">
              <Ionicons
                name="play"
                size={40}
                color="white"
                style={{ marginLeft: 4 }}
              />
            </View>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
