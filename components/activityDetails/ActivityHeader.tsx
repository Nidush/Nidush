import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { BlurView } from 'expo-blur';
import { Image as ExpoImage } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import React, { useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ActivityHeaderProps {
  imageSource: ImageSourcePropType;
  type: string;
  title: string;
  room: string;
  duration?: string | null;
  isActivity: boolean;
  onBack?: () => void;
  onAddToShortcuts?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  isShortcut?: boolean;
  isUpdatingShortcut?: boolean;
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
  isShortcut,
  isUpdatingShortcut,
}: ActivityHeaderProps) => {
  const [menuVisible, setMenuVisible] = useState(false);

  const handleBackPress = () => {
    if (onBack) onBack();
    else router.back();
  };

  const MenuItem = ({
    icon,
    label,
    onPress,
    color = '#2F4F4F',
  }: {
    icon: React.ComponentProps<typeof MaterialIcons>['name'];
    label: string;
    onPress?: () => void;
    color?: string;
  }) => (
    <TouchableOpacity
      onPress={() => {
        setMenuVisible(false);
        onPress && onPress();
      }}
      className="flex-row items-center py-3 px-4 active:bg-gray-50"
      accessible
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <MaterialIcons name={icon} size={20} color={color} />
      <Text
        maxFontSizeMultiplier={1.2}
        className="ml-3 text-[15px]"
        style={{ fontFamily: 'Nunito_600SemiBold', color: color }}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View className="w-full h-[450px] relative overflow-hidden">
      {/* Background blur + masked image */}
      <View
        style={StyleSheet.absoluteFill}
        importantForAccessibility="no"
        accessibilityElementsHidden={true}
      >
        <Image
          source={imageSource}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          blurRadius={70}
          accessible={false}
        />
        <View className="absolute inset-0" />
      </View>

      <MaskedView
        style={StyleSheet.absoluteFill}
        importantForAccessibility="no" // Garante que a máscara também é ignorada
        accessibilityElementsHidden={true}
        maskElement={
          <LinearGradient
            colors={['black', 'black', 'transparent']}
            locations={[0, 0.1, 0.7]}
            style={StyleSheet.absoluteFill}
          />
        }
      >
        <ExpoImage
          source={imageSource}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          cachePolicy="memory-disk"
          transition={200}
        />
      </MaskedView>

      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'transparent', 'rgba(0,0,0,0.8)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
        importantForAccessibility="no"
      />

      <SafeAreaView style={StyleSheet.absoluteFill} edges={['top']}>
        {/* Top navigation */}
        <View className="flex-row justify-between items-center px-5 pt-2 z-50">
          <TouchableOpacity
            onPress={handleBackPress}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <Ionicons
              name="chevron-back"
              size={28}
              color="white"
              importantForAccessibility="no"
            />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setMenuVisible(true)}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Open menu"
            accessibilityHint="Opens a menu to edit, delete, or add to shortcuts"
          >
            <MaterialIcons name="more-vert" size={28} color="white" />
          </TouchableOpacity>
        </View>

        {/* Menu Modal */}
        <Modal
          transparent
          visible={menuVisible}
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <BlurView
            intensity={10}
            tint="dark"
            experimentalBlurMethod="dimezisBlurView"
            style={StyleSheet.absoluteFill}
          />

          <TouchableWithoutFeedback
            onPress={() => setMenuVisible(false)}
            accessible={true}
            accessibilityRole="button"
            accessibilityLabel="Close menu"
          >
            <View style={{ flex: 1 }}>
              <View
                className="absolute top-14 right-5 bg-white rounded-xl w-52 overflow-hidden"
                style={{
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 10,
                }}
                accessibilityViewIsModal={true} // iOS: Prende o foco aqui dentro
              >
                <View style={{ paddingTop: 5, paddingBottom: 5 }}>
                  <MenuItem
                    icon="bookmark-border"
                    label={
                      isUpdatingShortcut
                        ? 'A guardar shortcut...'
                        : isShortcut
                          ? 'Remover dos shortcuts'
                          : 'Adicionar aos shortcuts'
                    }
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

        {/* Bottom info */}
        <View className="absolute bottom-10 px-6 w-full -z-10">
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-white text-xl tracking-wider capitalize mb-2"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
            accessible={false} // Esconde isto, pois vamos agrupar no título abaixo
          >
            {type}
          </Text>
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-white text-4xl mt-1 shadow-sm"
            style={{ fontFamily: 'Nunito_700Bold' }}
            accessible
            accessibilityRole="header"
            // Junta o Tipo com o Título para uma leitura limpa
            accessibilityLabel={`${type} ${title}`}
          >
            {title}
          </Text>
          <View className="flex-row items-center mt-6 space-x-6">
            {isActivity && duration && (
              <View
                className="flex-row items-center mr-4"
                accessible={true}
                accessibilityRole="text"
                accessibilityLabel={`${duration ? `Duration: ${duration}. ` : ''}Room: ${room}`}
              >
                <Ionicons name="time-outline" size={22} color="white" />
                <Text
                  className="text-white ml-2 text-lg"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  {duration}
                </Text>
              </View>
            )}
            <View
              className="flex-row items-center"
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden={true}
            >
              <MaterialCommunityIcons name="door" size={22} color="white" />
              <Text
                maxFontSizeMultiplier={1.2}
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
