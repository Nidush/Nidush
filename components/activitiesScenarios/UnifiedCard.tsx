import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import {
  DimensionValue,
  Image,
  ImageSourcePropType,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

interface UnifiedCardProps {
  id: string;
  title: string;
  image: ImageSourcePropType | string;
  time?: string;
  room?: string;
  width?: DimensionValue | number;
  aspectRatio?: number;
  onPress: () => void;
}

export const UnifiedCard = ({
  title,
  image,
  time,
  room,
  width = '100%',
  aspectRatio = 1,
  onPress,
}: UnifiedCardProps) => {
  const imageSource = typeof image === 'string' ? { uri: image } : image;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      // REMOVIDO O 'mb-4' DAQUI PARA CONTROLAR O ESPAÇAMENTO NO PAI
      className="relative rounded-2xl overflow-hidden bg-gray-900"
      style={{ width: width as any, aspectRatio }}
    >
      <View style={StyleSheet.absoluteFill}>
        <Image
          source={imageSource}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          blurRadius={Platform.OS === 'ios' ? 70 : 50}
        />
        <View className="absolute inset-0 " />
      </View>

      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <LinearGradient
            colors={['black', 'black', 'transparent']}
            locations={[0, 0.1, 0.6]}
            style={StyleSheet.absoluteFill}
          />
        }
      >
        <Image
          source={imageSource}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      </MaskedView>

      <LinearGradient
        colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.5)']}
        locations={[0.4, 0.7, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View className="absolute bottom-0 w-full p-4 z-30">
        <Text
          numberOfLines={2}
          className="text-white text-xl leading-tight mb-2"
          style={{ fontFamily: 'Nunito_700Bold' }}
        >
          {title}
        </Text>

        <View className="opacity-95">
          {time && (
            <View className="flex-row items-center mb-1">
              <MaterialIcons name="access-time" size={16} color="white" />
              <Text
                className="text-white text-md ml-1.5"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                {time}
              </Text>
            </View>
          )}

          {room && (
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="door" size={18} color="white" />
              <Text
                className="text-white text-md ml-1.5"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                {room}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
