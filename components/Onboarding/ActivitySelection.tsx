import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

const ACTIVITIES = [
  { id: 'Meditation', icon: 'self-improvement' as MaterialIconName },
  { id: 'Deep Breathing', icon: 'air' as MaterialIconName },
  { id: 'Yoga', icon: 'fitness-center' as MaterialIconName },
  { id: 'Reading', icon: 'menu-book' as MaterialIconName },
];

type Props = {
  onFinish: () => void;
};

export default function ActivitySelection({ onFinish }: Props) {
  const [selected, setSelected] = useState<string[]>([]);
  const [dims, setDims] = useState(Dimensions.get('window'));

  useEffect(() => {
    const sub = Dimensions.addEventListener('change', ({ window }) => setDims(window));
    return () => sub.remove();
  }, []);

  const isWebPC = dims.width > 768;

  const toggleActivity = (id: string) => {
    if (selected.includes(id)) setSelected(selected.filter(i => i !== id));
    else setSelected([...selected, id]);
  };

  return (
    <View className="flex-1 bg-[#F9FAF7]">
      <StatusBar style="dark" />

      {/* Wave de Fundo */}
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

      <SafeAreaView className="flex-1" style={{ zIndex: 10 }}>
        
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

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 200 }}>
            <View className={isWebPC ? 'mt-[10px]' : 'mt-[25px]'}>
              <Text 
                style={{ fontFamily: 'Nunito_700Bold' }} 
                className="text-[32px] color-[#2F4F4F] leading-tight"
              >
                Select the activities{"\n"}that you like
              </Text>
              
              <Text 
                style={{ fontFamily: 'Nunito_600SemiBold' }} 
                className="text-[16px] color-[#6A7D5B] mt-4 leading-[22px]"
              >
                Select the moments that help you breathe.
              </Text>

              <View className="flex-row flex-wrap justify-between mt-8">
                {ACTIVITIES.map((item) => {
                  const isSelected = selected.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      onPress={() => toggleActivity(item.id)}
                      activeOpacity={0.8}
                      className={`w-[48%] h-[145px] rounded-[28px] justify-center items-center mb-4 border-[3px] relative ${
                        isSelected ? 'bg-[#C8E2C8] border-[#548F53]' : 'bg-[#BBDABA] border-transparent'
                      }`}
                    >
                      <MaterialIcons name={item.icon} size={48} color="#354F52" />
                      <Text 
                        style={{ fontFamily: 'Nunito_700Bold' }} 
                        className="text-[15px] color-[#2F4F4F] mt-3 text-center px-2"
                      >
                        {item.id}
                      </Text>
                      {isSelected && (
                        <View className="absolute top-3 right-3">
                          <Ionicons name="checkmark-circle" size={24} color="#548F53" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </ScrollView>
        </View>

        <View 
          className="absolute bottom-24 left-0 right-0 items-center"
          style={{ zIndex: 20 }}
        >
          <TouchableOpacity 
            onPress={onFinish}
            disabled={selected.length === 0}
            className={`h-[60px] ${isWebPC ? 'w-[300px]' : 'w-[260px]'} rounded-full justify-center items-center shadow-md ${
              selected.length > 0 ? 'bg-[#548F53]' : 'bg-[#548F53] opacity-40'
            }`}
          >
            <Text className="text-lg text-white font-bold">
              Enter my safe space
            </Text>
          </TouchableOpacity>
        </View>

      </SafeAreaView>
    </View>
  );
}