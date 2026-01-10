import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function Profile() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7F0]" edges={['top']}>
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4">
        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <MaterialIcons name="chevron-left" size={32} color="#4A5D4E" />
        </TouchableOpacity>
        <Text 
          className="text-2xl text-[#4A5D4E]"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
        >
          Profile
        </Text>
        <View className="w-8" />
      </View>

      <ScrollView 
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >        
        <View className="items-center my-6">
          <Image
            source={require('@/assets/avatars/profile.png')}
            className="w-32 h-32 rounded-full"
          />
          <Text 
            className="text-3xl text-[#3A4D3F] mt-4"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            Laura Rossi
          </Text>
        </View>

        {/* Hobbies */}
        <View className="bg-[#F5F7F0] rounded-[24px] p-5 mb-4 border border-[#D1D9C5]">
          <View className="flex-row justify-between items-center mb-4">
            <Text 
              className="text-lg text-[#4A5D4E]"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
            >
              Hobby Preferences
            </Text>
            <TouchableOpacity>
              <Text 
                className="text-[#5B8C51] underline"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                Edit
              </Text>
            </TouchableOpacity>
          </View>
          <View className="flex-row flex-wrap gap-2">
            {['Cooking', 'Workout', 'Meditation', 'Audiobooks'].map((hobby) => (
              <View key={hobby} className="bg-[#C8E0C4] px-4 py-1.5 rounded-full">
                <Text 
                  className="text-[#4A5D4E] text-sm"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  {hobby}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Wearables */}
        <View className="bg-[#F5F7F0] rounded-[24px] p-5 mb-4 border border-[#D1D9C5]">
          <Text 
            className="text-lg text-[#4A5D4E] mb-4"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
          >
            Associated Wearables
          </Text>
          
          {/* Ícones de relógio do MaterialIcons */}
          <DeviceItem name="Apple Watch" status="Connected" connected icon="watch" />
          <DeviceItem name="Mi Band" status="Disconnected" connected={false} icon="watch" />

          <TouchableOpacity className="bg-[#5B8C51] py-3.5 rounded-full items-center mt-4 shadow-sm">
            <Text 
              className="text-white text-xl"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              Add New Device
            </Text>
          </TouchableOpacity>
        </View>

        {/* Menu Principal com MaterialIcons do Design */}
        <View className="bg-[#F5F7F0] rounded-[24px] px-2 mb-4 border border-[#D1D9C5]">
          <MenuItem icon="account-circle" label="Account Information" />
          <MenuItem icon="notifications-none" label="Notifications" />
          <MenuItem icon="admin-panel-settings" label="Privacy & Data" border={false} />
        </View>

        {/* Menu Secundário */}
        <View className="bg-[#F5F7F0] rounded-[24px] px-2 mb-6 border border-[#D1D9C5]">
          <MenuItem icon="group" label="Residents" border={false} />
        </View>

        {/* Botão Logout */}
        <View className="items-center">
          <TouchableOpacity
            className="bg-[#5B8C51] px-12 py-3.5 rounded-full shadow-sm"
            onPress={() => router.replace('/profile-selection')}
          >
            <Text 
              className="text-white text-xl"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DeviceItem({ name, status, connected, icon }: any) {
  return (
    <View className="flex-row items-center mb-4">
      <View className="bg-[#E8EDDF] p-2 rounded-xl">
        <MaterialIcons name={icon} size={28} color="#4A5D4E" />
      </View>
      <View className="ml-4">
        <Text 
          className="text-base text-[#4A5D4E]"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
        >
          {name}
        </Text>
        <View className="flex-row items-center mt-0.5">
          <View className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-[#5B8C51]' : 'bg-gray-400'}`} />
          <Text 
            className="text-xs text-gray-500 ml-1.5"
            style={{ fontFamily: 'Nunito_400Regular' }}
          >
            {status}
          </Text>
        </View>
      </View>
    </View>
  );
}

function MenuItem({ icon, label, border = true }: any) {
  return (
    <TouchableOpacity 
      className={`flex-row justify-between items-center py-5 px-4 ${border ? 'border-b border-[#D1D9C5]' : ''}`}
    >
      <View className="flex-row items-center">
        <MaterialIcons name={icon} size={28} color="#4A5D4E" />
        <Text 
          className="text-lg text-[#4A5D4E] ml-4"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
        >
          {label}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={28} color="#4A5D4E" />
    </TouchableOpacity>
  );
}