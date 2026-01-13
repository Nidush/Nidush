import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';

type MaterialIconName = React.ComponentProps<typeof MaterialIcons>['name'];

const ACTIVITIES = [
  { id: 'Meditation', icon: 'self-improvement' as MaterialIconName },
  { id: 'Deep Breathing', icon: 'air' as MaterialIconName },
  { id: 'Yoga', icon: 'fitness-center' as MaterialIconName },
  { id: 'Journaling', icon: 'edit' as MaterialIconName },
  { id: 'Reading', icon: 'menu-book' as MaterialIconName },
  { id: 'Music', icon: 'headset' as MaterialIconName },
  { id: 'Walking', icon: 'directions-walk' as MaterialIconName },
  { id: 'Nature Sounds', icon: 'landscape' as MaterialIconName },
];

export default function ActivitySelection({ onFinish }: { onFinish: () => void }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleActivity = (id: string) => {
    if (selected.includes(id)) {
      setSelected(selected.filter(i => i !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-[#F9FAF7] px-7">
        
        <View className="items-center h-[60px] justify-center mt-4">
           <Text style={{ fontFamily: 'Nunito_700Bold' }} className="text-xl color-[#2F4F4F]">
            Welcome
          </Text>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
          <View className="mt-8">
            <Text style={{ fontFamily: 'Nunito_700Bold' }} className="text-[32px] color-[#2F4F4F] leading-tight">
              Select the activities{"\n"}that you like
            </Text>
            
            <Text style={{ fontFamily: 'Nunito_600SemiBold' }} className="text-[16px] color-[#6A7D5B] mt-4 leading-[22px]">
              Select the moments that help you breathe.
            </Text>

            {/* Grid de Atividades */}
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

        <View className="absolute bottom-10 left-0 right-0 items-center">
          <TouchableOpacity 
            onPress={onFinish}
            activeOpacity={0.9}
            disabled={selected.length === 0}
            className={`h-[60px] w-[260px] rounded-full justify-center items-center shadow-md ${
              selected.length > 0 ? 'bg-[#548F53]' : 'bg-[#548F53] opacity-40'
            }`}
          >
            <Text style={{ fontFamily: 'Nunito_700Bold' }} className="text-white text-lg">
              Enter my safe space
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}