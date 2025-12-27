import React, { useState } from 'react';
import {
  StyleSheet,
  ScrollView,
  View,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Platform,
  Pressable,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import {
  useFonts,
  Nunito_700Bold,
  Nunito_600SemiBold,
  Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

// Dados
const ALL_ACTIVITIES = [
  {
    id: '1',
    title: 'Desert Heat',
    room: 'Living Room',
    time: '45 min',
    image:
      'https://images.unsplash.com/photo-1509316785289-025f5b846b35?q=80&w=400',
    category: 'My Creations',
  },
  {
    id: '2',
    title: 'Deep Focus',
    room: 'Bedroom',
    time: '20 min',
    image:
      'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=400',
    category: 'My Creations',
  },
  {
    id: '3',
    title: 'Forest Bathing',
    room: 'Bedroom',
    time: '15 min',
    image:
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=400',
    category: 'Recommended',
  },
  {
    id: '4',
    title: 'Slow Cooking',
    room: 'Kitchen',
    time: '60 min',
    image:
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?q=80&w=400',
    category: 'Recommended',
  },
];

export default function ActivitiesScreen() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('All'); // Estado do filtro
  const [searchQuery, setSearchQuery] = useState(''); // Estado da busca

  let [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Nunito_600SemiBold,
    Nunito_400Regular,
  });
  if (!fontsLoaded) return null;

  // Lógica de Filtragem combinada (Filtro + Busca)
  const filteredData = ALL_ACTIVITIES.filter((item) => {
    const matchesFilter = activeFilter === 'All' || item.room === activeFilter;
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const myCreations = filteredData.filter(
    (item) => item.category === 'My Creations',
  );
  const recommended = filteredData.filter(
    (item) => item.category === 'Recommended',
  );

  return (
    <ThemedView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* TABS SELETOR */}
        <View style={styles.tabSelector}>
          <TouchableOpacity style={[styles.tabButton, styles.tabButtonActive]}>
            <ThemedText style={[styles.tabText, styles.tabTextActive]}>
              Activities
            </ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabButton}>
            <ThemedText style={styles.tabText}>Scenarios</ThemedText>
          </TouchableOpacity>
        </View>

        {/* BARRA DE PESQUISA */}
        <View style={styles.searchContainer}>
          <Ionicons
            name="search"
            size={18}
            color="#8E8E93"
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search..."
            placeholderTextColor="#8E8E93"
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* FILTROS HORIZONTAIS FUNCIONAIS */}
        <View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterScroll}
          >
            {['All', 'Bedroom', 'Living Room', 'Kitchen'].map((filter) => (
              <TouchableOpacity
                key={filter}
                onPress={() => setActiveFilter(filter)}
                style={[
                  styles.filterChip,
                  activeFilter === filter && styles.filterChipActive,
                ]}
              >
                <ThemedText
                  style={[
                    styles.filterText,
                    activeFilter === filter && styles.filterTextActive,
                  ]}
                >
                  {filter}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* SEÇÃO: MY CREATIONS */}
        {myCreations.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>My creations</ThemedText>
              <Ionicons name="chevron-forward" size={20} color="#548F53" />
            </View>
            <View style={styles.grid}>
              {myCreations.map((item) => (
                <ScenarioCard key={item.id} {...item} />
              ))}
            </View>
          </>
        )}

        {/* SEÇÃO: RECOMMENDED */}
        {recommended.length > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>Recommended</ThemedText>
              <Ionicons name="chevron-forward" size={20} color="#548F53" />
            </View>
            <View style={styles.grid}>
              {recommended.map((item) => (
                <ScenarioCard key={item.id} {...item} />
              ))}
            </View>
          </>
        )}

        {/* Mensagem se nada for encontrado */}
        {filteredData.length === 0 && (
          <ThemedText style={styles.emptyText}>No activities found.</ThemedText>
        )}
      </ScrollView>

      {/* FAB MENU */}
      {isMenuOpen && (
        <>
          <Pressable
            style={styles.overlay}
            onPress={() => setIsMenuOpen(false)}
          />
          <View style={styles.fabMenu}>
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => {
                setIsMenuOpen(false);
                router.push('/new-activity');
              }}
            >
              <ThemedText style={styles.menuLabel}>Activity</ThemedText>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.menuOption}
              onPress={() => setIsMenuOpen(false)}
            >
              <ThemedText style={styles.menuLabel}>Scenario</ThemedText>
            </TouchableOpacity>
          </View>
        </>
      )}

      <TouchableOpacity
        style={[styles.fab, isMenuOpen && styles.fabActive]}
        onPress={() => setIsMenuOpen(!isMenuOpen)}
      >
        <Ionicons name={isMenuOpen ? 'close' : 'add'} size={35} color="white" />
      </TouchableOpacity>
    </ThemedView>
  );
}

