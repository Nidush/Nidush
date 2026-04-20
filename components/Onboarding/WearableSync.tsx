import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Image,
  SafeAreaView,
  ScaledSize,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

// 1. ATENÇÃO: Adicionados novos imports do Health Connect aqui
import {
  getSdkStatus,
  initialize,
  Permission,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

// Substitui pelo caminho correto do teu ícone e garante que o ficheiro icons tem as tipagens de SVG corretas
import { Icons } from '../../assets/assets';

interface HealthConnectSyncProps {
  onNext: () => void;
  onSkip: () => void;
}

export default function HealthConnectSync({
  onNext,
  onSkip,
}: HealthConnectSyncProps) {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular: Nunito_400Regular,
    Nunito_600SemiBold: Nunito_600SemiBold,
    Nunito_700Bold: Nunito_700Bold,
  });

  const [dims, setDims] = useState<ScaledSize>(Dimensions.get('window'));
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const pulseAnim = useRef<Animated.Value>(new Animated.Value(0)).current;
  const brandGreen = '#5C8D58';

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) =>
      setDims(window),
    );
    return () => sub.remove();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ).start();
  }, [pulseAnim]);

  // 2. ATENÇÃO: Função completamente atualizada para evitar crashes
  const handleRequestPermissions = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Passo A: Verificar se o Health Connect está disponível no telemóvel
      const status = await getSdkStatus();

      if (status === SdkAvailabilityStatus.SDK_UNAVAILABLE) {
        Alert.alert(
          'Health Connect Not Found',
          'Health Connect is not installed on your device. Please install it from the Google Play Store to continue.',
        );
        setIsLoading(false);
        return;
      }

      if (
        status ===
        SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED
      ) {
        Alert.alert(
          'Update needed',
          'Please update the Health Connect app from the Google Play Store to continue.',
        );
        setIsLoading(false);
        return;
      }

      // Passo B: Inicializar a API (Obrigatório antes de pedir permissões)
      const isInitialized = await initialize();
      if (!isInitialized) {
        Alert.alert(
          'Error',
          'Could not initialize Health Connect. Please try again.',
        );
        setIsLoading(false);
        return;
      }

      // Passo C: Pedir as Permissões (Adicionei o HeartRate que estava no teu app.json)
      const permissoesNecessarias: Permission[] = [
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'HeartRate' },
      ];

      const permissoesConcedidas = await requestPermission(
        permissoesNecessarias,
      );

      // Verifica se a permissão principal que precisas (Passos) foi concedida
      const concedeuPassos = permissoesConcedidas.some(
        (p) => p.recordType === 'Steps' && p.accessType === 'read',
      );

      if (concedeuPassos) {
        onNext();
      } else {
        Alert.alert(
          'Permission Required',
          'We need access to your health data to track your stress levels accurately. Please try again.',
        );
      }
    } catch (error) {
      console.error('Erro ao pedir permissões:', error);
      Alert.alert('Connection Error', 'Could not connect to Health Connect.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!fontsLoaded) return null;

  const isWebPC: boolean = dims.width > 768;

  const pulseStyle = {
    transform: [
      {
        scale: pulseAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 2],
        }),
      },
    ],
    opacity: pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.5, 0],
    }),
  };

  const DeviceIcon = Icons?.devices || null;

  return (
    <View
      className="flex-1 bg-[#F3F5EE]"
      accessible
      accessibilityLabel="Health Connect connection screen"
    >
      {/* Wave de Fundo - decorativo */}
      <View
        className="absolute bottom-0 left-0 right-0 overflow-hidden"
        style={{ width: dims.width, height: dims.height * 0.18, zIndex: 1 }}
        pointerEvents="none"
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      >
        <Image
          source={require('../../assets/images/Wave2.png')}
          className="w-full absolute bottom-0"
          style={{ width: dims.width, height: dims.height * 0.45 }}
          resizeMode="stretch"
        />
      </View>

      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
        style={{ zIndex: 10 }}
      >
        <SafeAreaView className="flex-1">
          <View
            style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }}
            className="px-[28px] flex-1"
          >
            {/* Header / Logo */}
            <View
              className={`items-center ${isWebPC ? 'mt-[30px] mb-[10px]' : 'mt-[15px]'} h-[60px] justify-center`}
            >
              <Image
                source={require('../../assets/images/Logo.png')}
                style={{
                  width: isWebPC ? 100 : 130,
                  height: isWebPC ? 35 : 45,
                }}
                resizeMode="contain"
                accessible
                accessibilityLabel="Nidush logo"
              />
            </View>

            <View className="flex-1 justify-center items-center py-10">
              {/* Pulse Animação */}
              <View
                className="items-center justify-center mb-12"
                accessible={false}
                importantForAccessibility="no-hide-descendants"
              >
                <Animated.View
                  style={[pulseStyle]}
                  className="absolute w-32 h-32 rounded-full border-2 border-[#5C8D58]"
                />
                <Animated.View
                  style={[pulseStyle]}
                  className="absolute w-32 h-32 rounded-full border border-[#5C8D58]"
                />

                <View className="bg-white w-32 h-32 rounded-full items-center justify-center shadow-xl z-10 border border-[#E4EAD9]">
                  {DeviceIcon ? (
                    <DeviceIcon
                      width={58}
                      height={58}
                      fill={brandGreen}
                      color={brandGreen}
                    />
                  ) : (
                    <View className="w-16 h-16 bg-gray-200 rounded-full" />
                  )}
                </View>

                <View className="absolute -top-2 -right-2 bg-[#5C8D58] w-6 h-6 rounded-full border-4 border-[#F3F5EE] items-center justify-center z-20">
                  <View className="w-1.5 h-1.5 bg-white rounded-full" />
                </View>
              </View>

              {/* Título */}
              <Text
                maxFontSizeMultiplier={1.2}
                style={{
                  fontFamily: 'Nunito_700Bold',
                  fontSize: isWebPC ? 42 : 36,
                }}
                className="text-[#3E545C] text-center leading-tight tracking-[-0.5px]"
                accessibilityRole="header"
              >
                Sync your{'\n'}health data
              </Text>

              {/* Descrição clara */}
              <Text
                maxFontSizeMultiplier={1.2}
                style={{
                  fontFamily: 'Nunito_400Regular',
                  fontSize: isWebPC ? 18 : 17,
                }}
                className="text-[#3E545C] text-center mt-6 opacity-80 leading-[26px] px-4"
                accessibilityLabel="Connect to Health Connect to help Nidush track your stress levels automatically. Your data is kept secure and private."
              >
                Connect to Health Connect to help Nidush track your stress
                levels automatically. Your data stays securely on your device.
              </Text>

              {/* Botões */}
              <View className="mt-12 w-full items-center">
                <TouchableOpacity
                  onPress={handleRequestPermissions}
                  activeOpacity={0.8}
                  disabled={isLoading}
                  className={`${isWebPC ? 'w-[300px] h-[64px]' : 'w-[260px] h-[60px]'} ${isLoading ? 'bg-[#8FAD8C]' : 'bg-[#5C8D58]'} rounded-full justify-center items-center shadow-lg mb-6 active:scale-95`}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Connect to Health Connect"
                  accessibilityHint="Opens the system permissions modal to sync your health data"
                >
                  <Text
                    maxFontSizeMultiplier={1.2}
                    style={{
                      fontFamily: 'Nunito_700Bold',
                      fontSize: isWebPC ? 20 : 18,
                    }}
                    className="text-white"
                  >
                    {isLoading ? 'Connecting...' : 'Connect Data'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={onSkip}
                  activeOpacity={0.6}
                  accessible
                  accessibilityRole="button"
                  accessibilityLabel="Skip health sync"
                  accessibilityHint="I will connect my health data later"
                >
                  <Text
                    maxFontSizeMultiplier={1.2}
                    style={{ fontFamily: 'Nunito_600SemiBold', fontSize: 16 }}
                    className="text-[#3E545C] opacity-50"
                  >
                    I&apos;ll do this later
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}
