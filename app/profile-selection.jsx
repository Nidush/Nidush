import React from 'react';
import { StyleSheet, View, Text, Image, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const profiles = [
  { id: 1, name: 'Laura Rossi', avatar: require('./../assets/avatars/profile.png') },
  { id: 2, name: 'Miguel Soares', avatar: require('./../assets/avatars/profile1.png') },
  { id: 3, name: 'Inês Silva', avatar: require('./../assets/avatars/profile3.png') },
];

export default function ProfileSelection() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Who is at home?</Text>

        <View style={styles.grid}>
          {profiles.map((profile) => (
            <TouchableOpacity
              key={profile.id}
              activeOpacity={0.7}
              onPress={() => router.replace('/(tabs)')}
              style={styles.profileItem}
            >
              <View style={styles.avatarContainer}>
                <Image 
                  source={profile.avatar} 
                  style={styles.avatarImage} 
                  resizeMode="cover" 
                />
              </View>
              <Text style={styles.profileName}>{profile.name}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity activeOpacity={0.7} style={styles.profileItem}>
            <View style={[styles.avatarContainer, styles.addButton]}>
              <Ionicons name="add" size={70} color="#354F52" />{/* Tenho que meter o Ionicons do MaterialIcons da Google */}
            </View>
            <Text style={styles.profileName}>Add Profile</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.manageButton}>
          <Text style={styles.manageText}>Manage profiles</Text>
        </TouchableOpacity>
      </ScrollView>

      <Image 
        source={require('./../assets/images/Wave2.png')} 
        style={styles.waveImage}
        resizeMode="stretch"
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F2EB', 
  },
  scrollContent: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 120, 
    zIndex: 2,
  },
  title: {
    fontFamily: 'Nunito-Bold',
    fontSize: 32, 
    color: '#3A5A54', 
    marginBottom: 50,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    paddingHorizontal: 20,
    gap: 15,
  },
  profileItem: {
    alignItems: 'center',
    width: '45%', 
    marginBottom: 40,
  },
  avatarContainer: {
    width: 110, 
    height: 110,
    borderRadius: 75, 
    backgroundColor: '#FFFFFF',
    overflow: 'hidden',
    marginBottom: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  addButton: {
    backgroundColor: '#C2DBC5', 
    borderWidth: 1,
    borderColor: 'rgba(58, 90, 84, 0.2)', 
  },
  profileName: {
    fontFamily: 'Nunito-SemiBold',
    fontSize: 18, 
    color: '#3A5A54',
    textAlign: 'center',
  },
  manageButton: {
    marginTop: 10,
  },
  manageText: {
    fontFamily: 'Nunito-Bold',
    fontSize: 18,
    color: '#548F53',
    textDecorationLine: 'underline',
  },
  waveImage: {
    position: 'absolute',
    bottom: 0,
    width: width,
    height: 380, 
    zIndex: 1,
  },
});