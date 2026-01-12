import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function NewScenarioScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-[#F0F2EB]" edges={['top']}>
      <StatusBar barStyle="dark-content" />
      
      <View className="flex-1 justify-center items-center px-10">
        {/* icone */}
        <View className="bg-[#BDC7C2]/30 p-8 rounded-full mb-8">
          <MaterialIcons name="construction" size={80} color="#354F52" />
        </View>

        {/* mensagem */}
        <Text 
          style={{ fontFamily: 'Nunito_700Bold' }}
          className="text-[#354F52] text-3xl text-center mb-3"
        >
          Work in Progress
        </Text>

        <Text 
          style={{ fontFamily: 'Nunito_600SemiBold' }}
          className="text-[#7A8C85] text-lg text-center mb-12"
        >
          This feature is still in development. We are building something special for you!
        </Text>

        {/* Botão Back to Home */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.replace('/(tabs)')}
          className="bg-[#548F53] py-4 px-10 rounded-full shadow-md shadow-black/20"
        >
          <View className="flex-row items-center justify-center">
            <MaterialIcons name="home" size={24} color="white" />
            <Text 
              style={{ fontFamily: 'Nunito_700Bold' }}
              className="text-white text-lg ml-2"
            >
              Back to Home
            </Text>
          </View>
        </TouchableOpacity>        
      </View>
    </SafeAreaView>
  );
}