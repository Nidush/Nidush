import React from 'react';
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

const { width, height } = Dimensions.get('window');

export default function HouseName({ onNext }: { onNext: () => void }) {
  return (
    <View className="flex-1 bg-[#F3F5EE]">
      <StatusBar style="dark" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
          <SafeAreaView className="flex-1 px-[28px]">
            
            <View className="items-center mt-[15px] h-[60px] justify-center">
              <Image 
                source={require('../../assets/images/Logo.png')} 
                className="w-[130px] h-[45px]" 
                resizeMode="contain" 
              />
            </View>

            <View className="mt-[25px]">
              <Text 
                style={{ fontFamily: 'Nunito-ExtraBold' }} 
                className="text-[40px] text-[#3E545C] tracking-[-0.5px] leading-tight"
              >
                House Name
              </Text>
              
              <Text 
                style={{ fontFamily: 'Nunito-Regular' }} 
                className="text-[16px] text-[#3E545C] mt-[8px] mb-[30px] leading-[22px] opacity-90"
              >
                Giving it a name is the first step to making this space truly yours.
              </Text>

              <View className="w-full mb-[15px]">
                <Text 
                  style={{ fontFamily: 'Nunito-SemiBold' }} 
                  className="text-[14px] text-[#3E545C] mb-[6px]"
                >
                  How would you like to call your home?
                </Text>
                <TextInput 
                  placeholder="e.g. My Sanctuary"
                  placeholderTextColor="#AAB4AA"
                  className="h-[44px] border-[1.2px] border-[#C8D2C8] rounded-[15px] px-[15px] bg-[#FBFDFB] text-[#3E545C]"
                  style={{ fontFamily: 'Nunito-Regular' }}
                />
              </View>

              <TouchableOpacity 
                onPress={onNext}
                activeOpacity={0.8}
                className="bg-[#5C8D58] w-[230px] h-[54px] rounded-full justify-center items-center self-center mt-[15px] shadow-sm"
              >
                <Text 
                  style={{ fontFamily: 'Nunito-ExtraBold' }} 
                  className="text-white text-[20px]"
                >
                  Create my home
                </Text>
              </TouchableOpacity>
            </View>

          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>

      <View 
        className="absolute bottom-0 overflow-hidden" 
        style={{ width: width, height: height * 0.18 }} 
        pointerEvents="none"
      >
        <Image 
          source={require('../../assets/images/Wave2.png')} 
          className="w-full absolute bottom-0" 
          style={{ height: height * 0.45 }} 
          resizeMode="stretch" 
        />
      </View>
    </View>
  );
}