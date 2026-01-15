import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Image, 
  Dimensions, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';

export default function HouseName({ onNext }: { onNext: () => void }) {
  const [fontsLoaded] = useFonts({
    'Nunito_400Regular': Nunito_400Regular,
    'Nunito_600SemiBold': Nunito_600SemiBold,
    'Nunito_700Bold': Nunito_700Bold,
  });

  const [dims, setDims] = useState(Dimensions.get('window'));

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) return null;

  const isWebPC = dims.width > 768;

  return (
    <View className="flex-1 bg-[#F3F5EE]">
      <StatusBar style="dark" />
      
      {/* Wave de Fundo */}
      <View 
        className="absolute bottom-0 left-0 right-0 overflow-hidden" 
        style={{ width: dims.width, height: dims.height * 0.18, zIndex: 1 }} 
        pointerEvents="none"
      >
        <Image 
          source={require('../../assets/images/Wave2.png')} 
          className="w-full absolute bottom-0" 
          style={{ width: dims.width, height: dims.height * 0.45 }} 
          resizeMode="stretch" 
        />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
        style={{ zIndex: 10 }}
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} showsVerticalScrollIndicator={false}>
          <SafeAreaView className="flex-1">
            
            <View 
              style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }} 
              className="px-[28px] flex-1"
            >
              
              {/* Header */}
              <View className={`items-center ${isWebPC ? 'mt-[30px] mb-[10px]' : 'mt-[15px]'} h-[60px] justify-center`}>
                <Image 
                  source={require('../../assets/images/Logo.png')} 
                  style={{ 
                    width: isWebPC ? 100 : 130, 
                    height: isWebPC ? 35 : 45 
                  }} 
                  resizeMode="contain" 
                />
              </View>

              {/* Conteúdo */}
              <View className={isWebPC ? 'mt-[10px]' : 'mt-[25px]'}>
                <Text 
                  style={{ fontFamily: 'Nunito_700Bold' }} 
                  className="text-[40px] text-[#3E545C] tracking-[-0.5px] leading-tight"
                >
                  House Name
                </Text>
                
                <Text 
                  style={{ fontFamily: 'Nunito_400Regular' }} 
                  className="text-[16px] text-[#3E545C] mt-[8px] mb-[30px] leading-[22px] opacity-90"
                >
                  Giving it a name is the first step to making this space truly yours.
                </Text>

                {/* Input */}
                <View className="w-full mb-[15px]">
                  <Text 
                    style={{ fontFamily: 'Nunito_600SemiBold' }} 
                    className="text-[14px] text-[#3E545C] mb-[6px]"
                  >
                    How would you like to call your home?
                  </Text>
                  <TextInput 
                    placeholder="e.g. My Sanctuary"
                    placeholderTextColor="#AAB4AA"
                    className="h-[44px] border-[1.2px] border-[#C8D2C8] rounded-[15px] px-[15px] bg-[#FBFDFB] text-[#3E545C]"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  />
                </View>

                {/* Botão */}
                <TouchableOpacity 
                  onPress={onNext}
                  activeOpacity={0.8}
                  className="bg-[#5C8D58] w-[230px] h-[54px] rounded-full justify-center items-center self-center mt-[15px] shadow-sm active:scale-95"
                >
                  <Text 
                    style={{ fontFamily: 'Nunito_700Bold' }} 
                    className="text-white text-[20px]"
                  >
                    Create my home
                  </Text>
                </TouchableOpacity>
              </View>

            </View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}