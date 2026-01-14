import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ActivityHeaderProps {
  imageSource: any;
  type: string;
  title: string;
  room: string;
  duration?: string | null;
  isActivity: boolean;
  onBack?: () => void;
  onAddToShortcuts?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ActivityHeader = ({
  imageSource,
  type,
  title,
  room,
  duration,
  isActivity,
  onBack,
  onAddToShortcuts,
  onEdit,
  onDelete,
}: ActivityHeaderProps) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const handleBackPress = () => {
    if (onBack) onBack();
    else router.back();
  };

  const MenuItem = ({ icon, label, onPress, color = '#2F4F4F' }: any) => (
    <TouchableOpacity
      onPress={() => {
        setMenuVisible(false);
        onPress && onPress();
      }}
      className="flex-row items-center py-3 px-4 active:bg-gray-50"
    >
      <MaterialIcons name={icon} size={20} color={color} />
      <Text
        className="ml-3 text-[15px]"
        style={{ fontFamily: 'Nunito_600SemiBold', color: color }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="w-full h-[450px] relative">
      <View style={StyleSheet.absoluteFill}>
        <Image
          source={imageSource}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
          blurRadius={Platform.OS === 'ios' ? 70 : 50}
        />
        <View className="absolute inset-0" />
      </View>
      <MaskedView
        style={StyleSheet.absoluteFill}
        maskElement={
          <LinearGradient
            colors={['black', 'black', 'transparent']}
            locations={[0, 0.1, 0.7]}
            style={StyleSheet.absoluteFill}
          />
        }
      >
        <Image
          source={imageSource}
          style={{ width: '100%', height: '100%' }}
          resizeMode="cover"
        />
      </MaskedView>

      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'transparent', 'rgba(0,0,0,0.8)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <SafeAreaView style={StyleSheet.absoluteFill} edges={['top']}>
        <View className="flex-row justify-between items-center px-5 pt-2 z-50">
          <TouchableOpacity onPress={handleBackPress}>
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <MaterialIcons name="more-vert" size={28} color="white" />
          </TouchableOpacity>
        </View>

        {/* --- MODAL DO MENU --- */}
        <Modal
          transparent
          visible={menuVisible}
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          {/* 1. O BLUR DO FUNDO (Substitui o fundo escuro) */}
          <BlurView
            intensity={Platform.OS === 'android' ? 10 : 10}
            tint="dark" // 'dark' para simular o escurecimento, 'light' para clarear
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />

          {/* 2. AREA DE TOQUE PARA FECHAR */}
          <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
            <View style={{ flex: 1 }}>
              {/* 3. O MENU EM SI (Sólido e nítido) */}
              <View
                className="absolute top-14 right-5 bg-white rounded-xl w-52 overflow-hidden"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 10,
                }}
              >
                <View style={{ paddingTop: 5, paddingBottom: 5 }}>
                  <MenuItem
                    icon="bookmark-border"
                    label="Add to shortcuts"
                    onPress={onAddToShortcuts}
                  />
                  <MenuItem
                    icon="edit"
                    label="Edit activity"
                    onPress={onEdit}
                  />
                  <View className="h-[1px] bg-gray-100 my-1 mx-4" />
                  <MenuItem
                    icon="delete-outline"
                    label="Delete activity"
                    onPress={onDelete}
                    color="#D32F2F"
                  />
                </View>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>

        <View className="absolute bottom-10 px-6 w-full -z-10">
          <Text
            className="text-white text-xl tracking-wider capitalize mb-2"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          >
            {type}
          </Text>
          <Text
            className="text-white text-4xl mt-1 shadow-sm"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            {title}
          </Text>
          <View className="flex-row items-center mt-6 space-x-6">
            {isActivity && duration && (
              <View className="flex-row items-center mr-4">
                <Ionicons name="time-outline" size={22} color="white" />
                <Text
                  className="text-white ml-2 text-lg"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  {duration}
                </Text>
              </View>
            )}
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="door" size={22} color="white" />
              <Text
                className="text-white ml-2 text-lg"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                {room}
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};
