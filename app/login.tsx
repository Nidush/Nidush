import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import VerificationModal from '../components/UI/VerificationModal';

import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { supabase } from '../utils/supabase';

export default function Login() {
  const [fontsLoaded] = useFonts({
    'Nunito_400Regular': Nunito_400Regular,
    'Nunito_600SemiBold': Nunito_600SemiBold,
    'Nunito_700Bold': Nunito_700Bold,
  });

  const router = useRouter();
  const params = useLocalSearchParams();
  const registeredEmail = params.registeredEmail as string;

  const [email, setEmail] = useState(registeredEmail || '');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [showModal, setShowModal] = useState(!!registeredEmail);

  const dims = Dimensions.get('window');
  const isWebPC = dims.width > 768;

  const handleLogin = async () => {
    if (!email || !password) {
      setErrorMsg('Por favor preenche o email e a password.');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    const { data: { user }, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setErrorMsg('Erro: ' + error.message);
      return;
    }

    if (user) {
      const { data: homeAssoc, error: userQueryError } = await supabase
        .from('user_homes')
        .select('home_id')
        .eq('user_id', user.id)
        .maybeSingle();

      setLoading(false);

      if (userQueryError || !homeAssoc?.home_id) {
        router.replace({
          pathname: '/setup-profile',
          params: { pwd: password }
        });
      } else {
        // Sucesso - Ir para a página principal / Dashboard
        await AsyncStorage.setItem('@viewedOnboarding', 'true');
        router.replace('/(tabs)');
      }
    } else {
      setLoading(false);
      router.replace('/(tabs)');
    }
  };

  if (!fontsLoaded) return null;

  return (
    <View className="flex-1 bg-[#F3F5EE]">
      <StatusBar style="dark" />
      
      {/* Verification Modal */}
      <VerificationModal 
        visible={showModal}
        email={email}
        onCheckEmail={() => setShowModal(false)}
        onResend={() => {/* Logic to resend email if needed */}}
      />

      {/* WAVES (Fundo) */}
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

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
        className="flex-1"
        style={{ zIndex: 10 }} 
      >
        <SafeAreaView className="flex-1 justify-center">
          
          <View 
            style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }} 
            className="px-[28px]"
          >
            
            <View className={`items-center ${isWebPC ? 'mb-[10px]' : 'mb-[20px]'} h-[60px] justify-center`}>
              <Image 
                source={require('../assets/images/Logo.png')} 
                style={{ width: isWebPC ? 100 : 130, height: isWebPC ? 35 : 45 }} 
                resizeMode="contain" 
              />
            </View>

            <View>
              <Text style={{ fontFamily: 'Nunito_700Bold' }} className="text-[40px] text-[#3E545C] tracking-[-0.5px]">Welcome Back</Text>
              <Text style={{ fontFamily: 'Nunito_400Regular' }} className="text-[16px] text-[#3E545C] mt-[8px] mb-[30px] leading-[22px] opacity-90">
                Enter your details to access your safe space.
              </Text>

              <View className="w-full mb-[15px]">
                <Text style={{ fontFamily: 'Nunito_600SemiBold' }} className="text-[14px] text-[#3E545C] mb-[6px]">Email</Text>
                <TextInput 
                  testID="email-input"
                  style={{ fontFamily: 'Nunito_400Regular' }}
                  className="h-[44px] border-[1.2px] border-[#C8D2C8] rounded-[15px] px-[15px] bg-[#FBFDFB]" 
                  keyboardType="email-address" 
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                />
              </View>

              <View className="w-full mb-[15px]">
                <Text style={{ fontFamily: 'Nunito_600SemiBold' }} className="text-[14px] text-[#3E545C] mb-[6px]">Password</Text>
                <TextInput 
                  testID="password-input"
                  style={{ fontFamily: 'Nunito_400Regular' }}
                  className="h-[44px] border-[1.2px] border-[#C8D2C8] rounded-[15px] px-[15px] bg-[#FBFDFB]" 
                  secureTextEntry 
                  value={password}
                  onChangeText={setPassword}
                />
              </View>

              {errorMsg ? (
                <Text style={{ fontFamily: 'Nunito_600SemiBold' }} className="text-red-500 text-[14px] mb-[10px] text-center">
                  {errorMsg}
                </Text>
              ) : null}

              <TouchableOpacity
                testID="login-button"
                activeOpacity={0.8}
                className="bg-[#5C8D58] w-[230px] h-[54px] rounded-full justify-center items-center self-center mt-[15px] shadow-sm"
                onPress={handleLogin}
                disabled={loading}
                style={{ opacity: loading ? 0.7 : 1 }}
              >
                <Text style={{ fontFamily: 'Nunito_700Bold' }} className="text-white text-[20px]">
                  {loading ? 'Logging in...' : 'Login'}
                </Text>
              </TouchableOpacity>

              <View className="flex-row justify-center mt-[20px] mb-20">
                <Text style={{ fontFamily: 'Nunito_400Regular' }} className="text-[#3E545C] text-[15px]">Don't have an account? </Text>
                <TouchableOpacity onPress={() => router.push('/signup')}>
                  <Text style={{ fontFamily: 'Nunito_700Bold' }} className="text-[#5C8D58] text-[15px]">Sign Up</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}
