import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ImageBackground,
  TouchableOpacity,
  FlatList,
  Dimensions,
  StyleSheet,
  Image,
  Animated
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
<<<<<<< HEAD
const SLIDE_DURATION = 5000;
=======
const SLIDE_DURATION = 5000; 
>>>>>>> feature/homepage

const SLIDES = [
  { id: '1', title: 'Your home, your safe space', description: "Stress and anxiety shouldn't follow you home. Nidush is here to help you disconnect, reconnect with yourself and turn your home into a space that adapts to you.", image: require('../assets/gif/Inico.png') },
  { id: '2', title: 'Your home, tuned to you', description: "Create and get recommendations of Scenarios that combine your smart devices, and transform each room into a space that adapts to how you’re feeling.", image: require('../assets/gif/video.png') },
  { id: '3', title: 'Your favorite hobbies in one place', description: "Craft and discover activities tailored to you, within a personalized atmosphere where every distraction disappears.", image: require('../assets/gif/video3.png') },
  { id: '4', title: 'Technology that feels you', description: "Through wearable integration, Nidush senses your inner rhythm, gently intervening at the exact moment stress or anxiety appears to restore your calm..", image: require('../assets/gif/video4.png') },
  { id: '5', title: 'Different residents, Different profiles', description: "Create a personal profile, that respects your privacy and shared spaces.", image: require('../assets/gif/video5.png') },
  { id: '6', title: 'Shall we begin your journey to peace?', description: "Join us to silence the noise and start the creation of your safe space.", image: require('../assets/gif/video11.png'), isLast: true },
];

const AnimatedIndicator = ({ index, currentIndex, duration, isPlaying }: any) => {
  const widthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (index === currentIndex && isPlaying) {
      widthAnim.setValue(0);
      Animated.timing(widthAnim, {
        toValue: 100,
        duration: duration,
        useNativeDriver: false,
      }).start();
    } else if (index < currentIndex) {
      widthAnim.setValue(100);
    } else {
      widthAnim.setValue(0);
    }
  }, [currentIndex, isPlaying]);

  const interpolation = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.indicatorBase}>
      <Animated.View style={[styles.indicatorFill, { width: interpolation }]} />
    </View>
  );
};

