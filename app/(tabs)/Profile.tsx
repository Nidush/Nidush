import React from 'react';
import { StyleSheet, View, ScrollView, TouchableOpacity, Image } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ThemedText } from '@/components/themed-text';
import { useRouter } from 'expo-router';

export default function Profile() {
  const router = useRouter();

  return (
    
    
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header com Botão Voltar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/(tabs)')}>
          <Ionicons name="chevron-back" size={28} color="#2D3E27" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Profile</ThemedText>
        <View style={{ width: 28 }} /> 
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Foto e Nome */}
        <View style={styles.profileSection}>
          <Image 
            source={require('@/assets/avatars/profile.png')} 
            style={styles.mainAvatar} 
          />
          <ThemedText style={styles.userName}>Laura Rossi</ThemedText>
        </View>

        {/* Hobby Preferences */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <ThemedText style={styles.cardTitle}>Hobby Preferences</ThemedText>
            <TouchableOpacity><ThemedText style={styles.editLink}>Edit</ThemedText></TouchableOpacity>
          </View>
          <View style={styles.tagContainer}>
            {['Cooking', 'Workout', 'Meditation', 'Audiobooks'].map(hobby => (
              <View key={hobby} style={styles.tag}>
                <ThemedText style={styles.tagText}>{hobby}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        {/* Associated Wearables */}
        <View style={styles.card}>
          <ThemedText style={styles.cardTitle}>Associated Wearables</ThemedText>
          <DeviceItem name="Apple Watch" status="Connected" connected icon="watch-variant" />
          <DeviceItem name="Mi Band" status="Disconnected" connected={false} icon="watch-variant" />
          
          <TouchableOpacity style={styles.addButton}>
            <ThemedText style={styles.addButtonText}>Add New Device</ThemedText>
          </TouchableOpacity>
        </View>

        {/* Menu de Opções */}
        <View style={styles.menuCard}>
          <MenuItem icon="person-circle-outline" label="Account Information" />
          <MenuItem icon="notifications-outline" label="Notifications" />
          <MenuItem icon="shield-checkmark-outline" label="Privacy & Data" border={false} />
        </View>

        <View style={styles.menuCard}>
          <MenuItem icon="people-outline" label="Residents" border={false} />
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => router.replace('/profile-selection')}
        >
          <ThemedText style={styles.logoutText}>Logout</ThemedText>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

// Componentes Auxiliares
function DeviceItem({ name, status, connected, icon }: any) {
  return (
    <View style={styles.deviceRow}>
      <MaterialCommunityIcons name={icon} size={32} color="#4A6741" />
      <View style={{ marginLeft: 12 }}>
        <ThemedText style={styles.deviceName}>{name}</ThemedText>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: connected ? '#4A6741' : '#A8A8A8' }]} />
          <ThemedText style={styles.statusText}>{status}</ThemedText>
        </View>
      </View>
    </View>
  );
}

function MenuItem({ icon, label, border = true }: any) {
  return (
    <TouchableOpacity style={[styles.menuItem, border && styles.menuBorder]}>
      <View style={styles.menuLeft}>
        <Ionicons name={icon} size={24} color="#2D3E27" />
        <ThemedText style={styles.menuLabel}>{label}</ThemedText>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#2D3E27" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2EB' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 10 },
  headerTitle: { fontSize: 28, fontFamily: 'Nunito_600SemiBold', color: '#2D3E27' },
  scrollContent: { padding: 20 },
  profileSection: { alignItems: 'center', marginBottom: 25},
  mainAvatar: { width: 150, height: 150, borderRadius: 75, marginBottom: 15 },
  userName: { fontSize: 24, fontFamily: 'Nunito_700Bold', color: '#2D3E27' },
  card: { backgroundColor: '#F0F2EB', borderRadius: 20, padding: 20, marginBottom: 15, borderWidth: 1, borderColor: '#548F53' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  cardTitle: { fontSize: 18, fontFamily: 'Nunito_600SemiBold', color: '#354F52' },
  editLink: { color: '#548F53', fontSize: 14 },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tag: { backgroundColor: '#BBE6BA', paddingHorizontal: 15, paddingVertical: 4, borderRadius: 20 },
  tagText: { color: '#548F53', fontSize: 14 },
  deviceRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
  deviceName: { fontSize: 16, color: '#2D3E27' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, color: '#A8A8A8' },
  addButton: { backgroundColor: '#548F53', padding: 15, borderRadius: 30, alignItems: 'center', marginTop: 8,  marginInline: 24 },
  addButtonText: { color: 'white', fontFamily: 'Nunito_700Bold', fontSize: 18 },
  menuCard: { backgroundColor: '#F0F2EB', borderRadius: 20, paddingHorizontal: 15, marginBottom: 15, borderWidth: 1, borderColor: '#548F53' },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 15 },
  menuBorder: { borderBottomWidth: 1,borderBottomColor: '#548F53'},
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  menuLabel: { fontSize: 16, color: '#2D3E27' },
  logoutButton: { backgroundColor: '#5B8C51', padding: 15, borderRadius: 30, alignItems: 'center', marginTop: 10, marginBottom: 30 },
  logoutText: { color: 'white', fontFamily: 'Nunito_700Bold', fontSize: 18 }
});