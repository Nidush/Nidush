import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { Image, ImageSourcePropType, Text, TouchableOpacity, View } from 'react-native';

interface ScenarioControlsProps {
  isActive: boolean;
  isMusicPlaying: boolean;
  image: ImageSourcePropType | string | null | undefined;
  onToggleSession: () => void;
  onToggleMusic: () => void;
  onNextTrack: () => void;
  onPreviousTrack: () => void;
  currentTrack?: { title: string; artist: string; imageUrl?: string | null } | null;
}

export const ScenarioControls = ({
  isActive,
  isMusicPlaying,
  image,
  onToggleSession,
  onToggleMusic,
  onNextTrack,
  onPreviousTrack,
  currentTrack,
}: ScenarioControlsProps) => {
  const imageSource =
    currentTrack?.imageUrl
      ? { uri: currentTrack.imageUrl }
      : typeof image === 'string'
        ? { uri: image }
        : image || { uri: 'https://picsum.photos/seed/scenario/100/100' };

  return (
    <View className="px-6 pb-8 pt-0" style={{ zIndex: 5 }}>
      <View className="flex-row items-center border border-[#9EC698] px-4 py-3 rounded-[20px] mb-6 bg-[#F5F7F0]">
        <Image source={imageSource} className="w-12 h-12 rounded-xl" />

        <View className="flex-1 ml-4 pr-3">
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-[#39535A] text-xl"
            style={{ fontFamily: 'Nunito_700Bold' }}
            numberOfLines={1}
          >
            {currentTrack?.title || 'Anchor'}
          </Text>
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-[#6B7C76] text-[15px]"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
            numberOfLines={1}
          >
            {currentTrack?.artist || 'Ambient playlist'}
          </Text>
        </View>

        <View className="flex-row items-center">
          <TouchableOpacity onPress={onPreviousTrack} className="px-1 py-1">
            <Ionicons name="play-skip-back-sharp" size={22} color="#5A9A57" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onToggleMusic} className="mx-2.5">
            <View className="w-12 h-12 rounded-full border-[3px] border-[#5A9A57] items-center justify-center">
              <MaterialIcons
                name={isMusicPlaying ? 'pause' : 'play-arrow'}
                size={24}
                color="#5A9A57"
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity onPress={onNextTrack} className="px-1 py-1">
            <Ionicons name="play-skip-forward-sharp" size={22} color="#5A9A57" />
          </TouchableOpacity>
        </View>
      </View>

      <View className="items-center">
        <TouchableOpacity
          onPress={onToggleSession}
          className="bg-[#5E9B58] py-3.5 rounded-full items-center w-56 shadow-lg flex-row justify-center"
        >
          <Text
            className="text-white text-xl mr-2"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            {isActive ? 'Pause' : 'Play'}
          </Text>
          <MaterialIcons
            name={isActive ? 'pause' : 'play-arrow'}
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};
