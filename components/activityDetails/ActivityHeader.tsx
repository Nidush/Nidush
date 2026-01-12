import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
} from '@expo/vector-icons';
import MaskedView from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
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
}

export const ActivityHeader = ({
  imageSource,
  type,
  title,
  room,
  duration,
  isActivity,
}: ActivityHeaderProps) => {
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

      {/* Overlay Escuro */}
      <LinearGradient
        colors={['rgba(0,0,0,0.1)', 'transparent', 'rgba(0,0,0,0.8)']}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Conteúdo Seguro */}
      <SafeAreaView style={StyleSheet.absoluteFill} edges={['top']}>
        {/* Top Bar */}
        <View className="flex-row justify-between items-center px-5 pt-2">
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={28} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => console.log('Opções')}>
            <MaterialIcons name="more-vert" size={28} color="white" />
          </TouchableOpacity>
        </View>

        {/* Textos e Info */}
        <View className="absolute bottom-10 px-6 w-full">
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
