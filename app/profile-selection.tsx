import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

// Definição do tipo para os perfis
interface Profile {
  id: number;
  name: string;
  avatar: any; // Tipagem para o require() de imagens locais
}

const profiles: Profile[] = [
  {
    id: 1,
    name: 'Laura Rossi',
    avatar: require('./../assets/avatars/profile.png'),
  },
  {
    id: 2,
    name: 'Miguel Soares',
    avatar: require('./../assets/avatars/profile1.png'),
  },
  {
    id: 3,
    name: 'Inês Silva',
    avatar: require('./../assets/avatars/profile3.png'),
  },
];

export default function ProfileSelection() {
  const router = useRouter();
  const hostName: string = 'Laura';

  return (
    <SafeAreaView className="flex-1 bg-[#F5F7F0]" edges={['top']}>
      <ScrollView
        contentContainerStyle={{
          alignItems: 'center',
          paddingTop: 60,
          paddingBottom: 120,
        }}
        className="z-20"
        showsVerticalScrollIndicator={false}
      >
        <Text
          className="text-[32px] text-[#3A5A54] mb-12 text-center px-10"
          style={{ fontFamily: 'Nunito_700Bold' }}
        >
          {`Who is at ${hostName}'s home?`}
        </Text>

        <View className="flex-row flex-wrap justify-center w-full px-5 gap-y-10">
          {profiles.map((profile) => (
            <TouchableOpacity
              key={profile.id}
              activeOpacity={0.7}
              onPress={() => router.replace('/(tabs)')}
              className="items-center w-[45%]"
            >
              <View className="w-[130px] h-[130px] rounded-full overflow-hidden mb-3 bg-white shadow-sm">
                <Image
                  source={profile.avatar}
                  className="w-full h-full"
                  resizeMode="cover"
                />
              </View>
              <Text
                className="text-xl text-[#3A5A54] text-center"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                {profile.name}
              </Text>
            </TouchableOpacity>
          ))}

          {/* Botão Add Profile  */}
          <TouchableOpacity
            activeOpacity={0.7}
            className="items-center w-[45%]"
          >
            <View className="w-[130px] h-[130px] rounded-full bg-[#C8E0C4] items-center justify-center mb-3">
              <MaterialIcons name="add" size={90} color="#354F52" />
            </View>
            <Text
              className="text-xl text-[#3A5A54] text-center"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
            >
              Add Profile
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity className="mt-12">
          <Text
            className="text-lg text-[#548F53] underline"
            style={{ fontFamily: 'Nunito_700Bold' }}
          >
            Manage profiles
          </Text>
        </TouchableOpacity>
      </ScrollView>

      <Image
        source={require('./../assets/images/Wave2.png')}
        className="absolute bottom-0 w-full h-[250px] z-10"
        style={{ width: width }}
        resizeMode="stretch"
      />
    </SafeAreaView>
  );
}