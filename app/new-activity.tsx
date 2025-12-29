import React, { useState, ComponentProps } from 'react';
import {
  StyleSheet,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  ImageBackground,
  Image,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import {
  useFonts,
  Nunito_700Bold,
  Nunito_600SemiBold,
  Nunito_400Regular,
} from '@expo-google-fonts/nunito';
import { ThemedText } from '@/components/themed-text';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';


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
        {item.recommended && (
          <ThemedText style={styles.recommendedTag}>Recommended</ThemedText>
        )}
        <View>
          <ThemedText
            style={
              type === 'large' ? styles.largeCardTitle : styles.smallCardTitle
            }
            numberOfLines={1}
          >
            {item.title}
          </ThemedText>
          <View style={styles.cardInfoRow}>
            <Ionicons
              name={(item.type === 'Video' ? "play-circle" : "headset") as IonIconName}
              size={14}
              color="white"
            />
            <ThemedText style={styles.cardInfoText}>
              {item.type} • {item.duration}
            </ThemedText>
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
      <TouchableOpacity>
        <ThemedText style={styles.editText}>Edit</ThemedText>
      </TouchableOpacity>
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
  
const handleSave = async () => {
  const newActivity = {
    id: Date.now().toString(),
    title: activityName || 'Untitled Activity',
    room: room || 'Any Room',
    time: '15 min',
    image: activityImage || 'https://picsum.photos/400/600',
    category: 'My creations',
    description,
    environment,
  };

  try {
    const storedActivities = await AsyncStorage.getItem('@myActivities');
    const parsedActivities = storedActivities
      ? JSON.parse(storedActivities)
      : [];

    const updatedActivities = [newActivity, ...parsedActivities];

    await AsyncStorage.setItem(
      '@myActivities',
      JSON.stringify(updatedActivities)
    );

    router.push({
      pathname: '/activity-details',
      params: {
        id: newActivity.id,
      },
    });
  } catch (e) {
    console.log('Erro ao salvar atividade', e);
  }
};



  const [step, setStep] = useState(1);
  const totalSteps = 6;

  const [activityType, setActivityType] = useState('');
  const [selectedContent, setSelectedContent] = useState('');
  const [room, setRoom] = useState('');
  const [environment, setEnvironment] = useState('Moonlight Bay');
  const [activityName, setActivityName] = useState('');
  const [description, setDescription] = useState('');

  const [activityImage, setActivityImage] = useState<string | null>(null);

  if (!fontsLoaded) return null;

  const nextStep = () => {
    if (step < totalSteps) setStep(step + 1);
  };
  const prevStep = () => {
    if (step > 1) setStep(step - 1);
    else router.back();
  };

  const isNextDisabled = () => {
    if (step === 1 && !activityType) return true;
    if (step === 2 && !selectedContent) return true;
    if (step === 3 && !room) return true;
    return false;
  };

  const FinalReviewCard = ({ label, children, onEdit }: any) => (
    <View style={styles.reviewCardContainer}>
      <View style={styles.rowBetween}>
        <ThemedText style={styles.reviewLabel}>{label}</ThemedText>
        <TouchableOpacity onPress={onEdit}>
          <ThemedText style={styles.editText}>Edit</ThemedText>
        </TouchableOpacity>
      </View>
      <View style={styles.reviewContentBox}>
        {children}
      </View>
    </View>
  );

  const pickImage = async () => {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      alert('Gallery permission is required');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setActivityImage(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <FlowHeader
          title="New activity"
          step={step}
          totalSteps={totalSteps}
          onBack={prevStep}
        />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>

          {step === 1 && (
            <StepWrapper
              title="What do you want to do?"
              subtitle="Select the activity type you want to do."
            >
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
                item={{
                  title: 'Stress Buster',
                  duration: '8min',
                  type: 'Video',
                  recommended: true,
                  image: 'https://picsum.photos/400/300',
                }}
                isSelected={selectedContent === 'Stress Buster'}
                onSelect={setSelectedContent}
              />
              <ThemedText style={styles.sectionTitle}>
                Video sessions
              </ThemedText>
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
              <ThemedText style={styles.sectionTitle}>
                Audio sessions
              </ThemedText>
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
            <StepWrapper
              title="Where will it happen?"
              subtitle="Select the room."
            >
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
                    <ImageBackground source={{ uri: env.img }} style={{ flex: 1 }} imageStyle={{ borderRadius: 20 }}>
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
            <StepWrapper title="Last details" subtitle="Select an image, name and description for the activity.">
              <ThemedText style={styles.inputLabel}>Image</ThemedText>
              <TouchableOpacity
                  style={styles.imageUploadBox}
                  activeOpacity={0.7}
                  onPress={pickImage}
                >
                  {activityImage ? (
                    <Image
                      source={{ uri: activityImage }}
                      style={{ width: '100%', height: '100%', borderRadius: 20 }}
                      resizeMode="cover"
                    />
                  ) : (
                    <MaterialIcons name="add-photo-alternate" size={60} color="#354F52" />
                  )}
                </TouchableOpacity>


              <ThemedText style={styles.inputLabel}>Activity Name</ThemedText>
              <TextInput
                placeholder=""
                style={styles.input}
                value={activityName}
                onChangeText={setActivityName}
              />

              <ThemedText style={styles.inputLabel}>Description</ThemedText>
              <TextInput
                placeholder=""
                style={[styles.input, { height: 120, textAlignVertical: 'top' }]}
                multiline
                value={description}
                onChangeText={setDescription}
              />
            </StepWrapper>
          )}

          {step === 6 && (
            <StepWrapper title="Review and save" subtitle="See if everything is right and save your new activity.">

              {/* Activity Type */}
              <FinalReviewCard label="Activity Type" onEdit={() => setStep(1)}>
                <View style={styles.reviewRow}>
                  <View style={styles.iconCircle}>
                    <MaterialIcons name="self-improvement" size={24} color="#354F52" />
                  </View>
                  <ThemedText style={styles.reviewValueText}>{activityType || 'Meditation'}</ThemedText>
                </View>
              </FinalReviewCard>

              {/* Contents */}
              <FinalReviewCard label="Contents" onEdit={() => setStep(2)}>
                <ImageBackground
                  source={{ uri: 'https://picsum.photos/id/200/200' }}
                  style={styles.reviewContentImg}
                  imageStyle={{ borderRadius: 12 }}
                >
                  <View style={styles.reviewImgOverlay}>
                    <ThemedText style={styles.imgTitleSmall}>{selectedContent || 'Rise and shine'}</ThemedText>
                    <ThemedText style={styles.imgSubSmall}><Ionicons name="time-outline" size={10} /> 10min</ThemedText>
                    <ThemedText style={styles.imgSubSmall}><Ionicons name="play-circle" size={10} /> Video</ThemedText>
                  </View>
                </ImageBackground>
              </FinalReviewCard>

              {/* Room */}
              <FinalReviewCard label="Room" onEdit={() => setStep(3)}>
                <View style={styles.reviewRow}>
                  <View style={styles.iconCircle}>
                    <MaterialIcons name="bed" size={24} color="#354F52" />
                  </View>
                  <ThemedText style={styles.reviewValueText}>{room || 'Bedroom'}</ThemedText>
                </View>
              </FinalReviewCard>

              {/* Environment */}
              <FinalReviewCard label="Environment" onEdit={() => setStep(4)}>
                <View style={styles.rowBetween}>
                  <View style={styles.reviewRow}>
                    <View style={styles.iconCircle}>
                      <MaterialIcons name="landscape" size={24} color="#354F52" />
                    </View>
                    <ThemedText style={styles.reviewValueText}>{environment || 'Moonlight Bay'}</ThemedText>
                  </View>
                  <MaterialIcons name="keyboard-arrow-down" size={24} color="#354F52" />
                </View>
              </FinalReviewCard>

              {/* Activity Info */}
              <FinalReviewCard label="Activity Info" onEdit={() => setStep(5)}>
                <View style={styles.reviewRow}>
                  {activityImage ? (
                    <Image source={{ uri: activityImage }} style={styles.infoSmallImg} />
                  ) : (
                    <View style={[styles.infoSmallImg, { backgroundColor: '#C8E2C8' }]} />
                  )}

                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <ThemedText style={styles.infoTitleText}>{activityName || 'After Work Detox'}</ThemedText>
                    <ThemedText style={styles.infoDescText} numberOfLines={3}>
                      {description || 'A few minutes to relax and enjoy some alone time after a very long and exhausting day of work.'}
                    </ThemedText>
                  </View>
                </View>
              </FinalReviewCard>

            </StepWrapper>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={styles.continueButton}
            onPress={step === 6 ? handleSave : nextStep} 
          >
            <ThemedText style={styles.continueText}>
              {step === 6 ? 'Save' : 'Continue'}
            </ThemedText>
        </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAF7', paddingHorizontal: 20 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 60,
    marginTop: 10,
  },
  headerTitle: { fontSize: 20, color: '#2F4F4F', fontFamily: 'Nunito_700Bold' },
  cancelButton: {
    color: '#548F53',
    fontSize: 16,
    fontFamily: 'Nunito_600SemiBold',
  },
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

  typeCard: {
    width: '48%',
    height: 150,
    backgroundColor: '#BBDABA',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
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

  envCard: {
    width: '48%',
    height: 148,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  envSelected: { borderColor: '#548F53' },
  envOverlay: {
    flex: 1,
    padding: 12,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  envText: { color: 'white', fontFamily: 'Nunito_700Bold', fontSize: 14 },

  reviewSection: { marginBottom: 15 },
  reviewLabelSmall: { fontSize: 16, color: '#2F4F4F', fontFamily: 'Nunito_700Bold' },
  reviewValueBox: { backgroundColor: 'white', padding: 15, borderRadius: 15, marginTop: 8 },
  editText: { color: '#548F53', fontFamily: 'Nunito_600SemiBold' },

  footer: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#548F53',
    height: 54,
    width: 210,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
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

  inputLabel: {
    fontSize: 18,
    color: '#2F4F4F',
    fontFamily: 'Nunito_700Bold',
    marginBottom: 8,
    marginTop: 10,
  },

  imageUploadBox: {
    width: '100%',
    height: 180,
    backgroundColor: '#C8E2C8', 
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },

  input: {
    backgroundColor: '#F1F5F0',
    borderRadius: 15,
    padding: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#DDE5D7',
    fontFamily: 'Nunito_400Regular',
    marginBottom: 15,
  },

  reviewCardContainer: { marginBottom: 20 },
  reviewLabel: { fontSize: 18, color: '#2F4F4F', fontFamily: 'Nunito_700Bold' },
  reviewContentBox: {
    backgroundColor: '#F1F5F0',
    borderRadius: 20,
    padding: 12,
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#DDE5D7'
  },
  reviewRow: { flexDirection: 'row', alignItems: 'center' },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#C8E2C8',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  reviewValueText: { fontSize: 16, color: '#2F4F4F', fontFamily: 'Nunito_600SemiBold' },

  reviewContentImg: { width: 120, height: 120 },
  reviewImgOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.2)', padding: 8, justifyContent: 'flex-end', borderRadius: 12 },
  imgTitleSmall: { color: 'white', fontSize: 12, fontFamily: 'Nunito_700Bold' },
  imgSubSmall: { color: 'white', fontSize: 10, fontFamily: 'Nunito_400Regular' },

  infoSmallImg: { width: 80, height: 100, borderRadius: 12 },
  infoTitleText: { fontSize: 15, color: '#2F4F4F', fontFamily: 'Nunito_700Bold' },
  infoDescText: { fontSize: 13, color: '#6A7D5B', fontFamily: 'Nunito_400Regular', marginTop: 4 },

  saveButton: { backgroundColor: '#548F53', height: 56, width: 220, borderRadius: 30, justifyContent: 'center', alignItems: 'center' },
});

// import React, { useState, ComponentProps } from 'react';
// import {
//   View,
//   TouchableOpacity,
//   ScrollView,
//   TextInput,
//   ImageBackground,
//   Image,
// } from 'react-native';
// import { Ionicons, MaterialIcons } from '@expo/vector-icons';
// import { router } from 'expo-router';
// import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
// import {
//   useFonts,
//   Nunito_700Bold,
//   Nunito_600SemiBold,
//   Nunito_400Regular,
// } from '@expo-google-fonts/nunito';
// import { ThemedText } from '@/components/themed-text';
// import * as ImagePicker from 'expo-image-picker';

// type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];
// type IonIconName = ComponentProps<typeof Ionicons>['name'];

// // Atalhos para as fontes para manter o código limpo
// const fBold = { fontFamily: 'Nunito_700Bold' };
// const fSemi = { fontFamily: 'Nunito_600SemiBold' };
// const fReg = { fontFamily: 'Nunito_400Regular' };

// // --- Sub-componentes ---

// const FlowHeader = ({ title, step, totalSteps, onBack }: any) => (
//   <View className="mb-4">
//     <View className="flex-row justify-between items-center h-[60px] mt-2">
//       <TouchableOpacity onPress={onBack}>
//         <Ionicons name="chevron-back" size={28} color="#2F4F4F" />
//       </TouchableOpacity>
//       <ThemedText style={fBold} className="text-xl text-[#2F4F4F]">{title}</ThemedText>
//       <TouchableOpacity onPress={() => router.back()}>
//         <ThemedText style={fSemi} className="text-[#548F53] text-base">Cancel</ThemedText>
//       </TouchableOpacity>
//     </View>
//     <View className="flex-row gap-1.5 my-[15px]">
//       {[...Array(totalSteps)].map((_, i) => (
//         <View
//           key={i}
//           className={`flex-1 h-1.5 rounded-full ${i + 1 <= step ? 'bg-[#519A4E]' : 'bg-[#DDE5D7]'}`}
//         />
//       ))}
//     </View>
//   </View>
// );

// const ContentCard = ({ item, isSelected, onSelect, type = 'small' }: any) => (
//   <TouchableOpacity
//     onPress={() => onSelect(item.title)}
//     activeOpacity={0.9}
//     className={`${type === 'large' ? 'w-full h-[148px] mb-3' : 'w-[48%] h-[148px]'} rounded-[24px] overflow-hidden border-[3px] ${isSelected ? 'border-[#548F53]' : 'border-transparent'}`}
//   >
//     <ImageBackground source={{ uri: item.image }} className="flex-1" imageStyle={{ borderRadius: 20 }}>
//       <TouchableOpacity className="absolute top-2.5 right-1 z-10">
//         <MaterialIcons name="more-vert" size={24} color="white" />
//       </TouchableOpacity>
//       <View className="p-3 bg-black/15 flex-1 justify-end">
//         {item.recommended && (
//           <ThemedText style={fReg} className="text-white text-[11px] mb-0.5">Recommended</ThemedText>
//         )}
//         <ThemedText 
//           style={fBold} 
//           className={`text-white ${type === 'large' ? 'text-[20px]' : 'text-[15px]'}`} 
//           numberOfLines={1}
//         >
//           {item.title}
//         </ThemedText>
//         <View className="flex-row items-center gap-1 mt-0.5">
//           <Ionicons name={(item.type === 'Video' ? "play-circle" : "headset") as IonIconName} size={14} color="white" />
//           <ThemedText style={fReg} className="text-white text-[11px]">{item.type} • {item.duration}</ThemedText>
//         </View>
//       </View>
//     </ImageBackground>
//   </TouchableOpacity>
// );

// const StepWrapper = ({ title, subtitle, children }: any) => (
//   <View className="mt-2.5">
//     <ThemedText style={fBold} className="text-[26px] text-[#2F4F4F] mb-2 leading-tight">{title}</ThemedText>
//     {subtitle && <ThemedText style={fSemi} className="text-[15px] text-[#6A7D5B] mb-[25px]">{subtitle}</ThemedText>}
//     {children}
//   </View>
// );

// const FinalReviewCard = ({ label, children, onEdit }: any) => (
//   <View className="mb-5">
//     <View className="flex-row justify-between items-center mb-2">
//       <ThemedText style={fBold} className="text-[18px] text-[#2F4F4F]">{label}</ThemedText>
//       <TouchableOpacity onPress={onEdit}>
//         <ThemedText style={fSemi} className="text-[#548F53]">Edit</ThemedText>
//       </TouchableOpacity>
//     </View>
//     <View className="bg-[#F1F5F0] rounded-[20px] p-3 border border-[#DDE5D7]">
//       {children}
//     </View>
//   </View>
// );

// export default function NewActivityFlow() {
//   const [fontsLoaded] = useFonts({ Nunito_700Bold, Nunito_600SemiBold, Nunito_400Regular });
//   const [step, setStep] = useState(1);
//   const [activityType, setActivityType] = useState('');
//   const [selectedContent, setSelectedContent] = useState('');
//   const [room, setRoom] = useState('');
//   const [environment, setEnvironment] = useState('Moonlight Bay');
//   const [activityName, setActivityName] = useState('');
//   const [description, setDescription] = useState('');
//   const [activityImage, setActivityImage] = useState<string | null>(null);

//   const totalSteps = 6;
//   if (!fontsLoaded) return null;

//   const nextStep = () => step < totalSteps && setStep(step + 1);
//   const prevStep = () => step > 1 ? setStep(step - 1) : router.back();

//   const isNextDisabled = () => {
//     if (step === 1 && !activityType) return true;
//     if (step === 2 && !selectedContent) return true;
//     if (step === 3 && !room) return true;
//     return false;
//   };

//   const pickImage = async () => {
//     const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
//     if (!permission.granted) return alert('Gallery permission required');
//     const result = await ImagePicker.launchImageLibraryAsync({
//       mediaTypes: ImagePicker.MediaTypeOptions.Images,
//       allowsEditing: true,
//       aspect: [4, 3],
//       quality: 0.8,
//     });
//     if (!result.canceled) setActivityImage(result.assets[0].uri);
//   };

//   return (
//     <SafeAreaProvider>
//       <SafeAreaView className="flex-1 bg-[#F9FAF7] px-5">
//         <FlowHeader title="New activity" step={step} totalSteps={totalSteps} onBack={prevStep} />

//         <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 140 }}>
          
//           {/* PASSO 1 */}
//           {step === 1 && (
//             <StepWrapper title="What do you want to do?" subtitle="Select the activity type you want to do.">
//               <View className="flex-row flex-wrap justify-between">
//                 {['Cooking', 'Audiobook', 'Meditation', 'Workout'].map((id) => (
//                   <TouchableOpacity
//                     key={id}
//                     onPress={() => setActivityType(id)}
//                     className={`w-[48%] h-[150px] mb-3 bg-[#BBDABA] rounded-[24px] justify-center items-center border-[3px] ${activityType === id ? 'border-[#548F53]' : 'border-transparent'}`}
//                   >
//                     <MaterialIcons
//                       name={(id === 'Cooking' ? 'restaurant' : id === 'Audiobook' ? 'menu-book' : id === 'Meditation' ? 'self-improvement' : 'fitness-center') as MaterialIconName}
//                       size={50} color="#354F52"
//                     />
//                     <ThemedText style={fSemi} className="mt-2.5 text-base text-[#2F4F4F]">{id}</ThemedText>
//                   </TouchableOpacity>
//                 ))}
//               </View>
//             </StepWrapper>
//           )}

//           {/* PASSO 2 */}
//           {step === 2 && (
//             <StepWrapper title="How do you want to practice?" subtitle="Select the type of content you want access.">
//               <ContentCard
//                 type="large"
//                 isSelected={selectedContent === 'Stress Buster'}
//                 onSelect={setSelectedContent}
//                 item={{ title: 'Stress Buster', duration: '8min', type: 'Video', recommended: true, image: 'https://picsum.photos/400/300' }}
//               />
//               <ThemedText style={fBold} className="text-[18px] text-[#2F4F4F] my-3">Video sessions</ThemedText>
//               <View className="flex-row justify-between mb-4">
//                 <ContentCard item={{ title: 'Rise and Shine', duration: '10min', type: 'Video', image: 'https://picsum.photos/200/200' }} isSelected={selectedContent === 'Rise and Shine'} onSelect={setSelectedContent} />
//                 <ContentCard item={{ title: 'Panic Reset', duration: '15min', type: 'Video', image: 'https://picsum.photos/201/200' }} isSelected={selectedContent === 'Panic Reset'} onSelect={setSelectedContent} />
//               </View>
//               <ThemedText style={fBold} className="text-[18px] text-[#2F4F4F] mb-3">Audio sessions</ThemedText>
//               <View className="flex-row justify-between">
//                 <ContentCard item={{ title: 'Brain Boost', duration: '5min', type: 'Audio', image: 'https://picsum.photos/202/200' }} isSelected={selectedContent === 'Brain Boost'} onSelect={setSelectedContent} />
//                 <ContentCard item={{ title: 'Self Love', duration: '12min', type: 'Audio', image: 'https://picsum.photos/203/200' }} isSelected={selectedContent === 'Self Love'} onSelect={setSelectedContent} />
//               </View>
//             </StepWrapper>
//           )}

//           {/* PASSO 3 */}
//           {step === 3 && (
//             <StepWrapper title="Where will it happen?" subtitle="Select the room.">
//               <View className="flex-row flex-wrap justify-between">
//                 {[
//                   { id: 'Bedroom', icon: 'bed' }, { id: 'Kitchen', icon: 'restaurant' },
//                   { id: 'Living Room', icon: 'weekend' }, { id: 'Bathroom', icon: 'bathtub' },
//                   { id: 'Office', icon: 'computer' }, { id: 'Garden', icon: 'local-florist' },
//                 ].map((r) => (
//                   <TouchableOpacity
//                     key={r.id}
//                     onPress={() => setRoom(r.id)}
//                     className={`w-[48%] h-[150px] mb-3 bg-[#BBDABA] rounded-[24px] justify-center items-center border-[3px] ${room === r.id ? 'border-[#548F53]' : 'border-transparent'}`}
//                   >
//                     <MaterialIcons name={r.icon as MaterialIconName} size={50} color="#354F52" />
//                     <ThemedText style={fSemi} className="mt-2.5 text-base text-[#2F4F4F]">{r.id}</ThemedText>
//                   </TouchableOpacity>
//                 ))}
//               </View>
//             </StepWrapper>
//           )}

//           {/* PASSO 4 */}
//           {step === 4 && (
//             <StepWrapper title="What environment?" subtitle="Select a scenario.">
//               <View className="flex-row flex-wrap justify-between">
//                 {[
//                   { id: 'Moonlight Bay', img: 'https://picsum.photos/id/10/400/400' },
//                   { id: 'Rose Garden', img: 'https://picsum.photos/id/306/400/400' },
//                 ].map((env) => (
//                   <TouchableOpacity
//                     key={env.id}
//                     onPress={() => setEnvironment(env.id)}
//                     className={`w-[48%] h-[148px] rounded-[24px] overflow-hidden mb-3 border-[3px] ${environment === env.id ? 'border-[#548F53]' : 'border-transparent'}`}
//                   >
//                     <ImageBackground source={{ uri: env.img }} className="flex-1 justify-end p-3 bg-black/20">
//                       <ThemedText style={fBold} className="text-white text-sm">{env.id}</ThemedText>
//                     </ImageBackground>
//                   </TouchableOpacity>
//                 ))}
//               </View>
//             </StepWrapper>
//           )}

//           {/* PASSO 5 */}
//           {step === 5 && (
//             <StepWrapper title="Last details" subtitle="Activity info.">
//               <ThemedText style={fBold} className="text-lg text-[#2F4F4F] mb-2 mt-2">Image</ThemedText>
//               <TouchableOpacity onPress={pickImage} className="w-full h-[180px] bg-[#C8E2C8] rounded-[20px] justify-center items-center mb-5 overflow-hidden">
//                 {activityImage ? <Image source={{ uri: activityImage }} className="w-full h-full" resizeMode="cover" /> : <MaterialIcons name="add-photo-alternate" size={60} color="#354F52" />}
//               </TouchableOpacity>
              
//               <ThemedText style={fBold} className="text-lg text-[#2F4F4F] mb-2">Activity Name</ThemedText>
//               <TextInput style={fReg} className="bg-[#F1F5F0] rounded-[15px] p-[15px] text-base border border-[#DDE5D7] mb-[15px]" value={activityName} onChangeText={setActivityName} />
              
//               <ThemedText style={fBold} className="text-lg text-[#2F4F4F] mb-2">Description</ThemedText>
//               <TextInput style={fReg} className="bg-[#F1F5F0] rounded-[15px] p-[15px] text-base border border-[#DDE5D7] h-[120px]" multiline textAlignVertical="top" value={description} onChangeText={setDescription} />
//             </StepWrapper>
//           )}

//           {/* PASSO 6 */}
//           {step === 6 && (
//             <StepWrapper title="Review and save" subtitle="Check your details.">
//               <FinalReviewCard label="Activity Type" onEdit={() => setStep(1)}>
//                 <View className="flex-row items-center">
//                   <View className="w-11 h-11 rounded-xl bg-[#C8E2C8] justify-center items-center mr-3">
//                     <MaterialIcons name="self-improvement" size={24} color="#354F52" />
//                   </View>
//                   <ThemedText style={fSemi} className="text-base text-[#2F4F4F]">{activityType || 'Meditation'}</ThemedText>
//                 </View>
//               </FinalReviewCard>

//               <FinalReviewCard label="Room" onEdit={() => setStep(3)}>
//                 <View className="flex-row items-center">
//                   <View className="w-11 h-11 rounded-xl bg-[#C8E2C8] justify-center items-center mr-3">
//                     <MaterialIcons name="bed" size={24} color="#354F52" />
//                   </View>
//                   <ThemedText style={fSemi} className="text-base text-[#2F4F4F]">{room || 'Bedroom'}</ThemedText>
//                 </View>
//               </FinalReviewCard>

//               <FinalReviewCard label="Activity Info" onEdit={() => setStep(5)}>
//                 <View className="flex-row">
//                   <View className="w-20 h-24 bg-[#C8E2C8] rounded-xl overflow-hidden">
//                     {activityImage && <Image source={{ uri: activityImage }} className="w-full h-full" />}
//                   </View>
//                   <View className="flex-1 ml-3">
//                     <ThemedText style={fBold} className="text-[15px] text-[#2F4F4F]">{activityName || 'Unnamed Activity'}</ThemedText>
//                     <ThemedText style={fReg} className="text-sm text-[#6A7D5B] mt-1" numberOfLines={3}>{description || 'No description provided.'}</ThemedText>
//                   </View>
//                 </View>
//               </FinalReviewCard>
//             </StepWrapper>
//           )}
//         </ScrollView>

//         {/* BOTÃO FIXO */}
//         <View className="absolute bottom-10 left-0 right-0 items-center">
//           <TouchableOpacity
//             onPress={nextStep}
//             disabled={isNextDisabled()}
//             className={`bg-[#548F53] h-[54px] w-[210px] rounded-full justify-center items-center ${isNextDisabled() ? 'opacity-50' : 'opacity-100'}`}
//           >
//             <ThemedText style={fBold} className="text-white text-lg">
//               {step === 6 ? 'Save' : 'Continue'}
//             </ThemedText>
//           </TouchableOpacity>
//         </View>
//       </SafeAreaView>
//     </SafeAreaProvider>
//   );
// }