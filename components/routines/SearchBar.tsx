// import React from 'react';
// import { View, TextInput, TouchableOpacity, Text } from 'react-native';
// import { Feather } from '@expo/vector-icons';

// interface FilterChipProps {
//   label: string;
//   active?: boolean;
// }

// export const FilterChip = ({ label, active = false }: FilterChipProps) => (
//   <TouchableOpacity 
//     className={`px-6 py-1.5 rounded-full mr-2 border ${
//       active ? 'bg-[#C8E6C9] border-[#548F53]' : 'bg-transparent border-[#A8B5AA]'
//     }`}
//   >
//     <Text className={`text-[14px] font-[Nunito_600SemiBold] ${active ? 'text-[#548F53]' : 'text-[#354F52]'}`}>
//       {label}
//     </Text>
//   </TouchableOpacity>
// );

// export const SearchBar = () => (
//   <View className="flex-row items-center bg-[#F1F3EA] border border-[#A8B5AA] rounded-full px-4 py-2.5 mb-6">
//     <Feather name="search" size={18} color="#A8B5AA" />
//     <TextInput 
//       placeholder="Search..." 
//       className="flex-1 ml-2 text-[16px] text-[#354F52] font-[Nunito_400Regular]" 
//       placeholderTextColor="#A8B5AA" 
//     />
//   </View>
// );