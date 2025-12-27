// import React from 'react';
// import { View, Text, ImageBackground, ImageSourcePropType } from 'react-native';
// import { Feather } from '@expo/vector-icons';

// interface RoutineCardProps {
//   title: string;
//   time: string;
//   location: string;
//   room: string;
//   isActive: boolean;
//   image?: ImageSourcePropType;
// }

// const CustomSwitch = ({ active }: { active: boolean }) => (
//   <View className={`w-12 h-6 rounded-full px-1 justify-center ${active ? 'bg-[#548F53]' : 'bg-[#D1D1D1]'}`}>
//     <View className={`w-4 h-4 bg-white rounded-full ${active ? 'self-end' : 'self-start'} shadow-sm`} />
//   </View>
// );

// export const RoutineCard = ({ title, time, location, room, isActive, image }: RoutineCardProps) => {
//   const isImageCard = !!image;
//   const textColor = isImageCard ? 'text-white' : 'text-[#354F52]';
//   const iconColor = isImageCard ? 'white' : '#354F52';

//   return (
//     <View className="mb-4 overflow-hidden rounded-[20px] shadow-sm bg-white">
//       {isImageCard ? (
//         <ImageBackground source={image!} className="p-5 min-h-[150px]">
//           <View className="absolute inset-0 bg-black/40" />
//           <Content title={title} time={time} location={location} room={room} isActive={isActive} textColor={textColor} iconColor={iconColor} />
//         </ImageBackground>
//       ) : (
//         <View className="p-5 border border-gray-100">
//           <Content title={title} time={time} location={location} room={room} isActive={isActive} textColor={textColor} iconColor={iconColor} />
//         </View>
//       )}
//     </View>
//   );
// };

// const Content = ({ title, time, location, room, isActive, textColor, iconColor }: any) => (
//   <View className="flex-row justify-between items-start">
//     <View className="flex-1">
//       <Text className={`${textColor} text-[18px] font-[Nunito_700Bold]`}>{title}</Text>
//       <View className="flex-row items-center mt-3">
//         <Feather name="calendar" size={14} color={iconColor} style={{ opacity: 0.7 }} />
//         <Text className={`${textColor} ml-2 text-[13px] font-[Nunito_400Regular]`} style={{ opacity: 0.8 }}>{time}</Text>
//       </View>
//       <View className="flex-row items-center mt-1">
//         <Feather name="clock" size={14} color={iconColor} style={{ opacity: 0.7 }} />
//         <Text className={`${textColor} ml-2 text-[13px] font-[Nunito_400Regular]`} style={{ opacity: 0.8 }}>{location}</Text>
//       </View>
//       <View className="flex-row items-center mt-1">
//         <Feather name="map-pin" size={14} color={iconColor} style={{ opacity: 0.7 }} />
//         <Text className={`${textColor} ml-2 text-[13px] font-[Nunito_400Regular]`} style={{ opacity: 0.8 }}>{room}</Text>
//       </View>
//     </View>
//     <CustomSwitch active={isActive} />
//   </View>
// );