export default function Onboarding() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<FlatList>(null);
  const router = useRouter();

  const finishOnboarding = async () => {
    try {
      await AsyncStorage.setItem('@viewedOnboarding', 'true');
      router.replace('/signup');
    } catch (e) {
      router.replace('/signup');
    }
  };

  useEffect(() => {
    if (!showWelcome) {
      const timer = setInterval(() => {
        if (currentIndex < SLIDES.length - 1) {
          goToNext();
        } else {
          finishOnboarding();
        }
      }, SLIDE_DURATION);
      return () => clearInterval(timer);
    }
  }, [currentIndex, showWelcome]);

  const goToNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      const nextIndex = currentIndex + 1;
      scrollRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentIndex(nextIndex);
    }
  };

  const goToPrev = () => {
    if (currentIndex > 0) {
      const prevIndex = currentIndex - 1;
      scrollRef.current?.scrollToIndex({ index: prevIndex, animated: true });
      setCurrentIndex(prevIndex);
    }
  };

  if (showWelcome) {
    return (
      <View style={styles.welcomeContainer}>
        <StatusBar style="dark" />
        <SafeAreaView style={styles.welcomeContent}>
          <View style={styles.welcomeCenter}>
            <Image source={require('../assets/images/Logo.png')} style={styles.welcomeLogo} resizeMode="contain" />
            <Text style={styles.welcomeTitle}>Welcome to Nidush</Text>
            <Text style={styles.welcomeSubtitle}>Your safe space starts here.</Text>
          </View>
          <TouchableOpacity style={styles.discoverButton} onPress={() => setShowWelcome(false)}>
            <Text style={styles.discoverButtonText}>Discover</Text>
          </TouchableOpacity>
        </SafeAreaView>
      </View>
    );
  }

  const renderItem = ({ item }: any) => (
    <ImageBackground source={item.image} style={styles.imageBackground} resizeMode="cover">
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.leftTapArea} onPress={goToPrev} activeOpacity={1} />
        <TouchableOpacity style={styles.rightTapArea} onPress={goToNext} activeOpacity={1} />

        <SafeAreaView style={styles.container} pointerEvents="box-none">
          <View style={styles.header} pointerEvents="box-none">

            <Image
              source={require('../assets/images/Logo.png')}
              style={styles.topLogo}
              resizeMode="contain"
            />
            {!item.isLast && (
              <TouchableOpacity onPress={finishOnboarding} style={styles.skipButton}>
                <Text style={styles.skipText}>Skip</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.contentBox} pointerEvents="none">
            <Text style={styles.titleText}>{item.title}</Text>
            <Text style={styles.descriptionText}>{item.description}</Text>
          </View>

          <View style={styles.footer} pointerEvents="box-none">
            {item.isLast && (
              <TouchableOpacity onPress={finishOnboarding} style={styles.beginButton}>
                <Text style={styles.beginButtonText}>Begin Journey</Text>
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </View>
    </ImageBackground>
  );

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" />
      <FlatList
        ref={scrollRef}
        data={SLIDES}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
        getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
      />

      <View style={styles.indicatorContainer}>
        {SLIDES.map((_, index) => (
          <AnimatedIndicator
            key={index}
            index={index}
            currentIndex={currentIndex}
            duration={SLIDE_DURATION}
            isPlaying={!showWelcome}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Telas iniciais e Textos
  welcomeContainer: { flex: 1, backgroundColor: '#e6e9d5' },
  welcomeContent: { flex: 1, alignItems: 'center', justifyContent: 'space-between', paddingVertical: 50 },
  welcomeCenter: { alignItems: 'center', marginTop: height * 0.15 },
  welcomeLogo: { width: 250, height: 250, marginBottom: 30 },
  welcomeTitle: { fontSize: 32, fontWeight: 'bold', color: '#fff', textAlign: 'center', fontFamily: 'Nunito' },
  welcomeSubtitle: { fontSize: 18, color: '#fff', marginTop: 10, opacity: 0.9, fontFamily: 'Nunito' },
  discoverButton: { backgroundColor: '#589158', paddingHorizontal: 60, paddingVertical: 15, borderRadius: 30, marginBottom: 20 },
  discoverButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', fontFamily: 'Nunito' },

  // Onboarding Slides
  mainContainer: { flex: 1, backgroundColor: '#000' },
  imageBackground: { width: width, flex: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)' },
  leftTapArea: { position: 'absolute', left: 0, top: 0, bottom: 0, width: width * 0.25, zIndex: 1 },
  rightTapArea: { position: 'absolute', right: 0, top: 0, bottom: 0, width: width * 0.75, zIndex: 1 },
  container: { flex: 1, justifyContent: 'space-between', paddingHorizontal: 25, zIndex: 5 },

  // Header com Logo Maior
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 20, zIndex: 10, height: 50 },
  topLogo: { width: 40, height: 42, tintColor: '#FFFFFF' },
  skipButton: { padding: 10, zIndex: 20 },
  skipText: { color: '#fff', fontSize: 16, fontWeight: '600', textDecorationLine: 'underline', fontFamily: 'Nunito' },

  // Conteúdo posicionado mais abaixo
  contentBox: { marginTop: 'auto', marginBottom: '-20%' },

  titleText: { color: '#fff', fontSize: 36, fontWeight: '800', lineHeight: 42, marginBottom: 15, fontFamily: 'Nunito' },
  descriptionText: { color: '#fff', fontSize: 17, lineHeight: 24, opacity: 0.9, fontFamily: 'Nunito' },

  // Botão Final
  footer: { height: 140, justifyContent: 'center', zIndex: 20 },
  beginButton: { backgroundColor: '#589158', paddingVertical: 18, borderRadius: 40, alignItems: 'center', zIndex: 30 },
  beginButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 18, fontFamily: 'Nunito' },

  // Indicadores estilo Stories 
  indicatorContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: '10%',
    width: '100%',
    paddingHorizontal: 20,
    zIndex: 100
  },
  indicatorBase: {
    height: 4,
    flex: 1,
    marginHorizontal: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow: 'hidden'
  },
  indicatorFill: {
    height: '100%',
    backgroundColor: '#589158'
  },
});