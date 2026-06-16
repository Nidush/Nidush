import { MaterialIcons } from '@expo/vector-icons';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AVATAR_PRESET_MAP,
  AvatarPresetKey,
  DEFAULT_AVATAR_PRESET,
  getAvatarSource,
  isAvatarPreset,
} from '../../utils/avatarSource';

type ProfileAvatarStepProps = {
  avatarValue: string | null;
  userName?: string;
  onChoosePreset: (value: AvatarPresetKey) => void;
  onChooseCustomPhoto: () => Promise<void>;
  onNext: () => void;
};

const presetOptions = [
  { key: 'preset:profile' as AvatarPresetKey, label: 'Avatar 1' },
  { key: 'preset:profile1' as AvatarPresetKey, label: 'Avatar 2' },
  { key: 'preset:profile2' as AvatarPresetKey, label: 'Avatar 3' },
  { key: 'preset:profile3' as AvatarPresetKey, label: 'Avatar 4' },
];

export default function ProfileAvatarStep({
  avatarValue,
  userName,
  onChoosePreset,
  onChooseCustomPhoto,
  onNext,
}: ProfileAvatarStepProps) {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });
  const [dims, setDims] = React.useState(Dimensions.get('window'));

  React.useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) =>
      setDims(window),
    );
    return () => sub.remove();
  }, []);

  if (!fontsLoaded) return null;

  const isWebPC = dims.width > 768;
  const previewSource = getAvatarSource(avatarValue || DEFAULT_AVATAR_PRESET);
  const selectedPreset = isAvatarPreset(avatarValue) ? avatarValue : null;
  const isDefaultLogo = !avatarValue || avatarValue === DEFAULT_AVATAR_PRESET;

  return (
    <View className="flex-1 bg-[#F3F5EE]" accessible accessibilityLabel="Profile avatar setup screen">
      <StatusBar style="dark" />

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
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 18 }}
        showsVerticalScrollIndicator={false}
        style={{ zIndex: 10 }}
      >
        <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
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
                accessible
                accessibilityLabel="Nidush logo"
              />
            </View>

            <View className={isWebPC ? 'mt-[10px]' : 'mt-[6px]'}>
              <Text
                className="text-[34px] text-[#3E545C] tracking-[-0.5px] leading-tight"
                style={{ fontFamily: 'Nunito_700Bold' }}
                accessibilityRole="header"
              >
                Choose your{'\n'}profile look
              </Text>

              <Text
                className="text-[14px] text-[#3E545C] mt-[6px] mb-[16px] leading-[20px] opacity-90"
                style={{ fontFamily: 'Nunito_400Regular' }}
              >
                Start with a Nidush image, or change it anytime with a photo from your gallery.
              </Text>

              <View className="items-center mt-[2px]">
                <View className="w-28 h-28 rounded-full overflow-hidden border-[4px] border-[#DDE8D7] bg-white shadow-sm items-center justify-center">
                  <Image
                    source={previewSource}
                    style={{
                      width: isDefaultLogo ? 72 : '100%',
                      height: isDefaultLogo ? 72 : '100%',
                    }}
                    resizeMode={isDefaultLogo ? 'contain' : 'cover'}
                    accessibilityRole="image"
                    accessibilityLabel={`Profile picture preview${userName ? ` for ${userName}` : ''}`}
                  />
                </View>
                <Text
                  className="text-[#354F52] text-base mt-2"
                  style={{ fontFamily: 'Nunito_700Bold' }}
                >
                  {userName || 'Your profile'}
                </Text>
              </View>

              <View className="bg-white/90 border border-[#E1E8DA] rounded-[24px] px-4 py-4 mt-4">
                <Text
                  className="text-[#354F52] text-[15px] mb-3"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                >
                  Pick a Nidush style
                </Text>

                <View className="flex-row justify-between">
                  {presetOptions.map((preset) => {
                    const isSelected = selectedPreset === preset.key;

                    return (
                      <TouchableOpacity
                        key={preset.key}
                        onPress={() => onChoosePreset(preset.key)}
                        activeOpacity={0.85}
                        className="items-center"
                        style={{ width: '23%' }}
                        accessibilityRole="button"
                        accessibilityLabel={`Choose ${preset.label} style`}
                      >
                        <View
                          className={`w-[62px] h-[62px] rounded-full overflow-hidden border-[3px] bg-white items-center justify-center ${isSelected ? 'border-[#5B8C51]' : 'border-[#DDE8D7]'}`}
                        >
                          <Image
                            source={AVATAR_PRESET_MAP[preset.key]}
                            style={{ width: '100%', height: '100%' }}
                            resizeMode="cover"
                            accessible={false}
                          />
                        </View>
                        <Text
                          className={`mt-2 text-[10px] text-center ${isSelected ? 'text-[#354F52]' : 'text-[#6C7A74]'}`}
                          style={{ fontFamily: isSelected ? 'Nunito_700Bold' : 'Nunito_600SemiBold' }}
                        >
                          {preset.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                onPress={() => void onChooseCustomPhoto()}
                activeOpacity={0.85}
                className="w-full mt-4 rounded-[20px] border border-[#D6E2CF] bg-white px-4 py-3 flex-row items-center"
                accessibilityRole="button"
                accessibilityLabel="Choose a custom profile photo"
              >
                <View className="w-10 h-10 rounded-full bg-[#E7F0E3] items-center justify-center mr-3">
                  <MaterialIcons name="photo-camera" size={20} color="#5B8C51" />
                </View>
                <View className="flex-1">
                  <Text
                    className="text-[#354F52] text-[14px]"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    Use your own photo
                  </Text>
                  <Text
                    className="text-[#6C7A74] text-[11px] mt-1"
                    style={{ fontFamily: 'Nunito_400Regular' }}
                  >
                    Pick a square image from your gallery.
                  </Text>
                </View>
                <MaterialIcons name="chevron-right" size={28} color="#7B8B84" />
              </TouchableOpacity>

              <View className="mt-5 items-center pb-3">
                <TouchableOpacity
                  onPress={onNext}
                  activeOpacity={0.9}
                  className={`${isWebPC ? 'w-[320px] h-[60px]' : 'w-full h-[52px]'} rounded-full bg-[#5C8D58] justify-center items-center shadow-sm`}
                  accessibilityRole="button"
                  accessibilityLabel="Continue to the next onboarding step"
                >
                  <Text
                    className="text-white text-[16px]"
                    style={{ fontFamily: 'Nunito_700Bold' }}
                  >
                    Continue
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
