import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../../assets/assets';

import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';

// Repara: Já não importamos o "Permission" daqui para evitar erros de TS
import {
  getSdkStatus,
  initialize,
  openHealthConnectSettings,
  RecordType,
  requestPermission,
  SdkAvailabilityStatus,
} from 'react-native-health-connect';

// ─── Tipos ────────────────────────────────────────────────────────────────────
type SyncStatus =
  | 'idle'
  | 'requesting'
  | 'granted'
  | 'partial'
  | 'denied'
  | 'unavailable';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const STATUS_CONFIG: Record<
  SyncStatus,
  { label: string; sublabel: string; color: string; buttonLabel: string }
> = {
  idle: {
    label: 'Connect your\nwearable',
    sublabel:
      'Sync your Apple Watch or Oura Ring to help Nidush track your stress levels automatically.',
    color: '#5C8D58',
    buttonLabel: 'Start Scanning',
  },
  requesting: {
    label: 'Aguarda\num momento',
    sublabel: 'A solicitar acesso aos teus dados de saúde…',
    color: '#5C8D58',
    buttonLabel: 'A processar…',
  },
  granted: {
    label: 'Tudo ligado!',
    sublabel:
      'O Nidush tem agora acesso aos teus dados de saúde e pode monitorizar os teus níveis de stress.',
    color: '#5C8D58',
    buttonLabel: 'Continuar',
  },
  partial: {
    label: 'Ligação parcial',
    sublabel:
      'Apenas algumas permissões foram concedidas. Podes ajustar as permissões nas definições do Health Connect.',
    color: '#D4A017',
    buttonLabel: 'Continuar mesmo assim',
  },
  denied: {
    label: 'Acesso negado',
    sublabel:
      'Sem acesso ao Health Connect não conseguimos monitorizar o teu stress automaticamente. Podes ativar o acesso nas definições.',
    color: '#C0392B',
    buttonLabel: 'Abrir definições',
  },
  unavailable: {
    label: 'Não disponível',
    sublabel:
      'O Google Health Connect não está disponível neste dispositivo. Podes sincronizar manualmente mais tarde.',
    color: '#8E8E8E',
    buttonLabel: 'Continuar sem sincronizar',
  },
};

