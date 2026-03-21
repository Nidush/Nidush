import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';

// Componentes de Onboarding
import ActivitySelection from '../components/Onboarding/ActivitySelection';
import FinalLoading from '../components/Onboarding/FinalLoading';
import HouseName from '../components/Onboarding/HouseName';
import WearableSync from '../components/Onboarding/WearableSync';
import WelcomeUser from '../components/Onboarding/WelcomeUser';

export default function SignUp() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular: Nunito_400Regular,
    Nunito_600SemiBold: Nunito_600SemiBold,
    Nunito_700Bold: Nunito_700Bold,
  });

  const router = useRouter();
  const [currentStep, setCurrentStep] = useState('form');
  const [dims, setDims] = useState(Dimensions.get('window'));
  const fadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) =>
      setDims(window),
    );
    return () => sub.remove();
  }, []);

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

  if (!fontsLoaded) return null;

  const isWebPC = dims.width > 768;

  // --- Navegação Onboarding ---
  if (currentStep === 'welcome')
    return <WelcomeUser onFinish={() => transitionTo('house')} />;
  if (currentStep === 'house')
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <HouseName onNext={() => transitionTo('wearable')} />
      </Animated.View>
    );
  if (currentStep === 'wearable')
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <WearableSync
          onNext={() => transitionTo('activities')}
          onSkip={() => transitionTo('activities')}
        />
      </Animated.View>
    );
  if (currentStep === 'activities')
    return (
      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <ActivitySelection onFinish={() => transitionTo('loading')} />
      </Animated.View>
    );
  if (currentStep === 'loading')
    return (
      <FinalLoading
        onComplete={async () => {
          try {
            // Gravamos aqui que o Onboarding (incluindo setup) foi concluído
            await AsyncStorage.setItem('@viewedOnboarding', 'true');
            router.replace('/(tabs)');
          } catch (e) {
            console.log('Error saving onboarding state', e);
            router.replace('/(tabs)');
          }
        }}
      />
    );

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <View className="flex-1 bg-[#F3F5EE]">
        <StatusBar style="dark" />

        {/* Background Waves */}
        <View
          accessible={false}
          className="absolute bottom-0 left-0 right-0 overflow-hidden"
          style={{ width: dims.width, height: dims.height * 0.18, zIndex: 1 }}
          pointerEvents="none"
        >
          <Image
            source={require('../assets/images/Wave2.png')}
            className="w-full absolute bottom-0"
            style={{ width: dims.width, height: dims.height * 0.45 }}
            resizeMode="stretch"
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          className="flex-1"
          style={{ zIndex: 10 }}
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            bounces={false}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <SafeAreaView className="flex-1">
              <View
                style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }}
                className="px-[28px] flex-1"
              >
                {/* Logo */}
                <View
                  className={`items-center ${isWebPC ? 'mt-[30px] mb-[10px]' : 'mt-[15px]'} h-[60px] justify-center`}
                  accessible
                  accessibilityRole="image"
                  accessibilityLabel="Nidush logo"
                >
                  <Image
                    source={require('../assets/images/Logo.png')}
                    style={{
                      width: isWebPC ? 100 : 130,
                      height: isWebPC ? 35 : 45,
                    }}
                    resizeMode="contain"
                  />
                </View>

                <View className={isWebPC ? 'mt-[10px]' : 'mt-[25px]'}>
                  <Text
                    style={{ fontFamily: 'Nunito_700Bold' }}
                    className="text-[40px] text-[#3E545C]"
                    accessibilityRole="header"
                    maxFontSizeMultiplier={1}
                  >
                    Welcome Home
                  </Text>

                  <Text
                    style={{ fontFamily: 'Nunito_400Regular' }}
                    className="text-[16px] text-[#3E545C] mt-[8px] mb-[30px]"
                    accessibilityLabel="Join Nidush and let your home be your safe space"
                    maxFontSizeMultiplier={1.2}
                  >
                    Join Nidush and let your home be your safe space.
                  </Text>

                  {/* CAMPOS LADO A LADO: First Name & Last Name */}
                  <View className="flex-row mb-[15px]">
                    <View className="flex-1 mr-[10px]">
                      <Text
                        style={{ fontFamily: 'Nunito_600SemiBold' }}
                        className="text-[14px] text-[#3E545C] mb-[6px]"
                        maxFontSizeMultiplier={1.2}
                      >
                        First Name
                      </Text>
                      <TextInput
                        style={{ fontFamily: 'Nunito_400Regular' }}
                        className="h-[44px] border-[1.2px] border-[#C8D2C8] rounded-[15px] px-[15px] bg-[#FBFDFB]"
                        accessibilityLabel="First Name"
                        accessibilityHint="Enter your first name"
                        maxFontSizeMultiplier={1.2}
                      />
                    </View>

                    <View className="flex-1">
                      <Text
                        style={{ fontFamily: 'Nunito_600SemiBold' }}
                        className="text-[14px] text-[#3E545C] mb-[6px]"
                        maxFontSizeMultiplier={1.2}
                      >
                        Last Name
                      </Text>
                      <TextInput
                        style={{ fontFamily: 'Nunito_400Regular' }}
                        className="h-[44px] border-[1.2px] border-[#C8D2C8] rounded-[15px] px-[15px] bg-[#FBFDFB]"
                        accessibilityLabel="Last Name"
                        accessibilityHint="Enter your last name"
                        maxFontSizeMultiplier={1.2}
                      />
                    </View>
                  </View>

                  {/* Email */}
                  <Text
                    style={{ fontFamily: 'Nunito_600SemiBold' }}
                    className="text-[14px] text-[#3E545C] mb-[6px]"
                    maxFontSizeMultiplier={1.2}
                  >
                    Email
                  </Text>
                  <TextInput
                    style={{ fontFamily: 'Nunito_400Regular' }}
                    className="h-[44px] border-[1.2px] border-[#C8D2C8] rounded-[15px] px-[15px] bg-[#FBFDFB] mb-[15px]"
                    keyboardType="email-address"
                    accessibilityLabel="Email"
                    accessibilityHint="Enter your email address"
                    maxFontSizeMultiplier={1.2}
                  />

                  {/* Password */}
                  <Text
                    style={{ fontFamily: 'Nunito_600SemiBold' }}
                    className="text-[14px] text-[#3E545C] mb-[6px]"
                    maxFontSizeMultiplier={1.2}
                  >
                    Password
                  </Text>
                  <TextInput
                    style={{ fontFamily: 'Nunito_400Regular' }}
                    className="h-[44px] border-[1.2px] border-[#C8D2C8] rounded-[15px] px-[15px] bg-[#FBFDFB] mb-[20px]"
                    secureTextEntry
                    accessibilityLabel="Password"
                    accessibilityHint="Enter your password"
                    maxFontSizeMultiplier={1.2}
                  />

                  {/* Botão Join */}
                  <TouchableOpacity
                    activeOpacity={0.8}
                    className="bg-[#5C8D58] w-[230px] h-[54px] rounded-full justify-center items-center self-center mt-[15px]"
                    onPress={() => transitionTo('welcome')}
                    accessibilityRole="button"
                    accessibilityLabel="Join Nidush"
                  >
                    <Text
                      style={{ fontFamily: 'Nunito_700Bold' }}
                      className="text-white text-[20px]"
                      maxFontSizeMultiplier={1.2}
                    >
                      Join Nidush
                    </Text>
                  </TouchableOpacity>

                  {/* Footer Login */}
                  <View className="flex-row justify-center mt-[20px] mb-20">
                    <Text
                      style={{ fontFamily: 'Nunito_400Regular' }}
                      className="text-[#3E545C] text-[15px]"
                      maxFontSizeMultiplier={1.2}
                    >
                      Already have an account?
                    </Text>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel="Login"
                    >
                      <Text
                        style={{ fontFamily: 'Nunito_700Bold' }}
                        className="text-[#5C8D58] text-[15px] ml-1"
                        maxFontSizeMultiplier={1.2}
                      >
                        Login
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </SafeAreaView>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Animated.View>
  );
}
