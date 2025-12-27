import React, { useState, ComponentProps } from 'react';
import {
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  ImageBackground,
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

const { width } = Dimensions.get('window');

type MaterialIconName = ComponentProps<typeof MaterialIcons>['name'];
type IonIconName = ComponentProps<typeof Ionicons>['name'];

const FlowHeader = ({ title, step, totalSteps, onBack }: any) => (
  <View>
    <View className="flex-row justify-between items-center h-[60px] mt-2.5">
      <TouchableOpacity onPress={onBack}>
        <Ionicons name="chevron-back" size={28} color="#2F4F4F" />
      </TouchableOpacity>
      <ThemedText className="text-[20px] text-[#2F4F4F] font-[Nunito_700Bold]">
        {title}
      </ThemedText>
      <TouchableOpacity onPress={() => router.back()}>
        <ThemedText className="text-[#548F53] text-[16px] font-[Nunito_600SemiBold]">
          Cancel
        </ThemedText>
      </TouchableOpacity>
    </View>
    <View className="flex-row gap-1.5 my-[15px]">
      {[...Array(totalSteps)].map((_, i) => (
        <View
          key={i}
          className={`flex-1 h-1.5 rounded-full ${
            i + 1 <= step ? 'bg-[#519A4E]' : 'bg-[#DDE5D7]'
          }`}
        />
      ))}
    </View>
  </View>
);

const ContentCard = ({ item, isSelected, onSelect, type = 'small' }: any) => (
  <TouchableOpacity
    onPress={() => onSelect(item.title)}
    activeOpacity={0.9}
    className={`${
      type === 'large' ? 'w-full' : 'w-[48%]'
    } h-[148px] rounded-[24px] overflow-hidden mb-3 border-[3px] ${
      isSelected ? 'border-[#548F53]' : 'border-transparent'
    }`}
  >
    <ImageBackground
      source={{ uri: item.image }}
      className="flex-1"
      imageStyle={{ borderRadius: 20 }}
    >
      <TouchableOpacity className="absolute top-2.5 right-1 z-10">
        <MaterialIcons name="more-vert" size={24} color="white" />
      </TouchableOpacity>

      <View className="p-3 bg-black/15 flex-1 justify-end">
        {item.recommended && (
          <ThemedText className="text-white text-[11px] font-[Nunito_400Regular] mb-0.5">
            Recommended
          </ThemedText>
        )}
        <View>
          <ThemedText
            className={`text-white font-[Nunito_700Bold] ${
              type === 'large' ? 'text-[20px]' : 'text-[15px]'
            }`}
            numberOfLines={1}
          >
            {item.title}
          </ThemedText>
          <View className="flex-row items-center gap-1.5 mt-0.5">
            <Ionicons
              name={
                (item.type === 'Video' ? 'play-circle' : 'headset') as IonIconName
              }
              size={14}
              color="white"
            />
            <ThemedText className="text-white text-[11px] font-[Nunito_400Regular]">
              {item.type} • {item.duration}
            </ThemedText>
          </View>
        </View>
      </View>
    </ImageBackground>
  </TouchableOpacity>
);

const StepWrapper = ({ title, subtitle, children }: any) => (
  <View className="mt-2.5">
    <ThemedText className="text-[26px] text-[#2F4F4F] mb-2 font-[Nunito_700Bold]">
      {title}
    </ThemedText>
    {subtitle && (
      <ThemedText className="text-[15px] text-[#6A7D5B] mb-[25px] font-[Nunito_600SemiBold]">
        {subtitle}
      </ThemedText>
    )}
    {children}
  </View>
);

const ReviewItem = ({ label, value }: any) => (
  <View className="mb-[15px]">
    <div className="flex-row justify-between items-center">
      <ThemedText className="text-[16px] text-[#2F4F4F] font-[Nunito_700Bold]">
        {label}
      </ThemedText>
      <TouchableOpacity>
        <ThemedText className="text-[#548F53] font-[Nunito_600SemiBold]">
          Edit
        </ThemedText>
      </TouchableOpacity>
    </div>
    <View className="bg-white p-[15px] rounded-[15px] mt-2">
      <ThemedText className="text-[15px] text-[#4A6741] font-[Nunito_600SemiBold]">
        {value || 'Not selected'}
      </ThemedText>
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

  const nextStep = () => step < totalSteps && setStep(step + 1);
  const prevStep = () => step > 1 ? setStep(step - 1) : router.back();

  const isNextDisabled = () => {
    if (step === 1 && !activityType) return true;
    if (step === 2 && !selectedContent) return true;
    if (step === 3 && !room) return true;
    return false;
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView className="flex-1 bg-[#F9FAF7] px-5">
        <FlowHeader
          title="New activity"
          step={step}
          totalSteps={totalSteps}
          onBack={prevStep}
        />

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 140 }}
        >
          {step === 1 && (
            <StepWrapper
              title="What do you want to do?"
              subtitle="Select the activity type you want to do."
            >
              <View className="flex-row flex-wrap gap-3 justify-between">
                {['Cooking', 'Audiobook', 'Meditation', 'Workout'].map((id) => (
                  <TouchableOpacity
                    key={id}
                    className={`w-[48%] h-[150px] bg-[#BBDABA] rounded-[24px] justify-center items-center border-[3px] ${
                      activityType === id ? 'border-[#548F53]' : 'border-transparent'
                    }`}
                    onPress={() => setActivityType(id)}
                  >
                    <MaterialIcons
                      name={
                        (id === 'Cooking'
                          ? 'restaurant'
                          : id === 'Audiobook'
                          ? 'menu-book'
                          : id === 'Meditation'
                          ? 'self-improvement'
                          : 'fitness-center') as MaterialIconName
                      }
                      size={50}
                      color="#354F52"
                    />
                    <ThemedText className="mt-2.5 text-[16px] text-[#2F4F4F] font-[Nunito_600SemiBold]">
                      {id}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </StepWrapper>
          )}

          {step === 2 && (
            <StepWrapper
              title="How do you want to practice?"
              subtitle="Select the type of content you want to have access."
            >
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
              <ThemedText className="text-[18px] text-[#2F4F4F] font-[Nunito_700Bold] my-3">
                Video sessions
              </ThemedText>
              <View className="flex-row justify-between mb-[15px]">
                <ContentCard
                  item={{
                    title: 'Rise and Shine',
                    duration: '10min',
                    type: 'Video',
                    image: 'https://picsum.photos/200/200',
                  }}
                  isSelected={selectedContent === 'Rise and Shine'}
                  onSelect={setSelectedContent}
                />
                <ContentCard
                  item={{
                    title: 'Panic Reset',
                    duration: '15min',
                    type: 'Video',
                    image: 'https://picsum.photos/201/200',
                  }}
                  isSelected={selectedContent === 'Panic Reset'}
                  onSelect={setSelectedContent}
                />
              </View>
              {/* Repetir lógica para Audio sessions com className row/grid */}
            </StepWrapper>
          )}

          {step === 3 && (
            <StepWrapper title="Where will it happen?" subtitle="Select the room.">
              <View className="flex-row flex-wrap gap-3 justify-between">
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
                    className={`w-[48%] h-[150px] bg-[#BBDABA] rounded-[24px] justify-center items-center border-[3px] ${
                      room === r.id ? 'border-[#548F53]' : 'border-transparent'
                    }`}
                    onPress={() => setRoom(r.id)}
                  >
                    <MaterialIcons name={r.icon} size={50} color="#354F52" />
                    <ThemedText className="mt-2.5 text-[16px] text-[#2F4F4F] font-[Nunito_600SemiBold]">
                      {r.id}
                    </ThemedText>
                  </TouchableOpacity>
                ))}
              </View>
            </StepWrapper>
          )}

          {step === 4 && (
            <StepWrapper title="Environment" subtitle="Select a scenario.">
              <View className="flex-row flex-wrap gap-3 justify-between">
                {['Moonlight Bay', 'Rose Garden', 'Deep Focus'].map((env) => (
                  <TouchableOpacity
                    key={env}
                    className={`w-[48%] h-[148px] rounded-[24px] overflow-hidden border-[3px] ${
                      environment === env ? 'border-[#548F53]' : 'border-transparent'
                    }`}
                    onPress={() => setEnvironment(env)}
                  >
                    <ImageBackground
                      source={{ uri: 'https://picsum.photos/150' }}
                      className="flex-1"
                      imageStyle={{ borderRadius: 15 }}
                    >
                      <View className="flex-1 p-3 justify-end bg-black/20">
                        <ThemedText className="text-white font-[Nunito_700Bold] text-[14px]">
                          {env}
                        </ThemedText>
                      </View>
                    </ImageBackground>
                  </TouchableOpacity>
                ))}
              </View>
            </StepWrapper>
          )}

          {step === 5 && (
            <StepWrapper title="Last details" subtitle="Activity info.">
              <TextInput
                placeholder="Activity Name"
                className="bg-white rounded-[15px] p-[18px] text-[16px] mb-[15px] font-[Nunito_400Regular]"
                value={activityName}
                onChangeText={setActivityName}
              />
              <TextInput
                placeholder="Description"
                className="bg-white rounded-[15px] p-[18px] text-[16px] mb-[15px] font-[Nunito_400Regular] h-[120px]"
                multiline
                value={description}
                onChangeText={setDescription}
              />
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

        <View className="absolute bottom-10 left-0 right-0 items-center">
          <TouchableOpacity
            className={`bg-[#548F53] h-[54px] w-[210px] rounded-full justify-center items-center ${
              isNextDisabled() ? 'opacity-50' : 'opacity-100'
            }`}
            onPress={nextStep}
            disabled={isNextDisabled()}
          >
            <ThemedText className="text-white text-[18px] font-[Nunito_700Bold]">
              {step === 6 ? 'Save' : 'Continue'}
            </ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}