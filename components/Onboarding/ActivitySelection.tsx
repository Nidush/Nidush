import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
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

export default function ActivitySelection({ onFinish }: { onFinish: () => void }) {
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
      
      <SafeAreaView className="flex-1">
        {/* CONTAINER CENTRAL  */}
        <View 
          style={{ maxWidth: 600, width: '100%', alignSelf: 'center' }} 
          className="flex-1 px-[28px]"
        >
          
          {/* Header */}
          <View className={`items-center justify-center ${isWebPC ? 'mt-[30px] mb-[10px]' : 'mt-4'} h-[60px]`}>
            <Text 
              style={{ fontFamily: 'Nunito-Bold' }} 
              className="text-xl text-[#2F4F4F]"
            >
              Welcome
            </Text>
          </View>

          <ScrollView 
            contentContainerStyle={{ paddingBottom: isWebPC ? 40 : 140 }} 
            showsVerticalScrollIndicator={false}
          >
            <View className={isWebPC ? 'mt-4' : 'mt-8'}>
              <Text 
                style={{ fontFamily: 'Nunito-ExtraBold' }} 
                className="text-[32px] text-[#2F4F4F] leading-[38px]"
              >
                Select the activities{"\n"}that you like
              </Text>

              {/* Grid Atividades */}
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
                      
                      <Text 
                        style={{ fontFamily: 'Nunito-SemiBold' }} 
                        className="text-[#354F52] mt-2"
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

            {isWebPC && (
               <TouchableOpacity
               onPress={onFinish}
               disabled={selected.length === 0}
               testID="enter-button-web"
               className={`h-[60px] rounded-full justify-center items-center bg-[#548F53] mt-8 mb-10
                 ${selected.length > 0 ? 'opacity-100' : 'opacity-40'}`}
             >
               <Text style={{ fontFamily: 'Nunito-Bold' }} className="text-lg text-white">
                 Enter my safe space
               </Text>
             </TouchableOpacity>
            )}
          </ScrollView>

          {!isWebPC && (
            <View className="absolute bottom-10 left-[28px] right-[28px]">
              <TouchableOpacity
                onPress={onFinish}
                disabled={selected.length === 0}
                testID="enter-button"
                className={`h-[60px] rounded-full justify-center items-center bg-[#548F53] 
                  ${selected.length > 0 ? 'opacity-100' : 'opacity-40'}`}
              >
                <Text style={{ fontFamily: 'Nunito-Bold' }} className="text-lg text-white">
                  Enter my safe space
                </Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </SafeAreaView>
    </View>
  );
}