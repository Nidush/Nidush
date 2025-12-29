import React from 'react';
import { View, ScrollView, TextInput, TouchableOpacity, ImageBackground, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, Feather } from '@expo/vector-icons';

// --- COMPONENTE: Filtro (Morning, Afternoon, etc) ---
const FilterChip = ({ label, active = false }) => (
  <TouchableOpacity 
    className={`px-6 py-1.5 rounded-full mr-2 border ${
      active ? 'bg-[#C8E6C9] border-[#548F53]' : 'bg-transparent border-[#A8B5AA]'
    }`}
  >
    <Text className={`text-[14px] font-[Nunito_600SemiBold] ${active ? 'text-[#548F53]' : 'text-[#354F52]'}`}>
      {label}
    </Text>
  </TouchableOpacity>
);

// --- COMPONENTE: Switch Customizado ---
const CustomSwitch = ({ active }) => (
  <View className={`w-12 h-6 rounded-full px-1 justify-center ${active ? 'bg-[#548F53]' : 'bg-[#D1D1D1]'}`}>
    <View className={`w-4 h-4 bg-white rounded-full ${active ? 'self-end' : 'self-start'} shadow-sm`} />
  </View>
);

// --- COMPONENTE: Conteúdo Interno do Card (Texto e Ícones) ---
const CardContent = ({ title, time, location, room, isActive, light = false }) => {
  const textColor = light ? 'text-white' : 'text-[#354F52]';
  const iconColor = light ? 'white' : '#354F52';

  return (
    <View className="flex-row justify-between items-start">
      <View className="flex-1">
        <Text className={`${textColor} text-[18px] font-[Nunito_700Bold]`}>{title}</Text>
        
        <View className="flex-row items-center mt-3">
          <Feather name="calendar" size={14} color={iconColor} style={{ opacity: 0.7 }} />
          <Text className={`${textColor} ml-2 text-[13px] font-[Nunito_400Regular]`} style={{ opacity: 0.8 }}>{time}</Text>
        </View>
        
        <View className="flex-row items-center mt-1">
          <Feather name="clock" size={14} color={iconColor} style={{ opacity: 0.7 }} />
          <Text className={`${textColor} ml-2 text-[13px] font-[Nunito_400Regular]`} style={{ opacity: 0.8 }}>{location}</Text>
        </View>
        
        <View className="flex-row items-center mt-1">
          <Feather name="map-pin" size={14} color={iconColor} style={{ opacity: 0.7 }} />
          <Text className={`${textColor} ml-2 text-[13px] font-[Nunito_400Regular]`} style={{ opacity: 0.8 }}>{room}</Text>
        </View>
      </View>
      <CustomSwitch active={isActive} />
    </View>
  );
};

// --- COMPONENTE: Card Principal (Decide se tem imagem ou não) ---
const RoutineCard = ({ title, time, location, room, isActive, image }) => {
  const isImageCard = !!image;

  return (
    <View className="mb-4 overflow-hidden rounded-[20px] shadow-sm bg-white">
      {isImageCard ? (
        <ImageBackground source={image} className="p-5 min-h-[150px]">
          <View className="absolute inset-0 bg-black/40" />
          <CardContent title={title} time={time} location={location} room={room} isActive={isActive} light />
        </ImageBackground>
      ) : (
        <View className="p-5 border border-gray-100">
          <CardContent title={title} time={time} location={location} room={room} isActive={isActive} />
        </View>
      )}
    </View>
  );
};

// --- COMPONENTE: Barra de Pesquisa ---
const SearchBar = () => (
  <View className="flex-row items-center bg-[#F1F3EA] border border-[#A8B5AA] rounded-full px-4 py-2.5 mb-6">
    <Feather name="search" size={18} color="#A8B5AA" />
    <TextInput 
      placeholder="Search..." 
      className="flex-1 ml-2 text-[16px] text-[#354F52] font-[Nunito_400Regular]" 
      placeholderTextColor="#A8B5AA" 
    />
  </View>
);

// --- TELA PRINCIPAL (ENTRY POINT) ---
export default function Routines() {
  return (
    <SafeAreaView className="flex-1 bg-[#F1F3EA]" edges={['top']}>
      {/* Header */}
      <View className="items-center py-4">
        <Text className="text-[24px] text-[#354F52] font-[Nunito_700Bold]">Routines</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        <SearchBar />

        <Text className="text-[18px] font-[Nunito_700Bold] text-[#354F52] mb-4">Searche</Text>
        
        {/* Filtros Horizontais */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row mb-6">
          <FilterChip label="All" active />
          <FilterChip label="Morning" />
          <FilterChip label="Afternoon" />
          <FilterChip label="Evening" />
        </ScrollView>

        {/* Lista de Rotinas Reutilizando o RoutineCard */}
        <RoutineCard 
          title="Gym Hour" 
          time="Mon-Fri | 7:15 am" 
          location="8 Living Room" 
          room="Bedroom" 
          isActive={false} 
          image={require('@/assets/images/Logo.png')} 
        />

        <RoutineCard 
          title="Morning Kitchening" 
          time="Tue & Thu | 6:00 pm" 
          location="Living Room" 
          room="Kitchen" 
          isActive={true} 
          image={require('@/assets/images/Logo.png')} 
        />

        <RoutineCard 
          title="Morning Kitchen Prep" 
          time="Mon-Fri | 10:30 am" 
          location="Kitchen" 
          room="Prep Area" 
          isActive={false} 
        />

        <RoutineCard 
          title="Weekend Sleep-In" 
          time="Sat & Sun | 8:00 am" 
          location="Bedroom" 
          room="Ldridoo" 
          isActive={true} 
          image={require('@/assets/images/Logo.png')} 
        />
      </ScrollView>

      <TouchableOpacity 
        className="absolute bottom-10 right-6 bg-[#548F53] w-[60px] h-[60px] rounded-full items-center justify-center shadow-lg"
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={35} color="white" />
      </TouchableOpacity>
    </SafeAreaView>
  );
}