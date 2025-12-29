// import React, { useState } from 'react';
// import { View, Text, ImageBackground, TouchableOpacity, ScrollView, Dimensions, Image, Switch } from 'react-native';
// import { useLocalSearchParams, router } from 'expo-router';
// import { Ionicons, MaterialCommunityIcons, MaterialIcons, Feather } from '@expo/vector-icons';
// import { LinearGradient } from 'expo-linear-gradient';
// import { SafeAreaView } from 'react-native-safe-area-context';

// const { width } = Dimensions.get('window');

// export default function ActivityDetails() {
//   const params = useLocalSearchParams();
//   const [notificationsEnabled, setNotificationsEnabled] = useState(true);

//   const instructions = [
//     "Sit & breathe sit down. Put your hand on your heart. Take 3 deep breaths.",
//     "Find 3 things you have right now (like coffee, sun, or a chair). Say \"thank you\".",
//     "1 happy thought think of one person or one good memory. Feel that happiness.",
//     "Thank yourself say \"thank you\" to your body and your mind for today.",
//     "Finish smile. Take one big breath. Open your eyes."
//   ];

//   return (
//     <View className="flex-1 bg-[#F0F2EB]">
//       <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: '35%' }}>

//         <ImageBackground 
//           source={{ uri: (params.image as string) || 'https://picsum.photos/400/600' }} 
//           className="w-full h-[400px]"
//         >
//           <LinearGradient colors={['rgba(0,0,0,0.2)', 'transparent', 'rgba(0,0,0,0.6)']} className="flex-1">
//             <SafeAreaView edges={['top']} className="flex-row justify-between px-5 pt-2">
//               <TouchableOpacity 
//                 onPress={() => router.push('/(tabs)/Activities')} 
//               >
//                 <Ionicons name="chevron-back" size={28} color="white" />
//               </TouchableOpacity>
//               <TouchableOpacity>
//                 <MaterialIcons name="more-vert" size={28} color="white" />
//               </TouchableOpacity>
//             </SafeAreaView>
            
//             <View className="absolute bottom-10 px-6">
//               <Text className="text-white text-lg" style={{ fontFamily: 'Nunito_600SemiBold' }}>
//                 {params.type || 'Meditation'}
//               </Text>
//               <Text className="text-white text-4xl mt-1" style={{ fontFamily: 'Nunito_700Bold' }}>
//                 {params.title}
//               </Text>
//               <View className="flex-row items-center mt-3 space-x-6">
//                  <View className="flex-row items-center">
//                     <Ionicons name="time-outline" size={20} color="white" />
//                     <Text className="text-white ml-2 text-base" style={{ fontFamily: 'Nunito_400Regular' }}>10min</Text>
//                  </View>
//                  <View className="flex-row items-center">
//                     <MaterialCommunityIcons name="door-open" size={20} color="white" />
//                     <Text className="text-white ml-2 text-base" style={{ fontFamily: 'Nunito_400Regular' }}>{params.room}</Text>
//                  </View>
//               </View>
//             </View>
//           </LinearGradient>
//         </ImageBackground>

//         <View className="px-6 pt-8">
//           {/* Associated Devices */}
//           <Text className="text-[#354F52] text-xl mb-3" style={{ fontFamily: 'Nunito_700Bold' }}>Associated Devices</Text>
//           <View className="flex-row flex-wrap gap-y-2 gap-x-4 mb-8">
//               <View className="flex-row items-center">
//                 <Feather  size={16} color="#6A7D5B" />
//                 <Text className="text-[#6A7D5B] ml-2" style={{ fontFamily: 'Nunito_600SemiBold' }}>Bedroom Lights</Text>
//               </View>
//               <View className="flex-row items-center">
//                 <MaterialCommunityIcons name="sprinkler-variant" size={16} color="#6A7D5B" />
//                 <Text className="text-[#6A7D5B] ml-2" style={{ fontFamily: 'Nunito_600SemiBold' }}>Difuser</Text>
//               </View>
//               <View className="flex-row items-center">
//                 <MaterialIcons name="speaker" size={16} color="#6A7D5B" />
//                 <Text className="text-[#6A7D5B] ml-2" style={{ fontFamily: 'Nunito_600SemiBold' }}>Speakers</Text>
//               </View>
//           </View>

//           {/* Description */}
//           <Text className="text-[#354F52] text-xl mb-2" style={{ fontFamily: 'Nunito_700Bold' }}>Description</Text>
//           <Text className="text-[#6A7D5B] text-[15px] leading-6 mb-8" style={{ fontFamily: 'Nunito_400Regular' }}>
//             {params.description}
//           </Text>

//           {/* Focus Mode */}
//           <Text className="text-[#354F52] text-xl mb-3" style={{ fontFamily: 'Nunito_700Bold' }}>Focus Mode</Text>
//           <View className="flex-row items-center justify-between bg-[#F0F2EB] border border-[#548F53] p-5 rounded-2xl mb-8">
//             <View className="flex-row items-center">
//               <Ionicons name="notifications-outline" size={26} color="#354F52" />
//               <View className="ml-4">
//                 <Text className="text-[#354F52] text-lg" style={{ fontFamily: 'Nunito_700Bold' }}>Notifications</Text>
//                 <Text className="text-[#6A7D5B] text-xs" style={{ fontFamily: 'Nunito_400Regular' }}>Muted during {params.environment}</Text>
//               </View>
//             </View>
//             <Switch
//               trackColor={{ false: "#DDE5D7", true: "#548F53" }}
//               onValueChange={setNotificationsEnabled}
//               value={notificationsEnabled}
//             />
//           </View>

