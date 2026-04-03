import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Dimensions,
  Image,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { supabase } from '../utils/supabase';

const { width } = Dimensions.get('window');

interface Profile {
  id: number;
  name: string;
  avatarUrl: string | null;
}

export default function ProfileSelection() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [hostName, setHostName] = useState<string>('Nidush');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchResidents = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        if (!user) {
          alert("Sessão não encontrada! Faz login novamente.");
          return;
        }

        console.log("-> Utilizador atual:", user.email);
        
        // 1. Obter a casa (home_idhome) do user atual
        const cleanEmail = user.email ? user.email.trim() : '';
        const { data: usersFound, error: myError } = await supabase
          .from('users')
          .select('home_idhome, first_name')
          .ilike('email', cleanEmail);

        if (myError) console.error("--> Erro no myUser:", myError);
        
        let userRecord = usersFound && usersFound.length > 0 ? usersFound[0] : null;

        // Fallback: Tenta por auth_uid se não achou email
        if (!userRecord) {
           const { data: byAuthUid } = await supabase
             .from('users')
             .select('home_idhome, first_name')
             .eq('auth_uid', user.id)
             .maybeSingle();
           if (byAuthUid) userRecord = byAuthUid;
        }

        if (!userRecord) {
          alert("Este utilizador (" + cleanEmail + ") não foi encontrado na tabela 'users'! Pode ser necessário recriar a conta ou preencher o perfil.");
        } else {
          if (userRecord.first_name) setHostName(userRecord.first_name);
          
          if (userRecord.home_idhome) {
            console.log("-> À procura de residentes na casa ID:", userRecord.home_idhome);
            const { data: residents, error: resError } = await supabase
              .from('users')
              .select('iduser, first_name, last_name, avatar_url')
              .eq('home_idhome', userRecord.home_idhome);

            if (resError) console.error("--> Erro residents:", resError);

            if (residents && residents.length > 0) {
              const mappedProfiles: Profile[] = residents.map((r) => ({
                id: r.iduser,
                name: [r.first_name, r.last_name].filter(Boolean).join(' ').trim() || 'Utilizador',
                avatarUrl: r.avatar_url,
              }));
              setProfiles(mappedProfiles);
            } else {
              alert("Não foram encontrados outros residentes na casa com ID: " + userRecord.home_idhome);
            }
          } else {
            alert("O teu utilizador não tem uma casa (home_idhome) associada!");
          }
        }
      } catch (error) {
        console.error("Erro fatal:", error);
        alert("Erro fatal no carregamento: " + (error as any).message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchResidents();

    const timer = setTimeout(() => setIsLoading(false), 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <SafeAreaView
      className="flex-1 bg-[#F5F7F0]"
      edges={['top']}
      accessibilityLabel="Profile selection screen"
    >
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
          maxFontSizeMultiplier={1.1}
          className="text-[32px] text-[#3A5A54] mb-12 text-center px-10"
          style={{ fontFamily: 'Nunito_700Bold' }}
          accessibilityRole="header"
        >
          {`Who is at ${hostName}'s home?`}
        </Text>

        {isLoading ? (
          <ActivityIndicator size="large" color="#548F53" />
        ) : (
          <View className="flex-row flex-wrap justify-center w-full px-5 gap-y-10">
            {profiles.map((profile) => (
              <TouchableOpacity
                key={profile.id}
                testID={`profile-item-${profile.id}`}
                activeOpacity={0.7}
                onPress={() => router.replace('/(tabs)')}
                className="items-center w-[45%]"
                accessible
                accessibilityRole="button"
                accessibilityLabel={`Select profile ${profile.name}`}
                accessibilityHint="Navigates to the main screen"
              >
                <View className="w-[130px] h-[130px] rounded-full overflow-hidden mb-3 bg-white shadow-sm border-[3px] border-transparent" style={{borderColor: '#E8F3E8'}}>
                  <Image
                    source={profile.avatarUrl ? { uri: profile.avatarUrl } : require('./../assets/avatars/profile.png')}
                    className="w-full h-full"
                    resizeMode="cover"
                    accessible={false}
                  />
                </View>
                <Text
                  maxFontSizeMultiplier={1.2}
                  className="text-xl text-[#3A5A54] text-center"
                  style={{ fontFamily: 'Nunito_600SemiBold' }}
                  numberOfLines={2}
                >
                  {profile.name}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Botão Add Profile */}
            <TouchableOpacity
              testID="add-profile-button"
              activeOpacity={0.7}
              className="items-center w-[45%]"
              accessible
              accessibilityRole="button"
              accessibilityLabel="Add new profile"
              accessibilityHint="Creates a new profile"
            >
              <View className="w-[130px] h-[130px] rounded-full bg-[#C8E0C4] items-center justify-center mb-3">
                <MaterialIcons name="add" size={90} color="#354F52" />
              </View>
              <Text
                maxFontSizeMultiplier={1.2}
                className="text-xl text-[#3A5A54] text-center"
                style={{ fontFamily: 'Nunito_600SemiBold' }}
              >
                Add Profile
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          className="mt-12"
          testID="manage-profiles-button"
          accessible
          accessibilityRole="button"
          accessibilityLabel="Manage profiles"
          accessibilityHint="Opens profile management settings"
        >
          <Text
            maxFontSizeMultiplier={1.2}
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
        accessible={false}
        importantForAccessibility="no-hide-descendants"
      />
    </SafeAreaView>
  );
}