import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type ConsentStepProps = {
  title: string;
  description: string;
  bullets: string[];
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>['name'];
  accentColor: string;
  badgeText: string;
  note?: string;
};

export default function ConsentStep({
  title,
  description,
  bullets,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  icon,
  accentColor,
  badgeText,
  note,
}: ConsentStepProps) {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });
  const [dims, setDims] = useState(Dimensions.get('window'));

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) =>
      setDims(window),
    );
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) return null;

  const isWebPC = dims.width > 768;

  return (
    <View
      className="flex-1 bg-[#F3F5EE]"
      accessible
      accessibilityLabel={`${badgeText} consent screen`}
    >
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
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 36 }}
        bounces={false}
        showsVerticalScrollIndicator={false}
        style={{ zIndex: 10 }}
      >
        <SafeAreaView className="flex-1">
          <View
            style={{ maxWidth: 640, width: '100%', alignSelf: 'center' }}
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
                accessible
                accessibilityLabel="Nidush logo"
              />
            </View>

            <View className="flex-1 py-6 min-h-full">
              <View className="items-center mb-10">
                <View
                  className="w-32 h-32 rounded-full items-center justify-center border"
                  style={{
                    backgroundColor: `${accentColor}18`,
                    borderColor: `${accentColor}33`,
                  }}
                >
                  <MaterialCommunityIcons name={icon} size={62} color={accentColor} />
                </View>

                <View
                  className="mt-5 px-4 py-2 rounded-full flex-row items-center"
                  style={{ backgroundColor: `${accentColor}18` }}
                >
                  <Ionicons name="shield-checkmark" size={16} color={accentColor} />
                  <Text
                    className="ml-2"
                    style={{ fontFamily: 'Nunito_700Bold', color: accentColor }}
                  >
                    {badgeText}
                  </Text>
                </View>
              </View>

              <Text
                maxFontSizeMultiplier={1.2}
                style={{ fontFamily: 'Nunito_700Bold', fontSize: isWebPC ? 40 : 34 }}
                className="text-[#3E545C] text-center leading-tight"
                accessibilityRole="header"
              >
                {title}
              </Text>

              <Text
                maxFontSizeMultiplier={1.2}
                style={{ fontFamily: 'Nunito_400Regular', fontSize: isWebPC ? 18 : 17 }}
                className="text-[#3E545C] text-center mt-5 opacity-80 leading-[26px]"
              >
                {description}
              </Text>

              <View className="bg-white/90 border border-[#E1E8DA] rounded-[28px] px-5 py-6 mt-8">
                {bullets.map((bullet) => (
                  <View key={bullet} className="flex-row items-start mb-4 last:mb-0">
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={accentColor}
                      style={{ marginTop: 2, marginRight: 12 }}
                    />
                    <Text
                      className="flex-1 text-[#42575B] leading-6"
                      style={{ fontFamily: 'Nunito_400Regular' }}
                    >
                      {bullet}
                    </Text>
                  </View>
                ))}
              </View>

              {note ? (
                <Text
                  className="text-center text-[#6C7A74] mt-5 leading-6"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  {note}
                </Text>
              ) : null}

              <View className="mt-10 w-full items-center pb-6">
                <TouchableOpacity
                  onPress={onPrimary}
                  activeOpacity={0.85}
                  style={{ backgroundColor: accentColor }}
                  className={`${isWebPC ? 'w-[320px] h-[64px]' : 'w-full h-[60px]'} rounded-full justify-center items-center shadow-lg mb-5`}
                >
                  <Text
                    maxFontSizeMultiplier={1.2}
                    style={{ fontFamily: 'Nunito_700Bold', fontSize: isWebPC ? 20 : 18 }}
                    className="text-white"
                  >
                    {primaryLabel}
                  </Text>
                </TouchableOpacity>

                {secondaryLabel && onSecondary ? (
                  <TouchableOpacity onPress={onSecondary} activeOpacity={0.65}>
                    <Text
                      maxFontSizeMultiplier={1.2}
                      style={{ fontFamily: 'Nunito_600SemiBold', fontSize: 16 }}
                      className="text-[#3E545C] opacity-60"
                    >
                      {secondaryLabel}
                    </Text>
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>
          </View>
        </SafeAreaView>
      </ScrollView>
    </View>
  );
}
