import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, Image, Dimensions, Animated, Easing, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icons } from '../../assets/assets'; 

export default function WearableSync({ onNext, onSkip }: { onNext: () => void, onSkip: () => void }) {
  const [dims, setDims] = useState(Dimensions.get('window'));
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const brandGreen = "#5C8D58";

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub.remove();
  }, []);

  const isWebPC = dims.width > 768;

  useEffect(() => {
    Animated.loop(
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      })
    ).start();
  }, [pulseAnim]);

  const pulseStyle = {
    transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 2] }) }],
    opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] }),
  };

  const DeviceIcon = Icons.devices;

  return (
    <View className="flex-1 bg-[#F3F5EE]">
      
      {/* Wave de Fundo  */}
      <View 
        className="absolute bottom-0 left-0 right-0 overflow-hidden" 
        style={{ width: dims.width, height: dims.height * 0.18, zIndex: 1 }} 
        pointerEvents="none"
      >
        <Image 
          source={require('../../assets/images/Wave2.png')} 
          className="w-full absolute bottom-0" 
          style={{ width: dims.width, height: dims.height * 0.45 }} 
          resizeMode="stretch" 
        />
      </View>

      <ScrollView contentContainerStyle={{ flexGrow: 1 }} bounces={false} showsVerticalScrollIndicator={false} style={{ zIndex: 10 }}>
        <SafeAreaView className="flex-1">
          
          <View 
            style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }} 
            className="px-[28px] flex-1"
          >
            
            <View className={`items-center ${isWebPC ? 'mt-[30px] mb-[10px]' : 'mt-[15px]'} h-[60px] justify-center`}>
              <Image 
                source={require('../../assets/images/Logo.png')} 
                style={{ 
                  width: isWebPC ? 100 : 130, 
                  height: isWebPC ? 35 : 45 
                }} 
                resizeMode="contain" 
              />
            </View>

            <View className="flex-1 justify-center items-center py-10">
              
              <View className="items-center justify-center mb-12">
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
                    <DeviceIcon width={58} height={58} fill={brandGreen} color={brandGreen} />
                  ) : (
                    <View className="w-16 h-16 bg-gray-200 rounded-full" />
                  )}
                </View>

                <View className="absolute -top-2 -right-2 bg-[#5C8D58] w-6 h-6 rounded-full border-4 border-[#F3F5EE] items-center justify-center z-20">
                   <View className="w-1.5 h-1.5 bg-white rounded-full" />
                </View>
              </View>
              
              <Text 
                style={{ fontFamily: 'Nunito-ExtraBold', fontSize: isWebPC ? 42 : 36 }} 
                className="text-[#3E545C] text-center leading-tight tracking-[-0.5px]"
              >
                Connect your{"\n"}wearable
              </Text>
              
              <Text 
                style={{ fontFamily: 'Nunito-Regular', fontSize: isWebPC ? 18 : 17 }} 
                className="text-[#3E545C] text-center mt-6 opacity-80 leading-[26px] px-4"
              >
                Sync your Apple Watch or Oura Ring to help Nidush track your stress levels automatically.
              </Text>

              <View className="mt-12 w-full items-center">
                <TouchableOpacity 
                  onPress={onNext}
                  activeOpacity={0.8}
                  className={`${isWebPC ? 'w-[300px] h-[64px]' : 'w-[260px] h-[60px]'} bg-[#5C8D58] rounded-full justify-center items-center shadow-lg mb-6 active:scale-95`}
                >
                  <Text 
                    style={{ fontFamily: 'Nunito-ExtraBold', fontSize: isWebPC ? 20 : 18 }} 
                    className="text-white"
                  >
                    Start Scanning
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={onSkip} activeOpacity={0.6}>
                  <Text 
                    style={{ fontFamily: 'Nunito-SemiBold', fontSize: 16 }} 
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