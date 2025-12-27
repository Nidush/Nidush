import React, { useState, ComponentProps } from 'react';
import { StyleSheet, View, TouchableOpacity, ScrollView, TextInput, Dimensions, ImageBackground, Image } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { useFonts, Nunito_700Bold, Nunito_600SemiBold, Nunito_400Regular } from '@expo-google-fonts/nunito';
import { ThemedText } from '@/components/themed-text';

const { width } = Dimensions.get('window');

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];
type IonIconName = ComponentProps<typeof Ionicons>['name'];

const FlowHeader = ({ title, step, totalSteps, onBack }: any) => (
  <View>
    <View style={styles.header}>
      <TouchableOpacity onPress={onBack}>
        <Ionicons name="chevron-back" size={28} color="#2F4F4F" />
      </TouchableOpacity>
      <ThemedText style={styles.headerTitle}>{title}</ThemedText>
      <TouchableOpacity onPress={() => router.back()}>
        <ThemedText style={styles.cancelButton}>Cancel</ThemedText>
      </TouchableOpacity>
    </View>
    <View style={styles.progressRow}>
      {[...Array(totalSteps)].map((_, i) => (
        <View 
          key={i} 
          style={[
            styles.progressStep, 
            i + 1 <= step ? styles.stepActive : styles.stepInactive
          ]} 
        />
      ))}
    </View>
  </View>
);

const ContentCard = ({ item, isSelected, onSelect, type = 'small' }: any) => (
  <TouchableOpacity 
    onPress={() => onSelect(item.title)}
    activeOpacity={0.9}
    style={[
      type === 'large' ? styles.largeCard : styles.smallCard,
      isSelected && styles.contentSelected 
    ]}
  >
    <ImageBackground 
      source={{ uri: item.image }} 
      style={styles.cardImage} 
      imageStyle={{ borderRadius: 20 }}
    >
      <TouchableOpacity style={styles.moreIcon}>
        <MaterialIcons name="more-vert" size={24} color="white" />
      </TouchableOpacity>

      <View style={styles.cardOverlay}>
        {item.recommended && <ThemedText style={styles.recommendedTag}>Recommended</ThemedText>}
        <View>
          <ThemedText style={type === 'large' ? styles.largeCardTitle : styles.smallCardTitle} numberOfLines={1}>
            {item.title}
          </ThemedText>
          <View style={styles.cardInfoRow}>
            <Ionicons 
              name={(item.type === 'Video' ? "play-circle" : "headset") as IonIconName} 
              size={14} 
              color="white" 
            />
            <ThemedText style={styles.cardInfoText}>{item.type} • {item.duration}</ThemedText>
          </View>
        </View>
      </View>
    </ImageBackground>
  </TouchableOpacity>
);

const StepWrapper = ({ title, subtitle, children }: any) => (
  <View style={{ marginTop: 10 }}>
    <ThemedText style={styles.mainTitle}>{title}</ThemedText>
    {subtitle && <ThemedText style={styles.subtitle}>{subtitle}</ThemedText>}
    {children}
  </View>
);

const ReviewItem = ({ label, value }: any) => (
  <View style={styles.reviewSection}>
    <View style={styles.rowBetween}>
      <ThemedText style={styles.reviewLabelSmall}>{label}</ThemedText>
      <TouchableOpacity><ThemedText style={styles.editText}>Edit</ThemedText></TouchableOpacity>
    </View>
    <View style={styles.reviewValueBox}>
       <ThemedText style={styles.reviewValueText}>{value || 'Not selected'}</ThemedText>
    </View>
  </View>
);

