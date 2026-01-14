import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

type Props = {
  onFinish: () => void;
};

export default function ActivitySelection({ onFinish }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggleActivity = (id: string) => {
    if (selected.includes(id)) setSelected(selected.filter(i => i !== id));
    else setSelected([...selected, id]);
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F9FAF7]">
      <View className="flex-1 px-[28px]">
        
        <View className="items-center h-[60px] justify-center mt-4">
          <Text className="text-xl text-[#2F4F4F] font-bold">
            Welcome
          </Text>
        </View>

        <ScrollView 
          contentContainerStyle={{ paddingBottom: 140 }} 
          showsVerticalScrollIndicator={false}
        >
          <View className="mt-8">
            <Text className="text-[32px] text-[#2F4F4F] leading-[38px] font-bold">
              Select the activities{"\n"}that you like
            </Text>

            <View className="flex-row flex-wrap justify-between mt-8">
              {ACTIVITIES.map((item) => {
                const isSelected = selected.includes(item.id);
                return (
                  <TouchableOpacity
                    key={item.id}
                    onPress={() => toggleActivity(item.id)}
                    activeOpacity={0.8}
                    testID={`activity-${item.id}`}
                    className={`w-[48%] h-[145px] rounded-[28px] justify-center items-center mb-4 border-[3px] 
                      ${isSelected ? 'border-[#548F53] bg-[#C8E2C8]' : 'border-transparent bg-[#BBDABA]'}`}
                  >
                    <MaterialIcons name={item.icon} size={48} color="#354F52" />
                    
                    <Text className="text-[#354F52] mt-2 font-medium">
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

        <View className="absolute bottom-10 left-[28px] right-[28px]">
          <TouchableOpacity
            onPress={onFinish}
            disabled={selected.length === 0}
            testID="enter-button"
            className={`h-[60px] rounded-full justify-center items-center bg-[#548F53] 
              ${selected.length > 0 ? 'opacity-100' : 'opacity-40'}`}
          >
            <Text className="text-lg text-white font-bold">
              Enter my safe space
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}