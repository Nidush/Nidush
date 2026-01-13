import React, { useState, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

// Componentes de Onboarding
import WelcomeUser from '../components/Onboarding/WelcomeUser';
import HouseName from '../components/Onboarding/HouseName';
import WearableSync from '../components/Onboarding/WearableSync'; 
import ActivitySelection from '../components/Onboarding/ActivitySelection';
import FinalLoading from '../components/Onboarding/FinalLoading';

const { width, height } = Dimensions.get('window');

export default function SignUp() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState('form');
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const transitionTo = (nextStep: string) => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }).start(() => {
      setCurrentStep(nextStep);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    });
  };

  // --- Navegação ---
  if (currentStep === 'welcome') return <WelcomeUser onFinish={() => transitionTo('house')} />;

  if (currentStep === 'house') {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <HouseName onNext={() => transitionTo('wearable')} />
      </Animated.View>
    );
  }

  if (currentStep === 'wearable') {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <WearableSync onNext={() => transitionTo('activities')} onSkip={() => transitionTo('activities')} />
      </Animated.View>
    );
  }

  if (currentStep === 'activities') {
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ActivitySelection onFinish={() => transitionTo('loading')} />
      </Animated.View>
    );
  }

  if (currentStep === 'loading') return <FinalLoading onComplete={() => router.replace('/(tabs)')} />;

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <View className="flex-1 bg-[#F3F5EE]">
        <StatusBar style="dark" />
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1">
          <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false}>
            <SafeAreaView className="flex-1 px-[28px]">
              <View className="items-center mt-[15px] h-[60px] justify-center">
                <Image source={require('../assets/images/Logo.png')} className="w-[130px] h-[45px]" resizeMode="contain" />
              </View>

              <View className="mt-[25px]">
                <Text style={{ fontFamily: 'Nunito-ExtraBold' }} className="text-[40px] text-[#3E545C] tracking-[-0.5px]">Welcome Home</Text>
                <Text style={{ fontFamily: 'Nunito-Regular' }} className="text-[16px] text-[#3E545C] mt-[8px] mb-[30px] leading-[22px] opacity-90">
                  Join Nidush and let your home be your safe space.
                </Text>

                <View className="flex-row justify-between mb-[15px]">
                  <View className="w-[48%]">
                    <Text style={{ fontFamily: 'Nunito-SemiBold' }} className="text-[14px] text-[#3E545C] mb-[6px]">First Name</Text>
                    <TextInput className="h-[44px] border-[1.2px] border-[#C8D2C8] rounded-[15px] px-[15px] bg-[#FBFDFB]" />
                  </View>
                  <View className="w-[48%]">
                    <Text style={{ fontFamily: 'Nunito-SemiBold' }} className="text-[14px] text-[#3E545C] mb-[6px]">Last Name</Text>
                    <TextInput className="h-[44px] border-[1.2px] border-[#C8D2C8] rounded-[15px] px-[15px] bg-[#FBFDFB]" />
                  </View>
                </View>

                <View className="w-full mb-[15px]">
                  <Text style={{ fontFamily: 'Nunito-SemiBold' }} className="text-[14px] text-[#3E545C] mb-[6px]">Email</Text>
                  <TextInput className="h-[44px] border-[1.2px] border-[#C8D2C8] rounded-[15px] px-[15px] bg-[#FBFDFB]" keyboardType="email-address" />
                </View>

                <View className="w-full mb-[15px]">
                  <Text style={{ fontFamily: 'Nunito-SemiBold' }} className="text-[14px] text-[#3E545C] mb-[6px]">Password</Text>
                  <TextInput className="h-[44px] border-[1.2px] border-[#C8D2C8] rounded-[15px] px-[15px] bg-[#FBFDFB]" secureTextEntry />
                </View>

                <TouchableOpacity
                  activeOpacity={0.8}
                  className="bg-[#5C8D58] w-[230px] h-[54px] rounded-full justify-center items-center self-center mt-[15px] shadow-sm"
                  onPress={() => transitionTo('welcome')}
                >
                  <Text style={{ fontFamily: 'Nunito-ExtraBold' }} className="text-white text-[20px]">Join Nidush</Text>
                </TouchableOpacity>

                <View className="flex-row justify-center mt-[20px] mb-20">
                  <Text style={{ fontFamily: 'Nunito-Regular' }} className="text-[#3E545C] text-[15px]">Already have an account? </Text>
                  <TouchableOpacity><Text style={{ fontFamily: 'Nunito-Bold' }} className="text-[#5C8D58] text-[15px]">Login</Text></TouchableOpacity>
                </View>
              </View>
            </SafeAreaView>
          </ScrollView>
        </KeyboardAvoidingView>
        <View className="absolute bottom-0 overflow-hidden" style={{ width: width, height: height * 0.18 }} pointerEvents="none">
          <Image source={require('../assets/images/Wave2.png')} className="w-full absolute bottom-0" style={{ height: height * 0.45 }} resizeMode="stretch" />
        </View>
      </View>
    </Animated.View>
  );
}