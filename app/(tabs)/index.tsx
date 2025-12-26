import React from 'react';
import { Image, ImageBackground } from 'expo-image';
import { StyleSheet, ScrollView, View, TouchableOpacity, Platform } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link } from 'expo-router'; 

import { useFonts, Nunito_700Bold, Nunito_600SemiBold, Nunito_400Regular } from '@expo-google-fonts/nunito';
import { ThemedText } from '@/components/themed-text';

export default function Index() {
  let [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Nunito_600SemiBold,
    Nunito_400Regular,
  });

  if (!fontsLoaded) {
    return null; 
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.greetingText}>Good morning,</ThemedText>
            <ThemedText style={styles.userName}>Laura</ThemedText>
          </View>
          <View style={styles.headerRight}>
            {/* Meter o icon bem  */}
            <Ionicons name="notifications-outline" size={22} color="#548F53" />
            
           <Link href="/Profile" asChild> 
            <TouchableOpacity>
              <Image source={require('@/assets/avatars/profile.png')} style={styles.avatar} />
            </TouchableOpacity>
          </Link>
          </View>
        </View>

        <ImageBackground 
          source={{ uri: 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?q=80&w=800' }} 
          style={styles.activeCard}
          imageStyle={{ borderRadius: 15 }}
        >
          <View style={styles.activeCardOverlay}>
            <View style={styles.activeInfo}>
              <ThemedText style={styles.activeLabel}>Active Scenario</ThemedText>
              <ThemedText style={styles.activeTitle}>Total Focus</ThemedText>
              <View style={styles.activeIcons}>
                <View style={styles.miniIconCircle}><MaterialCommunityIcons name="speaker" size={14} color="white" /></View>
                <View style={styles.miniIconCircle}><MaterialCommunityIcons name="lightbulb-outline" size={14} color="white" /></View>
                <View style={styles.miniIconCircle}><MaterialCommunityIcons name="music-note" size={14} color="white" /></View>
              </View>
            </View>
            <TouchableOpacity style={styles.playButton}>
              <Ionicons name="play" size={28} color="#548F53" />
            </TouchableOpacity>
          </View>
        </ImageBackground>

        {/* SECTION: ACTIVITIES FOR YOU */}
        {/* aqui meter o gradiente e com e texto bem  */}
        <ThemedText style={styles.sectionTitle}>Activities for you</ThemedText>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
          <ActivityCard title="Stretching" time="5min" room="Bedroom" image="https://images.unsplash.com/photo-1552196563-55cd4e45efb3?q=80&w=400" />
          <ActivityCard title="Pikelets" time="17min" room="Kitchen" image="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=400" />
          <ActivityCard title="Meditation" time="15min" room="Living Room" image="https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=400" />
        </ScrollView>

        {/* SECTION: SHORTCUTS */}
        <View style={styles.sectionHeader}>
          <ThemedText style={styles.sectionTitle}>Shortcuts</ThemedText>
          <TouchableOpacity><ThemedText style={styles.editLink}>Edit</ThemedText></TouchableOpacity>
        </View>

        <View style={styles.gridContainer}>
          <ShortcutCard title="Cooking Time" time="50min" room="Kitchen" image="https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=400" />
          <ShortcutCard title="Meditation Time" time="15min" room="Bedroom" image="https://images.unsplash.com/photo-1506126613408-eca07ce68773?q=80&w=400" />
          <ShortcutCard title="Skincare Time" time="10min" room="Bathroom" image="https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=400" />
          <ShortcutCard title="Reading Time" time="45min" room="Living Room" image="https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=400" />
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function ActivityCard({ title, time, room, image }: any) {
  return (
    <ImageBackground source={{ uri: image }} style={styles.cardBg} imageStyle={{ borderRadius: 15 }}>
      <View style={styles.cardOverlay}>
        <ThemedText style={styles.cardTitle}>{title}</ThemedText>
        <View style={styles.cardInfoRow}>
          <Ionicons name="time-outline" size={14} color="white" />
          <ThemedText style={styles.cardSubText}>{time}</ThemedText>
        </View>
        <View style={styles.cardInfoRow}>
          <MaterialCommunityIcons name="door-open" size={14} color="white" />
          <ThemedText style={styles.cardSubText}>{room}</ThemedText>
        </View>
      </View>
    </ImageBackground>
  );
}

function ShortcutCard(props: any) {
  return <View style={styles.shortcutWrapper}><ActivityCard {...props} /></View>;
}

// ESTILOS
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F0F2EB',
    paddingTop: Platform.OS === 'android' ? 40 : 0 
  },
  scrollContent: { 
    padding: 15,
  },
  header: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 25,
  },
  greetingText: { 
    fontSize: 20, 
    color: '#354F52', 
    fontFamily: 'Nunito_600SemiBold' 
  },
  userName: { 
    fontSize: 28, 
    color: '#354F52', 
    fontFamily: 'Nunito_700Bold' 
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: { width: 45, height: 45, borderRadius: 22.5 },

  activeCard: { 
    borderRadius: 15, 
    marginBottom: 25,
    overflow: 'hidden',
  },
  activeCardOverlay: {
    padding: 20, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)', 
  },
  activeInfo: { flex: 1 },
  activeLabel: { color: 'white', fontSize: 14, opacity: 0.9, fontFamily: 'Nunito_600SemiBold' },
  activeTitle: { 
    color: 'white', 
    fontSize: 24, 
    fontFamily: 'Nunito_700Bold' 
  },
  activeIcons: { flexDirection: 'row', gap: 8, marginTop: 8 },
  miniIconCircle: { backgroundColor: 'rgba(255,255,255,0.25)', padding: 6, borderRadius: 50 },
  playButton: { backgroundColor: 'white', width: 55, height: 55, borderRadius: 27.5, justifyContent: 'center', alignItems: 'center' },
  
  sectionTitle: { 
    fontSize: 22, 
    color: '#2D3E27', 
    marginBottom: 15,
    fontFamily: 'Nunito_600SemiBold' 
  },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  editLink: { color: '#548F53', textDecorationLine: 'underline', fontFamily: 'Nunito_600SemiBold' },
  horizontalScroll: { marginBottom: 20 },

  cardBg: { width: 160, height: 160, marginRight: 15, justifyContent: 'flex-end' },
  shortcutWrapper: { width: '48%', height: 160, marginBottom: 15 },
  cardOverlay: { 
    padding: 12, 
    backgroundColor: 'rgba(0,0,0,0.4)', 
    borderBottomLeftRadius: 15, 
    borderBottomRightRadius: 15,
  },
  cardTitle: { 
    color: 'white', 
    fontSize: 16, 
    fontFamily: 'Nunito_700Bold' 
  },
  cardInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  cardSubText: { color: 'white', fontSize: 12, fontFamily: 'Nunito_400Regular' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
});