// ─── Componente ───────────────────────────────────────────────────────────────
export default function WearableSync({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  const [dims, setDims] = useState(Dimensions.get('window'));
  const [status, setStatus] = useState<SyncStatus>('idle');

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const brandGreen = '#5C8D58';

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) =>
      setDims(window),
    );
    return () => sub.remove();
  }, []);

  useEffect(() => {
    if (
      status === 'granted' ||
      status === 'denied' ||
      status === 'unavailable'
    ) {
      pulseAnim.stopAnimation();
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim, status]);

  const transitionStatus = useCallback(
    (next: SyncStatus) => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        setStatus(next);
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    },
    [fadeAnim],
  );

  const handleConnect = useCallback(async () => {
    if (status === 'granted' || status === 'partial') return onNext();
    if (status === 'unavailable') return onSkip();
    if (status === 'denied') {
      await openHealthConnectSettings();
      return;
    }
    if (Platform.OS !== 'android') {
      transitionStatus('unavailable');
      return;
    }

    transitionStatus('requesting');

    try {
      const sdkStatus = await getSdkStatus();
      if (sdkStatus !== SdkAvailabilityStatus.SDK_AVAILABLE) {
        transitionStatus('unavailable');
        return;
      }

      const isInitialized = await initialize();
      if (!isInitialized) {
        transitionStatus('unavailable');
        return;
      }

      // 1. Array passado diretamente para evitar erros de TS
      const grantedPermissions = await requestPermission([
        { accessType: 'read', recordType: 'Steps' },
        { accessType: 'read', recordType: 'HeartRate' },
      ]);

      if (!grantedPermissions || grantedPermissions.length === 0) {
        transitionStatus('denied');
        return;
      }

      // 2. Verificação atualizada
      const recordsWeNeed: RecordType[] = [
        'Steps',
        'HeartRate',
        'SleepSession',
        'ActiveCaloriesBurned',
        'HeartRateVariabilityRmssd',
      ];
      const grantedTypes = new Set(grantedPermissions.map((p) => p.recordType));
      const allGranted = recordsWeNeed.every((record) =>
        grantedTypes.has(record),
      );

      transitionStatus(allGranted ? 'granted' : 'partial');
    } catch (error) {
      console.error('[HealthConnect] Erro:', error);
      transitionStatus('denied');
    }
  }, [status, onNext, onSkip, transitionStatus]);

  if (!fontsLoaded) return null;

  const isWebPC = dims.width > 768;
  const config = STATUS_CONFIG[status];
  const ringColor =
    status === 'denied'
      ? '#C0392B'
      : status === 'partial'
        ? '#D4A017'
        : brandGreen;

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

  const DeviceIcon = Icons.devices;

  return (
    <View className="flex-1 bg-[#F3F5EE]">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
      >
        <SafeAreaView className="flex-1">
          <View
            style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }}
            className="px-[28px] flex-1"
          >
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
              />
            </View>

            <View className="flex-1 justify-center items-center py-10">
              <View className="items-center justify-center mb-12">
                <Animated.View
                  style={[pulseStyle, { borderColor: ringColor }]}
                  className="absolute w-32 h-32 rounded-full border-2"
                />
                <Animated.View
                  style={[pulseStyle, { borderColor: ringColor }]}
                  className="absolute w-32 h-32 rounded-full border"
                />
                <View className="bg-white w-32 h-32 rounded-full items-center justify-center shadow-xl z-10 border border-[#E4EAD9]">
                  {status === 'requesting' ? (
                    <ActivityIndicator size="large" color={brandGreen} />
                  ) : DeviceIcon ? (
                    <DeviceIcon
                      width={58}
                      height={58}
                      fill={ringColor}
                      color={ringColor}
                    />
                  ) : (
                    <View className="w-16 h-16 bg-gray-200 rounded-full" />
                  )}
                </View>
                <View
                  style={{ backgroundColor: ringColor }}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full border-4 border-[#F3F5EE] items-center justify-center z-20"
                >
                  <View className="w-1.5 h-1.5 bg-white rounded-full" />
                </View>
              </View>

              <Animated.View
                style={{ opacity: fadeAnim }}
                className="items-center"
              >
                <Text
                  style={{
                    fontFamily: 'Nunito_700Bold',
                    fontSize: isWebPC ? 42 : 36,
                  }}
                  className="text-[#3E545C] text-center leading-tight tracking-[-0.5px]"
                >
                  {config.label}
                </Text>
                <Text
                  style={{
                    fontFamily: 'Nunito_400Regular',
                    fontSize: isWebPC ? 18 : 17,
                  }}
                  className="text-[#3E545C] text-center mt-6 opacity-80 leading-[26px] px-4"
                >
                  {config.sublabel}
                </Text>
              </Animated.View>

              <View className="mt-12 w-full items-center">
                <TouchableOpacity
                  onPress={handleConnect}
                  activeOpacity={0.8}
                  disabled={status === 'requesting'}
                  style={{ backgroundColor: ringColor }}
                  className={`${isWebPC ? 'w-[300px] h-[64px]' : 'w-[260px] h-[60px]'} rounded-full justify-center items-center shadow-lg mb-6`}
                >
                  <Text
                    style={{
                      fontFamily: 'Nunito_700Bold',
                      fontSize: isWebPC ? 20 : 18,
                    }}
                    className="text-white"
                  >
                    {config.buttonLabel}
                  </Text>
                </TouchableOpacity>

                {(status === 'idle' || status === 'requesting') && (
                  <TouchableOpacity onPress={onSkip} activeOpacity={0.6}>
                    <Text
                      style={{ fontFamily: 'Nunito_600SemiBold', fontSize: 16 }}
                      className="text-[#3E545C] opacity-50"
                    >
                      I&apos;ll do this later
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}
