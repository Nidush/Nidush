import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';

export default function Routines() {
  return (
    <SafeAreaView className="flex-1 bg-[#33470a]">
      <View className="items-center py-4">
        <ThemedText className="text-[24px] text-[#354F52] font-[Nunito_700Bold]">
          Routines
        </ThemedText>
      </View>
    </SafeAreaView>
  );
}