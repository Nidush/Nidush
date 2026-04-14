import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Image, Modal, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { pickImage } from '../utils/imagePicker';
import { supabase, uploadImage } from '../utils/supabase';


import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';

export default function Profile() {
  const router = useRouter();
  const [userName, setUserName] = useState('A carregar...');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHobbies, setSelectedHobbies] = useState<string[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isPrivacyModalVisible, setIsPrivacyModalVisible] = useState(false);
  const [isAccountModalVisible, setIsAccountModalVisible] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userHomeId, setUserHomeId] = useState<number | string | null>(null);
  const [joinCode, setJoinCode] = useState<string | null>(null);

  const HOBBIES_OPTIONS = ['Cooking', 'Workout', 'Meditation', 'Audiobooks'];


  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setAvatarUrl(user.user_metadata?.avatar_url || null);
        const first = user.user_metadata?.first_name || '';
        const last = user.user_metadata?.last_name || '';

        if (first || last) {
          setUserName(`${first} ${last}`.trim());
        } else if (user.email) {
          setUserName(user.email.split('@')[0]);
        } else {
          setUserName('Utilizador');
        }

        const userEmail = user.email || '';
        setUserEmail(userEmail);
        const { data: usersFound } = await supabase
          .from('users')
          .select('hobbies, home_idhome')
          .ilike('email', userEmail.trim());


        const userData = usersFound && usersFound.length > 0 ? usersFound[0] : null;
        let finalHomeId = null;

        if (!userData) {
          const { data: byAuth } = await supabase.from('users').select('hobbies, home_idhome').eq('auth_uid', user.id).maybeSingle();
          if (byAuth?.hobbies) {
            const raw = Array.isArray(byAuth.hobbies) ? byAuth.hobbies.join(',') : String(byAuth.hobbies);
            const cleanHobbies = raw.replace(/[\[\]"]/g, '').split(',').map((s: string) => s.trim()).filter(Boolean);

            setSelectedHobbies(Array.from(new Set(cleanHobbies)));
          }
          if (byAuth?.home_idhome) {
            setUserHomeId(byAuth.home_idhome);
            finalHomeId = byAuth.home_idhome;
          }
        } else {
          if (userData?.hobbies) {
            const raw = Array.isArray(userData.hobbies) ? userData.hobbies.join(',') : String(userData.hobbies);
            const cleanHobbies = raw.replace(/[\[\]"]/g, '').split(',').map((s: string) => s.trim()).filter(Boolean);
            // Remover duplicados com Set
            setSelectedHobbies(Array.from(new Set(cleanHobbies)));
          }
          if (userData?.home_idhome) {
            setUserHomeId(userData.home_idhome);
            finalHomeId = userData.home_idhome;
          }
        }

        // Fetch Join Code se tivermos o ID da casa
        if (finalHomeId) {
          const { data: homeData } = await supabase.from('home').select('join_code').eq('idhome', finalHomeId).maybeSingle();
          if (homeData?.join_code) {
            setJoinCode(homeData.join_code);
          }
        }



      } else {
        setUserName('Visitante');
      }
      setIsLoading(false);
    };
    fetchUser();
  }, []);


  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.replace('/login');
  };

  const handleImagePick = async () => {
    const base64OrUri = await pickImage();
    if (!base64OrUri) return;

    setAvatarUrl(typeof base64OrUri === 'string' ? base64OrUri : null);

    const publicUrl = await uploadImage(base64OrUri, 'avatars');
    if (publicUrl) {
      const { data: { user } } = await supabase.auth.getUser();

      await supabase.auth.updateUser({
        data: { avatar_url: publicUrl }
      });

      if (user) {
        const { error: dbError } = await supabase.from('users').update({ avatar_url: publicUrl }).eq('email', user.email);
        if (dbError) {
          console.error("Erro a atualizar tabela users:", dbError);
          alert("A foto foi guardada no auth, mas falhou ao guardar na tabela publica users (erro RLS): " + dbError.message);
        }
      }

      setAvatarUrl(publicUrl);
      alert('Foto de perfil atualizada com sucesso!');
    } else {
      alert('Erro ao fazer upload da foto de perfil.');
    }
  };

  const toggleHobby = (hobby: string) => {
    setSelectedHobbies(prev =>
      prev.includes(hobby) ? prev.filter(h => h !== hobby) : [...prev, hobby]
    );
  };

  const saveHobbies = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const userEmail = user.email || '';
      const uniqueHobbies = Array.from(new Set(selectedHobbies)).join(',');

      const { error, count } = await supabase
        .from('users')
        .update({ hobbies: uniqueHobbies }, { count: 'exact' })
        .ilike('email', userEmail.trim());

      if (error) {
        // Fallback para auth_uid se o email falhar
        const { error: error2, count: count2 } = await supabase
          .from('users')
          .update({ hobbies: uniqueHobbies }, { count: 'exact' })
          .eq('auth_uid', user.id);



        if (error2) {
          console.error("Erro ao guardar hobbies:", error2);
          alert("Erro ao gravar hobbies: " + error2.message);
        } else if (count2 === 0) {
          alert("Erro RLS: Zero linhas atualizadas por UID. Verifica se as permissões SQL permitem a edição.");
        } else {
          setIsModalVisible(false);
          alert("Hobby preferences saved!");
        }
      } else if (count === 0) {
        const uniqueHobbies = Array.from(new Set(selectedHobbies)).join(',');
        const { error: errorFallback, count: countFallback } = await supabase
          .from('users')
          .update({ hobbies: uniqueHobbies }, { count: 'exact' })
          .eq('auth_uid', user.id);



        if (countFallback === 0) {
          alert("Erro: O teu e-mail (" + userEmail + ") não foi encontrado ou está bloqueado pelo RLS. Garante que corres o SQL das permissões.");
        } else {
          setIsModalVisible(false);
          alert("Hobby preferences saved!");
        }
      } else {
        setIsModalVisible(false);
        alert("Hobby preferences saved!");
      }

    }
  };



  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  if (!fontsLoaded) return null;

  return (
    <SafeAreaView
      className="flex-1 bg-[#F5F7F0]"
      edges={['top']}
      accessibilityLanguage="en-US"
    >
      {/* Header */}
      <View className="flex-row justify-between items-center px-6 py-4">
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)')}
          testID="back-button"
          accessible
          accessibilityRole="button"
          accessibilityLabel="Go back"
          accessibilityHint="Navigates back to the main screen"
        >
          <MaterialIcons name="chevron-left" size={32} color="#4A5D4E" />
        </TouchableOpacity>

        <Text
          maxFontSizeMultiplier={1.2}
          className="text-2xl text-[#4A5D4E]"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
          accessibilityRole="header"
        >
          Profile
        </Text>

        <View className="w-8" />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="items-center my-6">
          <TouchableOpacity onPress={handleImagePick} activeOpacity={0.8} style={{ position: 'relative' }}>
            {isLoading ? (
              <View className="w-32 h-32 rounded-full bg-[#E8EDDF]" />
            ) : (
              <Image
                source={avatarUrl ? { uri: avatarUrl } : require('@/assets/avatars/profile.png')}
                className="w-32 h-32 rounded-full"
                accessible
                accessibilityRole="image"
                accessibilityLabel={`Profile picture of ${userName}`}
              />
            )}
            <View className="absolute bottom-0 right-0 bg-[#5B8C51] p-2 rounded-full border-2 border-[#F5F7F0]">
              <MaterialIcons name="edit" size={20} color="white" />
            </View>
          </TouchableOpacity>
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-3xl text-[#3A4D3F] mt-4"
            style={{ fontFamily: 'Nunito_700Bold' }}
            accessibilityRole="header"
          >
            {userName}
          </Text>
          {joinCode && (
            <View className="bg-[#E8EDDF] px-4 py-1.5 rounded-full mt-2 border border-[#C8D2C8]">
              <Text
                className="text-[#4A5D4E] text-sm"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                Join Code: <Text className="text-[#5B8C51] tracking-widest">{joinCode}</Text>
              </Text>
            </View>
          )}
        </View>

        {/* Hobbies */}
        <View
          className="bg-[#F5F7F0] rounded-[24px] p-5 mb-4 border border-[#D1D9C5]"
          testID="hobbies-container"
        >
          <View className="flex-row justify-between items-center mb-4">
            <Text
              maxFontSizeMultiplier={1.2}
              className="text-lg text-[#4A5D4E]"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
              accessibilityRole="header"
            >
              Hobby Preferences
            </Text>

            <TouchableOpacity
              onPress={() => setIsModalVisible(true)}
              testID="edit-hobbies-button"
              accessible
              accessibilityRole="button"
              accessibilityLabel="Edit hobby preferences"
              accessibilityHint="Opens the hobby preferences editor"
            >
              <Text
                maxFontSizeMultiplier={1.2}
                className="text-[#5B8C51] underline"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                Edit
              </Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap gap-2">
            {selectedHobbies.length > 0 ? (
              selectedHobbies.map((hobby) => (
                <View
                  key={hobby}
                  className="bg-[#C8E0C4] px-4 py-1.5 rounded-full"
                  accessible={false}
                >
                  <Text
                    maxFontSizeMultiplier={1.2}
                    className="text-[#4A5D4E] text-sm"
                    style={{ fontFamily: 'Nunito_600SemiBold' }}
                  >
                    {hobby}
                  </Text>
                </View>
              ))
            ) : (
              <Text className="text-gray-400 italic">No hobbies selected</Text>
            )}
          </View>
        </View>


        {/* Wearables */}
        <View className="bg-[#F5F7F0] rounded-[24px] p-5 mb-4 border border-[#D1D9C5]">
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-lg text-[#4A5D4E] mb-4"
            style={{ fontFamily: 'Nunito_600SemiBold' }}
            accessibilityRole="header"
          >
            Associated Wearables
          </Text>

          <DeviceItem
            name="Apple Watch"
            status="Connected"
            connected
            icon="watch"
            testID="device-apple-watch"
          />
          <DeviceItem
            name="Mi Band"
            status="Disconnected"
            connected={false}
            icon="watch"
            testID="device-mi-band"
          />

          <TouchableOpacity
            className="bg-[#5B8C51] py-3.5 rounded-full items-center mt-4 shadow-sm"
            testID="add-device-button"
            accessible
            accessibilityRole="button"
            accessibilityLabel="Add new device"
            accessibilityHint="Starts the process to connect a new wearable device"
          >
            <Text
              maxFontSizeMultiplier={1.2}
              className="text-white text-xl"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              Add New Device
            </Text>
          </TouchableOpacity>
        </View>

        {/* Menu Principal */}
        <View className="bg-[#F5F7F0] rounded-[24px] px-2 mb-4 border border-[#D1D9C5]">
          <MenuItem
            icon="account-circle"
            label="Account Information"
            testID="menu-account"
            onPress={() => setIsAccountModalVisible(true)}
          />
          <MenuItem
            icon="notifications-none"
            label="Notifications"
            testID="menu-notifications"
          />
          <MenuItem
            icon="admin-panel-settings"
            label="Privacy & Data"
            border={false}
            testID="menu-privacy"
            onPress={() => setIsPrivacyModalVisible(true)}
          />
        </View>

        {/* Menu Secundário */}
        <View className="bg-[#F5F7F0] rounded-[24px] px-2 mb-6 border border-[#D1D9C5]">
          <MenuItem
            icon="group"
            label="Residents"
            border={false}
            testID="menu-residents"
            onPress={() => router.push('/profile-selection')}
          />
        </View>

        {/* Botão Logout */}
        <View className="items-center">
          <TouchableOpacity
            className="bg-[#5B8C51] px-12 py-3.5 rounded-full shadow-sm"
            onPress={handleLogout}
            testID="logout-button"
            accessible
            accessibilityRole="button"
            accessibilityLabel="Log out"
            accessibilityHint="Logs out of the current account"
          >
            <Text
              maxFontSizeMultiplier={1.2}
              className="text-white text-xl"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              Logout
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Hobbies Preference Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white w-full rounded-[32px] p-8 shadow-xl">
            <Text
              className="text-2xl text-[#3A4D3F] mb-6 text-center"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              Select your Hobbies
            </Text>

            <View className="flex-row flex-wrap justify-between gap-y-4">
              {HOBBIES_OPTIONS.map((hobby) => {
                const isSelected = selectedHobbies.includes(hobby);
                return (
                  <TouchableOpacity
                    key={hobby}
                    onPress={() => toggleHobby(hobby)}
                    className={`w-[48%] py-4 rounded-2xl border-2 items-center ${isSelected ? 'bg-[#5B8C51] border-[#5B8C51]' : 'bg-white border-[#D1D9C5]'
                      }`}
                  >
                    <Text
                      className={`text-lg ${isSelected ? 'text-white' : 'text-[#4A5D4E]'}`}
                      style={{ fontFamily: isSelected ? 'Nunito_700Bold' : 'Nunito_600SemiBold' }}
                    >
                      {hobby}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity
              onPress={saveHobbies}
              className="bg-[#5B8C51] mt-8 py-4 rounded-full items-center shadow-md"
            >
              <Text
                className="text-white text-xl"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                Save Preferences
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setIsModalVisible(false)}
              className="mt-4 py-2 items-center"
            >
              <Text className="text-gray-400 text-lg">Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Privacy & Data Modal */}
      <Modal
        visible={isPrivacyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsPrivacyModalVisible(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white w-full rounded-t-[40px] p-8 shadow-2xl h-[80%]">
            <View className="flex-row justify-between items-center mb-6">
              <Text
                className="text-2xl text-[#3A4D3F]"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                Privacy & Data Policy
              </Text>
              <TouchableOpacity onPress={() => setIsPrivacyModalVisible(false)}>
                <MaterialIcons name="close" size={28} color="#4A5D4E" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} className="mb-6">
              <View className="gap-y-6">
                <Section
                  title="Data We Collect"
                  content="We collect account information (name, email), profile details (hobbies, preferences), and health data from connected wearables (steps, activities) to provide a personalized experience."
                />
                <Section
                  title="How We Use Your Data"
                  content="Your data is used to generate personalized activity recommendations, track your progress, and improve our services. We do not sell your personal data to third parties."
                />
                <Section
                  title="Data Sharing"
                  content="Information may be shared with service providers (like Supabase for data storage) only as necessary to provide the Nidush services. All data is encrypted during transit and at rest."
                />
                <Section
                  title="Your Rights"
                  content="You have the right to access, correct, or delete your personal data at any time. You can also revoke wearable access through the Associated Wearables section in your profile."
                />
                <Section
                  title="Data Retention"
                  content="We retain your personal data as long as your account is active. If you delete your account, we will remove your personal information from our active databases within 30 days."
                />
                <Section
                  title="Contact Us"
                  content="If you have any questions regarding your privacy, please contact our support team at privacy@nidush.com."
                />
              </View>
            </ScrollView>

            <TouchableOpacity
              onPress={() => setIsPrivacyModalVisible(false)}
              className="bg-[#5B8C51] py-4 rounded-full items-center shadow-md mb-4"
            >
              <Text
                className="text-white text-xl"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                Understood
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Account Information Modal */}
      <Modal
        visible={isAccountModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setIsAccountModalVisible(false)}
      >
        <View className="flex-1 justify-center items-center bg-black/50 px-6">
          <View className="bg-white w-full rounded-[32px] p-8 shadow-xl">
            <Text
              className="text-2xl text-[#3A4D3F] mb-6 text-center"
              style={{ fontFamily: 'Nunito_700Bold' }}
            >
              Account Information
            </Text>

            <View className="gap-y-4">
              <View>
                <Text className="text-gray-400 text-sm mb-1" style={{ fontFamily: 'Nunito_600SemiBold' }}>Full Name</Text>
                <Text className="text-lg text-[#4A5D4E]" style={{ fontFamily: 'Nunito_700Bold' }}>{userName}</Text>
              </View>
              <View>
                <Text className="text-gray-400 text-sm mb-1" style={{ fontFamily: 'Nunito_600SemiBold' }}>Email Address</Text>
                <Text className="text-lg text-[#4A5D4E]" style={{ fontFamily: 'Nunito_700Bold' }}>{userEmail}</Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={() => setIsAccountModalVisible(false)}
              className="bg-[#5B8C51] mt-8 py-4 rounded-full items-center shadow-md"
            >
              <Text
                className="text-white text-xl"
                style={{ fontFamily: 'Nunito_700Bold' }}
              >
                Close
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>

  );
}

function DeviceItem({ name, status, connected, icon, testID }: any) {
  return (
    <View
      className="flex-row items-center mb-4"
      testID={testID}
      accessible
      accessibilityRole="summary"
      accessibilityLabel={`${name}, ${status}`}
    >
      <View className="bg-[#E8EDDF] p-2 rounded-xl">
        <MaterialIcons name={icon} size={28} color="#4A5D4E" />
      </View>

      <View className="ml-4">
        <Text
          maxFontSizeMultiplier={1.2}
          className="text-base text-[#4A5D4E]"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
        >
          {name}
        </Text>
        <View className="flex-row items-center mt-0.5">
          <View
            className={`w-2.5 h-2.5 rounded-full ${connected ? 'bg-[#5B8C51]' : 'bg-gray-400'}`}
            accessible={false}
          />
          <Text
            maxFontSizeMultiplier={1.2}
            className="text-xs text-gray-500 ml-1.5"
            style={{ fontFamily: 'Nunito_400Regular' }}
          >
            {status}
          </Text>
        </View>
      </View>
    </View>
  );
}

function MenuItem({ icon, label, border = true, testID, onPress }: any) {
  return (
    <TouchableOpacity
      testID={testID}
      className={`flex-row justify-between items-center py-5 px-4 ${border ? 'border-b border-[#D1D9C5]' : ''}`}
      accessible
      accessibilityRole="button"
      accessibilityHint={`Opens ${label} section`}
      onPress={onPress}
    >
      <View className="flex-row items-center">
        <MaterialIcons name={icon} size={28} color="#4A5D4E" />
        <Text
          maxFontSizeMultiplier={1.2}
          className="text-lg text-[#4A5D4E] ml-4"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
        >
          {label}
        </Text>
      </View>
      <MaterialIcons name="chevron-right" size={28} color="#4A5D4E" />
    </TouchableOpacity>
  );
}

function Section({ title, content }: { title: string, content: string }) {
  return (
    <View>
      <Text
        className="text-lg text-[#3A4D3F] mb-1"
        style={{ fontFamily: 'Nunito_700Bold' }}
      >
        {title}
      </Text>
      <Text
        className="text-[#4A5D4E] leading-6"
        style={{ fontFamily: 'Nunito_400Regular' }}
      >
        {content}
      </Text>
    </View>
  );
}