//           {/* Selected Content */}
//           <Text className="text-[#354F52] text-xl mb-3" style={{ fontFamily: 'Nunito_700Bold' }}>Selected Content</Text>
//           <View className="flex-row items-center justify-between bg-[#F0F2EB] border border-[#548F53] p-4 rounded-2xl mb-8">
//             <View className="flex-1 pr-2">
//               <Text className="text-[#354F52] text-lg" style={{ fontFamily: 'Nunito_700Bold' }}>{params.content || 'Session'}</Text>
//               <Text className="text-[#6A7D5B] text-xs mt-1" style={{ fontFamily: 'Nunito_400Regular' }}>Playing in {params.room}</Text>
//             </View>
//             <Image source={{ uri: 'https://picsum.photos/id/237/100/100' }} className="w-20 h-20 rounded-xl" />
//           </View>

//           {/* Instructions */}
//           <Text className="text-[#354F52] text-xl mb-4" style={{ fontFamily: 'Nunito_700Bold' }}>Instructions</Text>
//           {instructions.map((step, index) => (
//             <View key={index} className="flex-row mb-4">
//               <Text className="text-[#548F53] text-lg w-7" style={{ fontFamily: 'Nunito_700Bold' }}>{index + 1}.</Text>
//               <Text className="text-[#354F52] text-[15px] flex-1 leading-6" style={{ fontFamily: 'Nunito_400Regular' }}>{step}</Text>
//             </View>
//           ))}
//         </View>
//       </ScrollView>

//       <View className="absolute bottom-10 left-0 right-0 items-center px-6">
//         <TouchableOpacity 
//           activeOpacity={0.9}
//           className="bg-[#548F53] py-4 rounded-full flex-row items-center justify-center shadow-lg shadow-[#548F53]/40"
//           style={{ width: width * 0.65 }}
//           onPress={() => alert('Starting Session...')}
//         >
//           <Text className="text-white text-2xl mr-2" style={{ fontFamily: 'Nunito_700Bold' }}>Start</Text>
//           <Ionicons name="play" size={24} color="white" />
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// }
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Image,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Ionicons,
  MaterialCommunityIcons,
  MaterialIcons,
  Feather,
} from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

export default function ActivityDetails() {
  const { id } = useLocalSearchParams();
  const [activity, setActivity] = useState<any>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadActivity = async () => {
      const stored = await AsyncStorage.getItem('@myActivities');
      if (stored) {
        const activities = JSON.parse(stored);
        const found = activities.find((a: any) => a.id === id);
        setActivity(found);
      }
      setLoading(false);
    };

    loadActivity();
  }, [id]);

  if (loading) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F0F2EB]">
        <ActivityIndicator size="large" color="#548F53" />
      </View>
    );
  }

  if (!activity) {
    return (
      <View className="flex-1 justify-center items-center bg-[#F0F2EB]">
        <Text>Activity not found</Text>
      </View>
    );
  }

  const imageSource =
    typeof activity.image === 'string'
      ? { uri: activity.image }
      : activity.image;

  return (
    <View className="flex-1 bg-[#F0F2EB]">
      <ScrollView contentContainerStyle={{ paddingBottom: '35%' }}>
        {/* HEADER IMAGE */}
        <ImageBackground source={imageSource} className="w-full h-[400px]">
          <LinearGradient
            colors={['rgba(0,0,0,0.25)', 'transparent', 'rgba(0,0,0,0.7)']}
            className="flex-1"
          >
            <SafeAreaView edges={['top']} className="flex-row justify-between px-5">
              <TouchableOpacity onPress={() => router.back()}>
                <Ionicons name="chevron-back" size={28} color="white" />
              </TouchableOpacity>
            </SafeAreaView>

            <View className="absolute bottom-10 px-6">
              <Text className="text-white text-lg">
                {activity.category}
              </Text>
              <Text className="text-white text-4xl mt-1">
                {activity.title}
              </Text>

              <View className="flex-row items-center mt-3 space-x-6">
                <View className="flex-row items-center">
                  <Ionicons name="time-outline" size={20} color="white" />
                  <Text className="text-white ml-2">
                    {activity.time}
                  </Text>
                </View>

                <View className="flex-row items-center">
                  <MaterialCommunityIcons name="door-open" size={20} color="white" />
                  <Text className="text-white ml-2">
                    {activity.room}
                  </Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>

        {/* DESCRIPTION */}
        <View className="px-6 pt-8">
          <Text className="text-xl mb-2">Description</Text>
          <Text>{activity.description}</Text>
        </View>
      </ScrollView>

      {/* START */}
      <View className="absolute bottom-10 left-0 right-0 items-center">
        <TouchableOpacity
          className="bg-[#548F53] py-4 px-16 rounded-full"
          onPress={() => alert('Starting...')}
        >
          <Text className="text-white text-xl">Start</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
