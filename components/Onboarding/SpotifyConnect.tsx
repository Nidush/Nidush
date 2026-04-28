import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  Easing,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSpotify } from '../../context/SpotifyContext';

export default function SpotifyConnect({
  onNext,
  onSkip,
}: {
  onNext: () => void;
  onSkip: () => void;
}) {
  const { login, isAuthenticated, userProfile } = useSpotify();
  const [isConnecting, setIsConnecting] = useState(false);

  const [fontsLoaded] = useFonts({
    Nunito_400Regular: Nunito_400Regular,
    Nunito_600SemiBold: Nunito_600SemiBold,
    Nunito_700Bold: Nunito_700Bold,
  });

  const [dims, setDims] = useState(Dimensions.get('window'));
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const spotifyGreen = '#1DB954';

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) =>
      setDims(window),
    );
    return () => sub.remove();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 20000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ).start();
  }, [rotateAnim]);

  // (Auto-advance removed per user request)

  if (!fontsLoaded) return null;

  const isWebPC = dims.width > 768;

  const rotation = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      await login();
    } catch (error) {
      console.error('Spotify login failed', error);
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <View
      className="flex-1 bg-[#F3F5EE]"
      accessible
      accessibilityLabel="Spotify connection screen"
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
              {/* Spotify Logo Display or Profile */}
              <View
                className="items-center justify-center mb-12"
                accessible={false}
                importantForAccessibility="no-hide-descendants"
              >
                <Animated.View
                  style={{ transform: [{ rotate: rotation }] }}
                  className="absolute w-40 h-40 rounded-full border border-dashed border-[#1DB954] opacity-30"
                />

                <View className="bg-[#191414] w-32 h-32 rounded-full items-center justify-center shadow-2xl z-10 border border-[#282828] overflow-hidden">
                  {isAuthenticated && userProfile?.images?.[0]?.url ? (
                    <Image 
                      source={{ uri: userProfile.images[0].url }} 
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  ) : (
                    <MaterialCommunityIcons name="spotify" size={68} color="#1DB954" />
                  )}
                </View>

                <View className="absolute -bottom-2 -right-2 bg-[#1DB954] w-10 h-10 rounded-full border-4 border-[#F3F5EE] items-center justify-center z-20 shadow-md">
                   <Ionicons name={isAuthenticated ? "checkmark" : "musical-notes"} size={20} color="white" />
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
                {isAuthenticated 
                  ? `Welcome, ${userProfile?.display_name || 'Music Lover'}!` 
                  : "Set the mood\nwith Spotify"}
              </Text>

              {/* Descrição */}
              <Text
                maxFontSizeMultiplier={1.2}
                style={{
                  fontFamily: 'Nunito_400Regular',
                  fontSize: isWebPC ? 18 : 17,
                }}
                className="text-[#3E545C] text-center mt-6 opacity-80 leading-[26px] px-4"
                accessibilityLabel={isAuthenticated 
                  ? "Your account is connected. We'll use your music profile to tailor your experience."
                  : "Connect your Spotify account to play your favorite playlists automatically with each scenario."}
              >
                {isAuthenticated 
                  ? "Your account is connected. We'll use your music profile to tailor your experience."
                  : "Connect your Spotify account to play your favorite playlists automatically with each scenario."}
              </Text>

              {/* Botões */}
              <View className="mt-12 w-full items-center">
                {!isAuthenticated ? (
                  <>
                    <TouchableOpacity
                      onPress={handleConnect}
                      disabled={isConnecting}
                      activeOpacity={0.8}
                      style={{ backgroundColor: spotifyGreen }}
                      className={`${isWebPC ? 'w-[300px] h-[64px]' : 'w-[260px] h-[60px]'} rounded-full justify-center items-center shadow-lg mb-6 active:scale-95 flex-row gap-3`}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel="Connect with Spotify"
                      accessibilityHint="Opens Spotify login to link your account"
                    >
                      {isConnecting ? (
                        <ActivityIndicator color="white" />
                      ) : (
                        <>
                          <MaterialCommunityIcons name="spotify" size={24} color="white" />
                          <Text
                            maxFontSizeMultiplier={1.2}
                            style={{
                              fontFamily: 'Nunito_700Bold',
                              fontSize: isWebPC ? 20 : 18,
                            }}
                            className="text-white"
                          >
                            Connect Spotify
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={onSkip}
                      activeOpacity={0.6}
                      accessible
                      accessibilityRole="button"
                      accessibilityLabel="Skip Spotify connection"
                      accessibilityHint="I will connect my Spotify account later"
                    >
                      <Text
                        maxFontSizeMultiplier={1.2}
                        style={{ fontFamily: 'Nunito_600SemiBold', fontSize: 16 }}
                        className="text-[#3E545C] opacity-50"
                      >
                        I&apos;ll do this later
                      </Text>
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity
                    onPress={onNext}
                    activeOpacity={0.8}
                    style={{ backgroundColor: '#3E545C' }}
                    className={`${isWebPC ? 'w-[300px] h-[64px]' : 'w-[260px] h-[60px]'} rounded-full justify-center items-center shadow-lg mb-6 active:scale-95 flex-row gap-3`}
                  >
                    <Text
                      maxFontSizeMultiplier={1.2}
                      style={{
                        fontFamily: 'Nunito_700Bold',
                        fontSize: isWebPC ? 20 : 18,
                      }}
                      className="text-white"
                    >
                      Continue
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
