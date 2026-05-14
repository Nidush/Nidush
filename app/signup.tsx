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
import { apiLog, invokeFunction, supabase } from '../utils/supabase';

import { getFriendlyErrorMessage } from '../utils/errorHandlers';


export default function SignUp() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular: Nunito_400Regular,
    Nunito_600SemiBold: Nunito_600SemiBold,
    Nunito_700Bold: Nunito_700Bold,
  });

  const router = useRouter();
  const [dims, setDims] = useState(Dimensions.get('window'));
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Estados do formulário
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) =>
      setDims(window),
    );
    return () => sub.remove();
  }, []);

  const handleSignUp = async () => {
    if (!email || !password || !firstName || !lastName) {
      setErrorMsg('Por favor preenche todos os campos.');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    apiLog('POST', 'auth/signUp', { email });
    const { data, error } = await supabase.auth.signUp({

      email,
      password,
      options: {
        data: {
          first_name: firstName,
          last_name: lastName,
        }
      }
    });

    setLoading(false);

    if (error) {
      setErrorMsg(getFriendlyErrorMessage(error));
      return;
    }


    try {
      await invokeFunction('welcome-user', { 
        name: firstName, 
        email: email 
      });
    } catch (fnError) {
      console.log('Erro ao enviar email de boas-vindas:', fnError);
    }

    // Signup bem sucedido, limpar progresso anterior se existir e redirecionar para o login
    try {
      await AsyncStorage.removeItem('@onboarding_progress');
    } catch (e) {
      console.log('Erro ao limpar progresso:', e);
    }
    router.replace({ pathname: '/login', params: { registeredEmail: email } });

  };



  if (!fontsLoaded) return null;

  const isWebPC = dims.width > 768;

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
      <View className="flex-1 bg-[#F3F5EE]">
        <StatusBar style="dark" />

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

                  <View className="flex-row justify-between mb-[15px]">
                    <View className="w-[48%]">
                      <Text style={{ fontFamily: 'Nunito_600SemiBold' }} className="text-[14px] text-[#3E545C] mb-[6px]">First Name</Text>
                      <TextInput
                        style={{ fontFamily: 'Nunito_400Regular' }}
                        className="h-[44px] border-[1.2px] border-[#C8D2C8] rounded-[15px] px-[15px] bg-[#FBFDFB]"
                        testID="first-name-input"
                        value={firstName}
                        onChangeText={setFirstName}
                      />
                    </View>
                    <View className="w-[48%]">
                      <Text style={{ fontFamily: 'Nunito_600SemiBold' }} className="text-[14px] text-[#3E545C] mb-[6px]">Last Name</Text>
                      <TextInput
                        style={{ fontFamily: 'Nunito_400Regular' }}
                        className="h-[44px] border-[1.2px] border-[#C8D2C8] rounded-[15px] px-[15px] bg-[#FBFDFB]"
                        testID="last-name-input"
                        value={lastName}
                        onChangeText={setLastName}
                      />
                    </View>
                  </View>

                  <View className="w-full mb-[15px]">
                    <Text style={{ fontFamily: 'Nunito_600SemiBold' }} className="text-[14px] text-[#3E545C] mb-[6px]">Email</Text>
                    <TextInput
                      style={{ fontFamily: 'Nunito_400Regular' }}
                      className="h-[44px] border-[1.2px] border-[#C8D2C8] rounded-[15px] px-[15px] bg-[#FBFDFB]"
                      keyboardType="email-address"
                      autoCapitalize="none"
                      testID="email-input"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>

                  <View className="w-full mb-[15px]">
                    <Text style={{ fontFamily: 'Nunito_600SemiBold' }} className="text-[14px] text-[#3E545C] mb-[6px]">Password</Text>
                    <TextInput
                      style={{ fontFamily: 'Nunito_400Regular' }}
                      className="h-[44px] border-[1.2px] border-[#C8D2C8] rounded-[15px] px-[15px] bg-[#FBFDFB]"
                      secureTextEntry
                      testID="password-input"
                      value={password}
                      onChangeText={setPassword}
                    />
                  </View>

                   {errorMsg ? (
                    <View className="bg-red-50 border border-red-200 p-3 rounded-xl mb-4">
                      <Text style={{ fontFamily: 'Nunito_600SemiBold' }} className="text-red-600 text-[14px] text-center">
                        {errorMsg}
                      </Text>
                    </View>
                  ) : null}


                  <TouchableOpacity
                    activeOpacity={0.8}
                    className="bg-[#5C8D58] w-[230px] h-[54px] rounded-full justify-center items-center self-center mt-[15px] shadow-sm"
                    onPress={handleSignUp}
                    disabled={loading}
                    style={{ opacity: loading ? 0.7 : 1 }}
                  >
                    <Text style={{ fontFamily: 'Nunito_700Bold' }} className="text-white text-[20px]">
                      {loading ? 'Joining...' : 'Join Nidush'}
                    </Text>
                  </TouchableOpacity>



                  {/* Footer Login */}
                  <View className="flex-row justify-center mt-[20px] mb-20">
                    <Text style={{ fontFamily: 'Nunito_400Regular' }} className="text-[#3E545C] text-[15px]">Already have an account? </Text>
                    <TouchableOpacity onPress={() => router.push('/login')}>
                      <Text style={{ fontFamily: 'Nunito_700Bold' }} className="text-[#5C8D58] text-[15px]">Login</Text>
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
