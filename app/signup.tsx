import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Dimensions,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

const { width, height } = Dimensions.get('window');

export default function SignUp() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-[#F3F5EE]">
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
          <SafeAreaView className="flex-1 px-[28px]">
            {/* Header */}
            <View className="items-center mt-[15px] h-[60px] justify-center">
              <Image
                source={require('../assets/images/Logo.png')}
                className="w-[130px] h-[45px]"
                resizeMode="contain"
              />
            </View>

            {/* Content */}
            <View className="mt-[25px]">
              <Text 
                className="text-[40px] font-bold text-[#3E545C] tracking-[-0.5px]"
                style={{ fontFamily: 'Nunito' }}
              >
                Welcome Home
              </Text>
              <Text 
                className="text-[16px] text-[#3E545C] mt-[8px] mb-[30px] leading-[22px] opacity-90"
                style={{ fontFamily: 'Nunito' }}
              >
                Join Nidush and let your home be your safe space.
              </Text>

              {/* Name Row */}
              <View className="flex-row justify-between mb-[15px]">
                <View className="w-[48%]">
                  <Text className="text-[14px] text-[#3E545C] mb-[6px] font-semibold" style={{ fontFamily: 'Nunito' }}>
                    First Name
                  </Text>
                  <TextInput
                    className="h-[44px] border-[1.2px] border-[#C8D2C8] rounded-[15px] px-[15px] bg-[#FBFDFB] text-[15px] text-[#3E545C]"
                    placeholderTextColor="#A0A0A0"
                  />
                </View>
                <View className="w-[48%]">
                  <Text className="text-[14px] text-[#3E545C] mb-[6px] font-semibold" style={{ fontFamily: 'Nunito' }}>
                    Last Name
                  </Text>
                  <TextInput
                    className="h-[44px] border-[1.2px] border-[#C8D2C8] rounded-[15px] px-[15px] bg-[#FBFDFB] text-[15px] text-[#3E545C]"
                    placeholderTextColor="#A0A0A0"
                  />
                </View>
              </View>

              {/* Email */}
              <View className="w-full mb-[15px]">
                <Text className="text-[14px] text-[#3E545C] mb-[6px] font-semibold" style={{ fontFamily: 'Nunito' }}>
                  Email
                </Text>
                <TextInput
                  className="h-[44px] border-[1.2px] border-[#C8D2C8] rounded-[15px] px-[15px] bg-[#FBFDFB] text-[15px] text-[#3E545C]"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Password */}
              <View className="w-full mb-[15px]">
                <Text className="text-[14px] text-[#3E545C] mb-[6px] font-semibold" style={{ fontFamily: 'Nunito' }}>
                  Password
                </Text>
                <TextInput 
                  className="h-[44px] border-[1.2px] border-[#C8D2C8] rounded-[15px] px-[15px] bg-[#FBFDFB] text-[15px] text-[#3E545C]"
                  secureTextEntry={true} 
                />
              </View>

              {/* Button */}
              <TouchableOpacity
                className="bg-[#5C8D58] w-[230px] h-[54px] rounded-full justify-center items-center self-center mt-[15px] shadow-sm"
                style={{ 
                  elevation: 2,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                }}
                onPress={() => router.replace('/(tabs)')}
              >
                <Text className="text-white text-[20px] font-bold" style={{ fontFamily: 'Nunito' }}>
                  Join Nidush
                </Text>
              </TouchableOpacity>

              {/* Login Link */}
              <View className="flex-row justify-center mt-[20px]">
                <Text className="text-[#3E545C] text-[15px]" style={{ fontFamily: 'Nunito' }}>
                  Already have an account?{' '}
                </Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)')}>
                  <Text className="text-[#5C8D58] text-[15px] font-bold" style={{ fontFamily: 'Nunito' }}>
                    Login
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Wave Background */}
      <View 
        className="absolute bottom-0 overflow-hidden" 
        style={{ width: width, height: height * 0.18 }}
      >
        <Image
          source={require('../assets/images/Wave2.png')}
          className="w-full absolute bottom-0"
          style={{ height: height * 0.45 }}
          resizeMode="stretch"
        />
      </View>
    </View>
  );
}