export default function NewActivityFlow() {
  let [fontsLoaded] = useFonts({
    Nunito_700Bold,
    Nunito_600SemiBold,
    Nunito_400Regular,
  });

  const [step, setStep] = useState(1);
  const totalSteps = 6;

  const [activityType, setActivityType] = useState(''); 
  const [selectedContent, setSelectedContent] = useState(''); 
  const [room, setRoom] = useState(''); 
  const [environment, setEnvironment] = useState('Moonlight Bay');
  const [activityName, setActivityName] = useState('');
  const [description, setDescription] = useState('');

  if (!fontsLoaded) return null;

  const nextStep = () => { if (step < totalSteps) setStep(step + 1); };
  const prevStep = () => { if (step > 1) setStep(step - 1); else router.back(); };

  const isNextDisabled = () => {
    if (step === 1 && !activityType) return true;
    if (step === 2 && !selectedContent) return true;
    if (step === 3 && !room) return true;
    return false;
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <FlowHeader title="New activity" step={step} totalSteps={totalSteps} onBack={prevStep} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
          
          {step === 1 && (
            <StepWrapper title="What do you want to do?" subtitle="Select the activity type you want to do.">
              <View style={styles.grid}>
                {['Cooking', 'Audiobook', 'Meditation', 'Workout'].map((id) => (
                  <TouchableOpacity 
                    key={id} 
                    style={[styles.typeCard, activityType === id && styles.typeCardSelected]} 
                    onPress={() => setActivityType(id)}
                  >
                    <MaterialIcons 
                      name={(id === 'Cooking' ? 'restaurant' : id === 'Audiobook' ? 'menu-book' : id === 'Meditation' ? 'self-improvement' : 'fitness-center') as MaterialIconName} 
                      size={50} color="#354F52" 
                    />
                    <ThemedText style={styles.cardLabel}>{id}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </StepWrapper>
          )}

          {step === 2 && (
            <StepWrapper title="How do you want to practice?" subtitle="Select the type of content you want to have access.">
              <ContentCard 
                type="large"
                item={{ title: 'Stress Buster', duration: '8min', type: 'Video', recommended: true, image: 'https://picsum.photos/400/300' }}
                isSelected={selectedContent === 'Stress Buster'}
                onSelect={setSelectedContent}
              />
              <ThemedText style={styles.sectionTitle}>Video sessions</ThemedText>
              <View style={styles.row}>
                <ContentCard 
                  item={{ title: 'Rise and Shine', duration: '10min', type: 'Video', image: 'https://picsum.photos/200/200' }}
                  isSelected={selectedContent === 'Rise and Shine'}
                  onSelect={setSelectedContent}
                />
                <ContentCard 
                  item={{ title: 'Panic Reset', duration: '15min', type: 'Video', image: 'https://picsum.photos/201/200' }}
                  isSelected={selectedContent === 'Panic Reset'}
                  onSelect={setSelectedContent}
                />
              </View>
              <ThemedText style={styles.sectionTitle}>Audio sessions</ThemedText>
              <View style={styles.row}>
                <ContentCard 
                  item={{ title: 'Brain Boost', duration: '5min', type: 'Audio', image: 'https://picsum.photos/202/200' }}
                  isSelected={selectedContent === 'Brain Boost'}
                  onSelect={setSelectedContent}
                />
                <ContentCard 
                  item={{ title: 'Self Love', duration: '12min', type: 'Audio', image: 'https://picsum.photos/203/200' }}
                  isSelected={selectedContent === 'Self Love'}
                  onSelect={setSelectedContent}
                />
              </View>
            </StepWrapper>
          )}

          {step === 3 && (
            <StepWrapper title="Where will it happen?" subtitle="Select the room.">
              <View style={styles.grid}>
                {[
                  { id: 'Bedroom', icon: 'bed' as MaterialIconName },
                  { id: 'Kitchen', icon: 'restaurant' as MaterialIconName },
                  { id: 'Living Room', icon: 'weekend' as MaterialIconName }, 
                  { id: 'Bathroom', icon: 'bathtub' as MaterialIconName },
                  { id: 'Office', icon: 'computer' as MaterialIconName },
                  { id: 'Garden', icon: 'local-florist' as MaterialIconName },
                ].map((r) => (
                  <TouchableOpacity 
                    key={r.id} 
                    style={[styles.typeCard, room === r.id && styles.typeCardSelected]} 
                    onPress={() => setRoom(r.id)}
                  >
                    <MaterialIcons name={r.icon} size={50} color="#354F52" />
                    <ThemedText style={styles.cardLabel}>{r.id}</ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </StepWrapper>
          )}

          {step === 4 && (
            <StepWrapper 
              title="What kind of environment are you looking for?" 
              subtitle="Select a scenario or create a personalized scene."
            >
              <ThemedText style={styles.sectionTitle}>Scenarios</ThemedText>
              <View style={styles.grid}>
                {[
                  { id: 'Moonlight Bay', img: 'https://picsum.photos/id/10/400/400' },
                  { id: 'Rose Garden', img: 'https://picsum.photos/id/306/400/400' },
                  { id: 'Deep Focus', img: 'https://picsum.photos/id/445/400/400' },
                  { id: 'Lavender Dream', img: 'https://picsum.photos/id/529/400/400' },
                  { id: 'Forest Bathing', img: 'https://picsum.photos/id/28/400/400' },
                ].map((env) => (
                  <TouchableOpacity 
                    key={env.id} 
                    style={[styles.envCard, environment === env.id && styles.envSelected]} 
                    onPress={() => setEnvironment(env.id)}
                  >
                    <ImageBackground source={{ uri: env.img }} style={{flex:1}} imageStyle={{borderRadius: 20}}>
                      <TouchableOpacity style={styles.moreIcon}>
                        <MaterialIcons name="more-vert" size={24} color="white" />
                      </TouchableOpacity>
                      <View style={styles.envOverlay}>
                        <ThemedText style={styles.envText}>{env.id}</ThemedText>
                        <View style={styles.roomIndicator}>
                          <MaterialIcons name="door-front" size={16} color="white" />
                          <ThemedText style={styles.roomText}>{room || 'Bedroom'}</ThemedText>
                        </View>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                ))}
                
                <TouchableOpacity style={styles.createSceneCard}>
                  <Ionicons name="add" size={40} color="#354F52" />
                  <ThemedText style={styles.createSceneText}>Create Scene</ThemedText>
                </TouchableOpacity>
              </View>
            </StepWrapper>
          )}

          {step === 5 && (
            <StepWrapper title="Last details" subtitle="Activity info.">
              <TextInput placeholder="Activity Name" style={styles.input} value={activityName} onChangeText={setActivityName} />
              <TextInput placeholder="Description" style={[styles.input, { height: 120 }]} multiline value={description} onChangeText={setDescription} />
            </StepWrapper>
          )}

          {step === 6 && (
            <StepWrapper title="Review and save">
              <ReviewItem label="Activity Type" value={activityType} />
              <ReviewItem label="Contents" value={selectedContent} />
              <ReviewItem label="Room" value={room} />
              <ReviewItem label="Environment" value={environment} />
            </StepWrapper>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.continueButton, isNextDisabled() && { opacity: 0.5 }]} 
            onPress={nextStep}
            disabled={isNextDisabled()}
          >
            <ThemedText style={styles.continueText}>{step === 6 ? "Save" : "Continue"}</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAF7', paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', height: 60, marginTop: 10 },
  headerTitle: { fontSize: 20, color: '#2F4F4F', fontFamily: 'Nunito_700Bold' },
  cancelButton: { color: '#548F53', fontSize: 16, fontFamily: 'Nunito_600SemiBold' },
  progressRow: { flexDirection: 'row', gap: 6, marginVertical: 15 },
  progressStep: { flex: 1, height: 6, borderRadius: 50 },
  stepActive: { backgroundColor: '#519A4E' },
  stepInactive: { backgroundColor: '#DDE5D7' },
  mainTitle: { fontSize: 26, color: '#2F4F4F', marginBottom: 8, fontFamily: 'Nunito_700Bold' },
  subtitle: { fontSize: 15, color: '#6A7D5B', marginBottom: 25, fontFamily: 'Nunito_600SemiBold' },
  sectionTitle: { fontSize: 18, color: '#2F4F4F', fontFamily: 'Nunito_700Bold', marginVertical: 12 },
  
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },

  typeCard: { width: '48%', height: 150, backgroundColor: '#BBDABA', borderRadius: 24, justifyContent: 'center', alignItems: 'center', borderWidth: 3, borderColor: 'transparent' },
  typeCardSelected: { borderColor: '#548F53' },
  cardLabel: { marginTop: 10, fontSize: 16, color: '#2F4F4F', fontFamily: 'Nunito_600SemiBold' },
  
  largeCard: { width: '100%', height: 148, borderRadius: 24, overflow: 'hidden', marginBottom: 12, borderWidth: 3, borderColor: 'transparent' },
  smallCard: { width: '48%', height: 148, borderRadius: 24, overflow: 'hidden', borderWidth: 3, borderColor: 'transparent' },
  contentSelected: { borderColor: '#548F53' }, 
  
  cardImage: { flex: 1 },
  moreIcon: { position: 'absolute', top: 10, right: 4, zIndex: 10 }, 
  cardOverlay: { padding: 12, backgroundColor: 'rgba(0,0,0,0.15)', flex: 1, justifyContent: 'flex-end' },
  largeCardTitle: { color: 'white', fontSize: 20, fontFamily: 'Nunito_700Bold' },
  smallCardTitle: { color: 'white', fontSize: 15, fontFamily: 'Nunito_700Bold' },
  recommendedTag: { color: 'white', fontSize: 11, fontFamily: 'Nunito_400Regular', marginBottom: 2 },
  cardInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  cardInfoText: { color: 'white', fontSize: 11, fontFamily: 'Nunito_400Regular' },

  envCard: { width: '48%', height: 148, borderRadius: 24, overflow: 'hidden', borderWidth: 3, borderColor: 'transparent' },
  envSelected: { borderColor: '#548F53' },
  envOverlay: { flex: 1, padding: 12, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.2)' },
  envText: { color: 'white', fontFamily: 'Nunito_700Bold', fontSize: 14 },

  input: { backgroundColor: 'white', borderRadius: 15, padding: 18, fontSize: 16, marginBottom: 15, fontFamily: 'Nunito_400Regular' },
  reviewSection: { marginBottom: 15 },
  reviewLabelSmall: { fontSize: 16, color: '#2F4F4F', fontFamily: 'Nunito_700Bold' },
  reviewValueBox: { backgroundColor: 'white', padding: 15, borderRadius: 15, marginTop: 8 },
  reviewValueText: { fontSize: 15, color: '#4A6741', fontFamily: 'Nunito_600SemiBold' },
  editText: { color: '#548F53', fontFamily: 'Nunito_600SemiBold' },

  footer: { position: 'absolute', bottom: 40, left: 0, right: 0, alignItems: 'center' },
  continueButton: { backgroundColor: '#548F53', height: 54, width: 210, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },
  continueText: { color: 'white', fontSize: 18, fontFamily: 'Nunito_700Bold' },

  // Create new Scene
  roomIndicator: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    gap: 4 
  },
  roomText: { 
    color: 'white', 
    fontFamily: 'Nunito_400Regular', 
    fontSize: 14 
  },
  createSceneCard: {
    width: '48%',
    height: 148,
    backgroundColor: '#D1E4D1', 
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createSceneText: {
    color: '#354F52',
    fontFamily: 'Nunito_600SemiBold',
    fontSize: 16,
    marginTop: 8
  },
});