function ScenarioCard({ title, room, image, time }: any) {
  return (
    <View style={styles.cardContainer}>
      <ImageBackground
        source={{ uri: image }}
        style={styles.cardBg}
        imageStyle={{ borderRadius: 20 }}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.85)']}
          style={styles.cardOverlay}
        >
          <ThemedText style={styles.cardTitle}>{title}</ThemedText>
          <View style={styles.cardInfoRow}>
            <Ionicons name="time-outline" size={14} color="white" />
            <ThemedText style={styles.cardSubText}>{time}</ThemedText>
          </View>
          <View style={styles.cardInfoRow}>
            <MaterialCommunityIcons name="door-open" size={14} color="white" />
            <ThemedText style={styles.cardSubText}>{room}</ThemedText>
          </View>
        </LinearGradient>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2EB' },
  scrollContent: {
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingBottom: 100,
  },
  tabSelector: {
    flexDirection: 'row',
    backgroundColor: '#F0F2EB',
    borderRadius: 30,
    padding: 4,
    borderWidth: 1,
    borderColor: '#354F52',
    marginBottom: 15,
    height: 50,
  },
  tabButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 25,
  },
  tabButtonActive: { backgroundColor: '#548F53' },
  tabText: { color: '#2D3E27', fontSize: 14, fontFamily: 'Nunito_600SemiBold' },
  tabTextActive: { color: 'white' },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F2EB',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 38,
    borderWidth: 1,
    borderColor: '#354F52',
    marginBottom: 12,
  },
  searchIcon: { marginRight: 8 },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: 'Nunito_400Regular',
    paddingVertical: 0,
  },
  filterScroll: { marginBottom: 20 },
  filterChip: {
    paddingHorizontal: 16,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#354F52',
    marginRight: 8,
    backgroundColor: '#F0F2EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterChipActive: { backgroundColor: '#BBE6BA', borderColor: '#354F52' },
  filterText: {
    color: '#354F52',
    fontSize: 13,
    fontFamily: 'Nunito_600SemiBold',
  },
  filterTextActive: { color: '#2D3E27' },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    color: '#354F52',
    marginRight: 4,
    fontFamily: 'Nunito_700Bold',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  cardContainer: { width: '48%', aspectRatio: 1, marginBottom: 16 },
  cardBg: { flex: 1, justifyContent: 'flex-end', overflow: 'hidden' },
  cardOverlay: {
    flex: 1,
    padding: 12,
    justifyContent: 'flex-end',
    borderRadius: 20,
  },
  cardTitle: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Nunito_700Bold',
    marginBottom: 4,
  },
  cardInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  cardSubText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'Nunito_400Regular',
  },
  emptyText: {
    textAlign: 'center',
    marginTop: '50%',
    fontFamily: 'Nunito_400Regular',
    color: '#8E8E93',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    zIndex: 5,
  },
  fab: {
    position: 'absolute',
    bottom: 30,
    right: 20,
    backgroundColor: '#548F53',
    width: 65,
    height: 65,
    borderRadius: 32.5,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    zIndex: 10,
  },
  fabActive: { backgroundColor: '#548F53' },
  fabMenu: {
    position: 'absolute',
    bottom: 110,
    right: 25,
    alignItems: 'flex-end',
    gap: 15,
    zIndex: 11,
  },
  menuOption: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  menuLabel: {
    backgroundColor: '#548F53',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 10,
    color: '#FFFFFF',
    fontFamily: 'Nunito_600SemiBold',
    elevation: 3,
  },
  miniFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#548F53',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
