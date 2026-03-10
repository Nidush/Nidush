import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface RoutineCardProps {
  title: string;
  days: string;
  time: string;
  room: string;
  isActive: boolean;
  image: any;
  onToggle: () => void;
  testID?: string;
}

const RoutineCard = ({ title, days, time, room, isActive, image, onToggle, testID }: RoutineCardProps) => {
  return (
    <View 
      className="w-full mb-5 relative overflow-hidden rounded-[25px] bg-[#2C3A35]" 
      style={{ minHeight: 170 }}
    >
      <View style={[StyleSheet.absoluteFill, { transform: [{ scale: 1.5 }] }]}>
        <Image
          source={image}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          blurRadius={90} 
          accessible={false}
          importantForAccessibility="no"
        />
      </View>

      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <LinearGradient
            colors={['black', 'black', 'transparent']}
            locations={[0, 0.2, 0.75]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        }
      >
        <Image source={image} style={StyleSheet.absoluteFill} resizeMode="cover" accessible={false} importantForAccessibility="no" />
      </MaskedView>

      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <View className="flex-1 flex-row items-center justify-between px-6 py-4 z-10">
        <View className="flex-1 mr-4">
          <Text 
            style={{ fontFamily: 'Nunito_700Bold' }}
            className="text-white text-[20px] mb-2"
            maxFontSizeMultiplier={1.2}
          >{title}</Text>
          
          <View>
            <View className="flex-row items-center mb-1">
              <MaterialIcons name="calendar-today" size={14} color="white" />
              <Text className="text-white/90 ml-2 text-[13px]" style={{ fontFamily: 'Nunito_600SemiBold' }} maxFontSizeMultiplier={1.3}>{days}</Text>
            </View>
            <View className="flex-row items-center mb-1">
              <MaterialIcons name="access-time" size={14} color="white" />
              <Text className="text-white/90 ml-2 text-[13px]" style={{ fontFamily: 'Nunito_600SemiBold' }} maxFontSizeMultiplier={1.3}>{time}</Text>
            </View>
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="door" size={16} color="white" />
              <Text className="text-white/90 ml-2 text-[13px]" style={{ fontFamily: 'Nunito_600SemiBold' }} maxFontSizeMultiplier={1.3}>{room}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity 
          testID={testID}
          activeOpacity={0.8}
          onPress={onToggle}
          className={`w-[56px] h-[30px] rounded-full px-1 justify-center ${isActive ? 'bg-[#548F53]' : 'bg-white/30'}`}
          accessible={true}
          accessibilityRole="switch"
          accessibilityState={{ checked: isActive }}
          accessibilityLabel={`Toggle routine ${title}`}
        >
          <View className={`w-[22px] h-[22px] bg-white rounded-full shadow-lg ${isActive ? 'self-end' : 'self-start'}`} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default RoutineCard;