import React from 'react';
import { View, Text, ImageBackground, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function ActivityDetails() {
  const params = useLocalSearchParams();

  return (
    <View style={{ flex: 1, backgroundColor: '#F9FAF7' }}>
      {/* Header com Imagem */}
      <ImageBackground 
        source={{ uri: params.image as string || 'https://picsum.photos/400/600' }} 
        style={styles.headerImage}
      >
        <LinearGradient colors={['rgba(0,0,0,0.4)', 'transparent', 'rgba(0,0,0,0.8)']} style={styles.gradient}>
          <SafeAreaView edges={['top']} style={styles.topNav}>
            <TouchableOpacity onPress={() => router.back()} className="p-2">
              <Ionicons name="chevron-back" size={28} color="white" />
            </TouchableOpacity>
            <TouchableOpacity className="p-2">
              <MaterialIcons name="more-vert" size={28} color="white" />
            </TouchableOpacity>
          </SafeAreaView>
          
          <View className="px-5 pb-6">
            <Text className="text-white text-lg opacity-90" style={{ fontFamily: 'Nunito_600SemiBold' }}>{params.type || 'Activity'}</Text>
            <Text className="text-white text-3xl mb-3" style={{ fontFamily: 'Nunito_700Bold' }}>{params.title}</Text>
            <View className="flex-row items-center gap-4">
               <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={18} color="white" />
                  <Text className="text-white ml-1">10min</Text>
               </View>
               <View className="flex-row items-center">
                  <MaterialCommunityIcons name="door-open" size={18} color="white" />
                  <Text className="text-white ml-1">{params.room}</Text>
               </View>
            </View>
          </View>
        </LinearGradient>
      </ImageBackground>

      <ScrollView className="flex-1 px-5 pt-6">
        <Text className="text-[#354F52] text-lg mb-2" style={{ fontFamily: 'Nunito_700Bold' }}>Associated Devices</Text>
        <View className="flex-row gap-4 mb-6">
            <Text className="text-[#6A7D5B]">💡 Lights</Text>
            <Text className="text-[#6A7D5B]">🌿 Diffuser</Text>
        </View>

        <Text className="text-[#354F52] text-lg mb-2" style={{ fontFamily: 'Nunito_700Bold' }}>Description</Text>
        <Text className="text-[#6A7D5B] leading-5 mb-8" style={{ fontFamily: 'Nunito_400Regular' }}>
          {params.description || "No description provided."}
        </Text>

        <TouchableOpacity 
          className="bg-[#548F53] py-4 rounded-full items-center mb-10"
          onPress={() => router.push('/Activities')} 
        >
          <Text className="text-white text-xl" style={{ fontFamily: 'Nunito_700Bold' }}>Start ▶</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  headerImage: { width: '100%', height: 400 },
  gradient: { flex: 1, justifyContent: 'space-between' },
  topNav: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 10 }
});