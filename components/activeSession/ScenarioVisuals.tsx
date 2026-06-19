import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Text, useWindowDimensions, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type ScenarioDeviceState = {
  deviceId: string;
  state: 'on' | 'off';
  value?: number | string;
  brightness?: string;
  color?: string;
  temperature?: number;
  mode?: string;
  deviceName?: string;
  deviceType?: string;
};

interface ScenarioVisualsProps {
  title: string;
  room: string;
  devices: ScenarioDeviceState[];
}

const getDeviceIcon = (type?: string) => {
  switch (String(type ?? '').toLowerCase()) {
    case 'light':
      return { family: 'material', name: 'lightbulb-outline' as const };
    case 'difuser':
    case 'diffuser':
      return { family: 'community', name: 'flask-round-bottom' as const };
    case 'speaker':
      return { family: 'material', name: 'speaker' as const };
    default:
      return { family: 'community', name: 'power-plug-outline' as const };
  }
};

const getDeviceAccent = (device: ScenarioDeviceState) => {
  const type = String(device.deviceType ?? '').toLowerCase();
  if (type === 'light') {
    return {
      swatch:
        typeof device.color === 'string' && device.color.trim()
          ? device.color
          : null,
      label: formatDeviceValue(device),
    };
  }

  return {
    swatch: null,
    label: formatDeviceValue(device),
  };
};

const formatDeviceValue = (device: ScenarioDeviceState) => {
  const type = String(device.deviceType ?? '').toLowerCase();

  if (type === 'light') {
    const raw = device.brightness ?? device.value;
    if (typeof raw === 'number') return `${raw}%`;
    if (typeof raw === 'string' && raw.trim()) return raw;
    return device.state === 'on' ? 'On' : 'Off';
  }

  if (typeof device.value === 'string' && device.value.trim()) {
    return device.value;
  }

  if (typeof device.mode === 'string' && device.mode.trim()) {
    return device.mode;
  }

  return device.state === 'on' ? 'Active' : 'Off';
};

export const ScenarioVisuals = ({
  title,
  room,
  devices,
}: ScenarioVisualsProps) => {
  const { height } = useWindowDimensions();
  const breathAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const rotateAnimReverse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathAnim, {
          toValue: 1,
          duration: 3800,
          useNativeDriver: true,
          easing: Easing.bezier(0.42, 0, 0.58, 1),
        }),
        Animated.timing(breathAnim, {
          toValue: 0,
          duration: 3800,
          useNativeDriver: true,
          easing: Easing.bezier(0.42, 0, 0.58, 1),
        }),
      ]),
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 12000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();

    Animated.loop(
      Animated.timing(rotateAnimReverse, {
        toValue: 1,
        duration: 15000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [breathAnim, rotateAnim, rotateAnimReverse]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
  const spinReverse = rotateAnimReverse.interpolate({
    inputRange: [0, 1],
    outputRange: ['360deg', '0deg'],
  });
  const coreScale = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.96, 1.02],
  });
  const midScale = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.0, 1.14],
  });
  const outerScale = breathAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1.02, 1.18],
  });

  const featuredDevices = devices.slice(0, 4);
  const compactLayout = height < 820;
  const orbSize = compactLayout ? 182 : 202;
  const outerSize = compactLayout ? 286 : 310;
  const midSize = compactLayout ? 232 : 250;
  const orbAreaHeight = compactLayout ? 292 : 328;

  return (
    <View className="px-6 pt-2">
      <View
        className="items-center justify-center relative"
        style={{ height: orbAreaHeight }}
      >
        <Animated.View
          style={{
            transform: [{ rotate: spinReverse }, { scale: outerScale }],
            position: 'absolute',
            width: outerSize,
            height: outerSize - 10,
            backgroundColor: '#86E6A0',
            opacity: 0.16,
            borderRadius: 160,
            borderTopLeftRadius: 140,
            borderTopRightRadius: 210,
            borderBottomLeftRadius: 190,
            borderBottomRightRadius: 150,
          }}
        />
        <Animated.View
          style={{
            transform: [{ rotate: spin }, { scale: midScale }],
            position: 'absolute',
            width: midSize,
            height: midSize,
            backgroundColor: '#8BE39B',
            opacity: 0.22,
            borderRadius: 140,
            borderTopLeftRadius: 150,
            borderTopRightRadius: 110,
            borderBottomLeftRadius: 120,
            borderBottomRightRadius: 170,
          }}
        />
        <Animated.View
          style={{
            transform: [{ scale: coreScale }],
            width: orbSize,
            height: orbSize,
            zIndex: 10,
          }}
        >
          <LinearGradient
            colors={['#7BC76E', '#629D58']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{
              width: '100%',
              height: '100%',
              borderRadius: orbSize / 2,
              alignItems: 'center',
              justifyContent: 'center',
              paddingHorizontal: 24,
              shadowColor: '#8BE39B',
              shadowOpacity: 0.22,
              shadowRadius: 24,
              shadowOffset: { width: 0, height: 10 },
            }}
          >
            <Text
              maxFontSizeMultiplier={1.2}
              className="text-white text-center mb-4"
              style={{
                fontFamily: 'Nunito_700Bold',
                fontSize: compactLayout ? 34 : 38,
                lineHeight: compactLayout ? 36 : 40,
              }}
              numberOfLines={2}
            >
              {title}
            </Text>
            <View className="flex-row items-center">
              <MaterialCommunityIcons name="door" size={20} color="white" />
              <Text
                maxFontSizeMultiplier={1.2}
                className="text-white ml-2"
                style={{
                  fontFamily: 'Nunito_600SemiBold',
                  fontSize: compactLayout ? 18 : 20,
                }}
              >
                {room}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>
      </View>

      {featuredDevices.length > 0 ? (
        <View className="flex-row flex-wrap justify-between mt-6">
          {featuredDevices.map((device) => {
            const icon = getDeviceIcon(device.deviceType);
            const accent = getDeviceAccent(device);
            return (
              <View
                key={`${device.deviceId}-${device.deviceName}`}
                className="w-[48%] rounded-[20px] border border-[#9EC698] bg-[#F5F7F0] px-3.5 py-3.5 mb-3"
              >
                <View className="flex-row items-center mb-3">
                  {icon.family === 'material' ? (
                    <MaterialIcons
                      name={icon.name as any}
                      size={28}
                      color="#39535A"
                    />
                  ) : (
                    <MaterialCommunityIcons
                      name={icon.name as any}
                      size={28}
                      color="#39535A"
                    />
                  )}
                  <Text
                    maxFontSizeMultiplier={1.2}
                    className="text-[#39535A] text-lg ml-2.5 flex-1"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                    numberOfLines={1}
                  >
                    {device.deviceName || 'Device'}
                  </Text>
                </View>
                <View className="flex-row items-center">
                  {accent.swatch ? (
                    <View
                      className="w-5 h-5 rounded-full mr-2"
                      style={{ backgroundColor: accent.swatch }}
                    />
                  ) : null}
                  <Text
                    maxFontSizeMultiplier={1.2}
                    className="text-[#6B7C76] text-sm"
                    style={{ fontFamily: 'Nunito_600SemiBold' }}
                    numberOfLines={1}
                  >
                    {accent.label}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      ) : null}
    </View>
  );
};
