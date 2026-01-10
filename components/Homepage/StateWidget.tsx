import { MaterialIcons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

interface ActiveScenarioProps {
  title: string;
  image: any;
  onPlay?: (isPlaying: boolean) => void;
}

export const StateWidget = ({ title, image, onPlay }: ActiveScenarioProps) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePress = () => {
    const newState = !isPlaying;
    setIsPlaying(newState);

    if (onPlay) {
      onPlay(newState);
    }
  };

  return (
    <View className="w-full mb-6 relative overflow-hidden rounded-[15px] bg-gray-900">
      <View style={[StyleSheet.absoluteFill, { transform: [{ scale: 1.4 }] }]}>
        <Image
          source={image}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          blurRadius={Platform.OS === 'ios' ? 50 : 50}
        />
      </View>

      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <LinearGradient
            colors={['black', 'black', 'transparent']}
            locations={[0, 0.4, 0.9]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        }
      >
        <Image
          source={image}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      </MaskedView>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.2)', 'rgba(0,0,0,0.1)']}
        locations={[0.2, 0.5, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View className="flex-row justify-between items-center p-5 z-10">
        <View className="flex-1">
          <Text
            style={{ fontFamily: 'Nunito_600SemiBold' }}
            className="text-white opacity-90 text-[14px]"
          >
            Active Scenario
          </Text>
          <Text
            style={{
              fontFamily: 'Nunito_700Bold',
            }}
            className="text-white text-[24px]"
          >
            {title}
          </Text>

          <View className="flex-row mt-2">
            {['speaker', 'lightbulb-outline', 'music-note'].map((icon, idx) => (
              <View
                key={idx}
                className="bg-white/20 p-[6px] rounded-full mr-2 border border-white/10"
              >
                <MaterialIcons name={icon as any} size={14} color="white" />
              </View>
            ))}
          </View>
        </View>

        <Pressable
          onPress={handlePress}
          style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
          className="bg-white/60 w-20 h-20 rounded-full mr-2 border border-white/10 justify-center items-center shadow-lg"
        >
          <MaterialIcons
            name={isPlaying ? 'pause' : 'play-arrow'}
            size={52}
            color="#548F53"
          />
        </Pressable>
      </View>
    </View>
  );
};
