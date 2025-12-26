import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, SafeAreaView, Platform, ScrollView, TextInput, ImageBackground } from 'react-native';
import { Ionicons, MaterialCommunityIcons, FontAwesome5, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/themed-text';

export default function NewActivityFlow() {
  const [step, setStep] = useState(1);
  const totalSteps = 6;

  // aida em desenvolvimento

  // Estados para salvar as escolhas
  const [activityType, setActivityType] = useState('Meditation');
  const [content, setContent] = useState('Rise and Shine');
  const [room, setRoom] = useState('Bedroom');
  const [environment, setEnvironment] = useState('Moonlight Bay');

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
    else router.back(); 
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER FIXO */}
      <View style={styles.header}>
        <TouchableOpacity onPress={prevStep}>
          <Ionicons name="chevron-back" size={30} color="#354F52" />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>New activity</ThemedText>
        <TouchableOpacity onPress={() => router.back()}>
          <ThemedText style={styles.cancelButton}>Cancel</ThemedText>
        </TouchableOpacity>
      </View>

      {/* BARRA DE PROGRESSO DINÂMICA */}
      <View style={styles.progressRow}>
        {[...Array(totalSteps)].map((_, i) => (
          <View 
            key={i} 
            style={[styles.progressStep, i + 1 <= step && styles.stepActive]} 
          />
        ))}
      </View>

      {/* CONTEÚDO QUE MUDA DE ACORDO COM O STEP */}
      <ScrollView showsVerticalScrollIndicator={false} style={styles.body}>
        {step === 1 && <StepActivityType selected={activityType} onSelect={setActivityType} />}
        {step === 2 && <StepContent selected={content} onSelect={setContent} />}
        {step === 3 && <StepRoom selected={room} onSelect={setRoom} />}
        {step === 4 && <StepEnvironment selected={environment} onSelect={setEnvironment} />}
        {step === 5 && <StepDetails />}
        {step === 6 && <StepReview activity={{activityType, content, room, environment}} />}
      </ScrollView>

      {/* BOTÃO CONTINUE FIXO EMBAIXO */}
      <TouchableOpacity style={styles.continueButton} onPress={nextStep}>
        <ThemedText style={styles.continueText}>
          {step === 6 ? "Save" : "Continue"}
        </ThemedText>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const StepActivityType = ({selected, onSelect}: any) => (
  <View>
    <ThemedText style={styles.mainTitle}>What do you want to do?</ThemedText>
    <ThemedText style={styles.subtitle}>Select the activity type you want to do.</ThemedText>
    <View style={styles.grid}>
      {[
        { id: 'Cooking', icon: 'chef-hat', lib: 'Material' },
        { id: 'Audiobook', icon: 'book-open', lib: 'Font5' },
        { id: 'Meditation', icon: 'self-improvement', lib: 'MatIcons' },
        { id: 'Workout', icon: 'dumbbell', lib: 'Font5' },
      ].map((item) => (
        <TouchableOpacity 
          key={item.id}
          style={[styles.card, selected === item.id && styles.cardSelected]} 
          onPress={() => onSelect(item.id)}
        >
          <MaterialCommunityIcons name={item.icon as any} size={40} color="#354F52" />
          <ThemedText style={styles.cardText}>{item.id}</ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const StepContent = ({selected, onSelect}: any) => (
  <View>
    <ThemedText style={styles.mainTitle}>How do you want to practice?</ThemedText>
    <ThemedText style={styles.subtitle}>Select the type of content you want to access.</ThemedText>
    
    <ThemedText style={styles.sectionLabel}>Video sessions</ThemedText>
    <View style={styles.grid}>
      <TouchableOpacity style={styles.imageCard} onPress={() => onSelect('Rise and Shine')}>
        <ImageBackground source={{uri: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773'}} style={styles.imgBg} imageStyle={{borderRadius: 15}}>
           <ThemedText style={styles.imgCardText}>Rise and Shine</ThemedText>
        </ImageBackground>
      </TouchableOpacity>
      <TouchableOpacity style={styles.imageCard} onPress={() => onSelect('Panic Reset')}>
        <ImageBackground source={{uri: 'https://images.unsplash.com/photo-1499209974431-9dac3adaf471'}} style={styles.imgBg} imageStyle={{borderRadius: 15}}>
           <ThemedText style={styles.imgCardText}>Panic Reset</ThemedText>
        </ImageBackground>
      </TouchableOpacity>
    </View>
  </View>
);

const StepRoom = ({selected, onSelect}: any) => (
  <View>
    <ThemedText style={styles.mainTitle}>Where will it happen?</ThemedText>
    <ThemedText style={styles.subtitle}>Select the room where the activity will take place.</ThemedText>
    <View style={styles.grid}>
      {['Bedroom', 'Kitchen', 'Living Room', 'Bathroom'].map((r) => (
        <TouchableOpacity 
          key={r}
          style={[styles.card, selected === r && styles.cardSelected]} 
          onPress={() => onSelect(r)}
        >
          <MaterialCommunityIcons name="bed-outline" size={35} color="#354F52" />
          <ThemedText style={styles.cardText}>{r}</ThemedText>
        </TouchableOpacity>
      ))}
    </View>
  </View>
);

const StepEnvironment = ({selected, onSelect}: any) => (
  <View>
    <ThemedText style={styles.mainTitle}>What kind of environment?</ThemedText>
    <View style={styles.grid}>
       <ThemedText>Environment list...</ThemedText>
    </View>
  </View>
);

const StepDetails = () => (
  <View>
    <ThemedText style={styles.mainTitle}>Last details</ThemedText>
    <View style={styles.uploadBox}>
       <Ionicons name="add-circle-outline" size={50} color="#354F52" />
    </View>
    <ThemedText style={styles.inputLabel}>Activity Name</ThemedText>
    <TextInput style={styles.input} placeholder="Ex: Morning Yoga" />
    <ThemedText style={styles.inputLabel}>Description</ThemedText>
    <TextInput style={[styles.input, {height: 100}]} multiline placeholder="Describe it..." />
  </View>
);

const StepReview = ({activity}: any) => (
  <View>
    <ThemedText style={styles.mainTitle}>Review and save</ThemedText>
    <View style={styles.reviewItem}>
       <ThemedText style={styles.reviewLabel}>Activity Type</ThemedText>
       <View style={styles.reviewCard}><ThemedText>{activity.activityType}</ThemedText></View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F0F2EB', paddingHorizontal: 20 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 15, marginBottom: 10 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#354F52' },
  cancelButton: { color: '#548F53', fontWeight: '600' },
  progressRow: { flexDirection: 'row', gap: 8, marginVertical: 20 },
  progressStep: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#D9DFD0' },
  stepActive: { backgroundColor: '#548F53' },
  body: { flex: 1 },
  mainTitle: { fontSize: 24, fontWeight: '800', color: '#354F52', marginBottom: 5 },
  subtitle: { fontSize: 14, color: '#6A7D5B', marginBottom: 25 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  card: { width: '47%', aspectRatio: 1, backgroundColor: '#C4D4B5', borderRadius: 20, justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  cardSelected: { borderWidth: 2, borderColor: '#4A6741' },
  cardText: { marginTop: 8, fontSize: 16, fontWeight: '600' },
  imageCard: { width: '47%', height: 120, marginBottom: 15 },
  imgBg: { flex: 1, justifyContent: 'flex-end', padding: 10 },
  imgCardText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  sectionLabel: { fontSize: 18, fontWeight: '700', color: '#354F52', marginVertical: 15 },
  input: { backgroundColor: 'white', borderRadius: 10, padding: 15, marginBottom: 20, borderColor: '#D9DFD0' },
  inputLabel: { fontWeight: '600', marginBottom: 8, color: '#354F52' },
  uploadBox: { width: '100%', height: 150, backgroundColor: '#C4D4B5', borderRadius: 15, justifyContent: 'center', alignItems: 'center', marginBottom: 20 },
  continueButton: { backgroundColor: '#4A6741', height: 55, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 30 },
  continueText: { color: 'white', fontSize: 18, fontWeight: '700' },
  reviewItem: { marginBottom: 15 },
  reviewLabel: { fontWeight: 'bold', color: '#354F52', marginBottom: 5 },
  reviewCard: { backgroundColor: 'white', padding: 15, borderRadius: 12 }
});