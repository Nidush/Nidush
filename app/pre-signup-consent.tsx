import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';

import { LEGAL_CONSENT_KEY, LegalContent } from '../components/legal/LegalContent';

export default function PreSignupConsent() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });
  const router = useRouter();
  const dims = Dimensions.get('window');
  const isWebPC = dims.width > 768;
  const [showFullTerms, setShowFullTerms] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);

  const handleAccept = async () => {
    if (!hasAcceptedTerms) return;
    await AsyncStorage.setItem(LEGAL_CONSENT_KEY, 'accepted');
    router.replace('/signup');
  };

  if (!fontsLoaded) return null;

  return (
    <View className="flex-1 bg-[#F3F5EE]">
      <StatusBar style="dark" />

      <View
        className="absolute bottom-0 left-0 right-0 overflow-hidden"
        style={{ width: dims.width, height: dims.height * 0.18, zIndex: 1 }}
        pointerEvents="none"
      >
        <Image
          source={require('../assets/images/Wave2.png')}
          className="w-full absolute bottom-0"
          style={{ width: dims.width, height: dims.height * 0.45 }}
          resizeMode="stretch"
        />
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 64 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView className="flex-1">
          <View
            style={{ maxWidth: 680, width: '100%', alignSelf: 'center' }}
            className="px-[28px] flex-1"
          >
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

            <View className={isWebPC ? 'mt-[0px]' : 'mt-[8px]'}>
              <Text
                style={{ fontFamily: 'Nunito_700Bold' }}
                className="text-[32px] text-[#3E545C]"
                accessibilityRole="header"
              >
                Before creating your Nidush account
              </Text>

              <Text
                style={{ fontFamily: 'Nunito_400Regular' }}
                className="text-[16px] text-[#3E545C] mt-[8px] mb-[16px]"
              >
                Please review the Nidush privacy policy and terms of service before entering your personal details.
              </Text>

              <View className="bg-white/90 border border-[#E1E8DA] rounded-[28px] px-5 py-5 mb-4">
                <Text
                  style={{ fontFamily: 'Nunito_700Bold' }}
                  className="text-[18px] text-[#3E545C] mb-4"
                >
                  Quick summary
                </Text>

                <View className="gap-y-3">
                  <Text
                    style={{ fontFamily: 'Nunito_400Regular' }}
                    className="text-[#4A5D4E] leading-6"
                  >
                    Nidush uses your account details, preferences, and optional integrations to personalize your home experience.
                  </Text>
                  <Text
                    style={{ fontFamily: 'Nunito_400Regular' }}
                    className="text-[#4A5D4E] leading-6"
                  >
                    We do not sell your personal data, and you can manage or withdraw optional permissions later.
                  </Text>
                  <Text
                    style={{ fontFamily: 'Nunito_400Regular' }}
                    className="text-[#4A5D4E] leading-6"
                  >
                    By continuing, you accept Nidush&apos;s privacy policy and terms of service.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                activeOpacity={0.8}
                className="border border-[#C8D2C8] bg-[#FBFDFB] w-full h-[50px] rounded-full justify-center items-center self-center mb-4"
                onPress={() => setShowFullTerms((current) => !current)}
                testID="toggle-full-terms"
              >
                <Text style={{ fontFamily: 'Nunito_700Bold' }} className="text-[#3E545C] text-[16px]">
                  {showFullTerms ? 'Hide full terms' : 'Read full terms'}
                </Text>
              </TouchableOpacity>

              {showFullTerms ? (
                <View className="bg-white/90 border border-[#E1E8DA] rounded-[28px] px-5 py-6 mb-5">
                  <LegalContent />
                </View>
              ) : null}

              <Pressable
                onPress={() => setHasAcceptedTerms((current) => !current)}
                className="flex-row items-start bg-[#FBFDFB] border border-[#D6DED2] rounded-[22px] px-4 py-4 mb-4"
                accessibilityRole="checkbox"
                accessibilityState={{ checked: hasAcceptedTerms }}
                accessibilityLabel="I have read and accept Nidush terms and privacy policy"
                testID="accept-terms-checkbox"
              >
                <View
                  className={`w-6 h-6 rounded-[7px] border items-center justify-center mt-[2px] ${hasAcceptedTerms ? 'bg-[#5C8D58] border-[#5C8D58]' : 'bg-white border-[#A7B5A4]'}`}
                >
                  {hasAcceptedTerms ? (
                    <MaterialIcons name="check" size={16} color="#FFFFFF" />
                  ) : null}
                </View>
                <Text
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                  className="flex-1 ml-3 text-[#3E545C] leading-6"
                >
                  I have read and accept Nidush&apos;s Terms of Service and Privacy Policy.
                </Text>
              </Pressable>

              <Text
                style={{ fontFamily: 'Nunito_600SemiBold' }}
                className="text-[#6C7A74] text-[13px] text-center mb-4"
              >
                Required to create your account. You can review these terms again later inside the app.
              </Text>

              <TouchableOpacity
                activeOpacity={0.8}
                className="bg-[#5C8D58] w-full h-[54px] rounded-full justify-center items-center self-center shadow-sm"
                onPress={handleAccept}
                testID="pre-signup-accept-button"
                disabled={!hasAcceptedTerms}
                style={{ opacity: hasAcceptedTerms ? 1 : 0.45 }}
              >
                <Text style={{ fontFamily: 'Nunito_700Bold' }} className="text-white text-[18px]">
                  I agree and want to continue
                </Text>
              </TouchableOpacity>

              <View className="flex-row justify-center mt-[18px] mb-12">
                <Text style={{ fontFamily: 'Nunito_400Regular' }} className="text-[#3E545C] text-[15px]">Already have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/login')}>
                  <Text style={{ fontFamily: 'Nunito_700Bold' }} className="text-[#5C8D58] text-[15px]">Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}
