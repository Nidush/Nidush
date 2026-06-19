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
import { getSessionUser, supabase } from '../utils/supabase';
import { getAvatarSource } from '../utils/avatarSource';

const { width } = Dimensions.get('window');

interface Profile {
  id: string;
  name: string;
  avatarUrl: string | null;
}

type ResidentProfileRow = {
  auth_uid: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

export default function ProfileSelection() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [hostName, setHostName] = useState<string>('Nidush');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const fetchResidents = async () => {
      if (isMounted) setIsLoading(true);
      try {
        const user = await getSessionUser();

        if (!user) {
          router.replace('/login');
          return;
        }

        console.log("-> Utilizador atual:", user.email);
        
        const { data: homeAssocs, error: assocError } = await supabase
          .from('user_homes')
          .select('home_id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        if (assocError) throw assocError;

        if (!homeAssocs || homeAssocs.length === 0) {
          if (isMounted) setProfiles([]);
        } else {
          const activeHomeId = homeAssocs[0].home_id;
          if (user.user_metadata?.first_name) setHostName(user.user_metadata.first_name);

          console.log("-> À procura de residentes na casa ID:", activeHomeId);

          const { data: residentLinks, error: residentLinksError } = await supabase
            .from('user_homes')
            .select('user_id, created_at')
            .eq('home_id', activeHomeId)
            .order('created_at', { ascending: true });

          if (residentLinksError) throw residentLinksError;

          const residentIds = Array.from(
            new Set((residentLinks ?? []).map((resident) => resident.user_id).filter(Boolean)),
          );

          if (residentIds.length > 0) {
            const { data: residentProfiles, error: residentProfilesError } = await supabase
              .from('users')
              .select('auth_uid, first_name, last_name, email, avatar_url')
              .in('auth_uid', residentIds);

            if (residentProfilesError) throw residentProfilesError;

            const profileByAuthId = new Map(
              ((residentProfiles ?? []) as ResidentProfileRow[]).map((profile) => [profile.auth_uid, profile]),
            );

            const mappedProfiles: Profile[] = residentIds.map((residentId) => {
              const residentProfile = profileByAuthId.get(residentId);
              const isCurrentUser = residentId === user.id;
              const firstName = residentProfile?.first_name || (isCurrentUser ? user.user_metadata?.first_name : '');
              const lastName = residentProfile?.last_name || (isCurrentUser ? user.user_metadata?.last_name : '');
              const fallbackName = residentProfile?.email?.split('@')[0] || (isCurrentUser ? user.email?.split('@')[0] : 'Utilizador');
              const name = [firstName, lastName].filter(Boolean).join(' ').trim() || fallbackName || 'Utilizador';

              return {
                id: residentId,
                name,
                avatarUrl: residentProfile?.avatar_url || (isCurrentUser ? user.user_metadata?.avatar_url : null) || null,
              };
            });

            if (isMounted) setProfiles(mappedProfiles);
          } else {
            console.warn('No residents found for home:', activeHomeId);
            if (isMounted) setProfiles([]);
          }
        }
      } catch (error: unknown) {
        console.error("Erro fatal:", error);
        if (isMounted) setProfiles([]);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchResidents();

    return () => {
      isMounted = false;
    };
  }, [router]);

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
                    source={getAvatarSource(profile.avatarUrl)}
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
