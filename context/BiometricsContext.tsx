import { ACTIVITIES, SCENARIOS } from '@/constants/data';
import {
  Activity,
  Scenario,
  UserState,
  WearableData,
} from '@/constants/data/types';
import { generateBiometricsFromStress } from '@/utils/biometricSimulator';
import { getDynamicRecommendations } from '@/utils/recommendationEngine';
import * as Notifications from 'expo-notifications';
import { useSegments } from 'expo-router';
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

const isScenario = (item: Activity | Scenario): item is Scenario => {
  return !('type' in item);
};

const ACTIVITY_TEMPLATES = {
  ANXIOUS: [
    (name: string) =>
      `Things seem overwhelming. How about we relax together with '${name}'?`,
    (name: string) =>
      `I noticed your heart is racing. Let the practice of '${name}' ground you.`,
    (name: string) =>
      `Take a break from the world. Try '${name}' for a few minutes.`,
  ],
  STRESSED: [
    (name: string) =>
      `You've been pushing hard. A quick session of '${name}' might help.`,
    (name: string) =>
      `Feeling tense? '${name}' could be exactly what you need right now.`,
    (name: string) =>
      `Time to recharge. Let's do some '${name}' to regain focus.`,
  ],
};

const SCENARIO_TEMPLATES = {
  ANXIOUS: [
    (name: string) =>
      `It's too loud inside your head. Let me transform your room into '${name}'.`,
    (name: string) =>
      `Need a safe space? I can activate the '${name}' atmosphere for you right now.`,
    (name: string) =>
      `Let's dim the lights. Switching to '${name}' might bring you peace.`,
  ],
  STRESSED: [
    (name: string) =>
      `Change your environment, change your mood. Shall we switch to '${name}'?`,
    (name: string) =>
      `The '${name}' setting is perfect for lowering stress. Want to try it?`,
    (name: string) =>
      `Create a sanctuary of calm. Activating '${name}' implies instant relief.`,
  ],
};

interface BiometricsContextType {
  data: WearableData | null;
  currentState: UserState;
}

const BiometricsContext = createContext<BiometricsContextType | undefined>(
  undefined,
);

export const BiometricsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [data, setData] = useState<WearableData | null>(null);
  const [currentState, setCurrentState] = useState<UserState>('RELAXED');

  const stressLevelRef = useRef(10);
  const trendRef = useRef<'UP' | 'DOWN'>('UP');
  const previousStateRef = useRef<UserState>('RELAXED');
  const segments = useSegments();

  useEffect(() => {
    async function requestPermissions() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') console.log('Notification permission denied');
    }
    requestPermissions();
  }, []);

  const sendHealthAlert = async (state: UserState) => {
    const availableItems = [...ACTIVITIES, ...SCENARIOS].filter(
      (i) => i.category !== 'My creations',
    );
    const allRecommendations = getDynamicRecommendations(availableItems, state);

    const topCandidates = allRecommendations.slice(0, 3);

    let topPick: Activity | Scenario | null = null;
    if (topCandidates.length > 0) {
      const randomIndex = Math.floor(Math.random() * topCandidates.length);
      topPick = topCandidates[randomIndex];
    }

    if (!topPick) return;

    const itemName = topPick.title;
    const itemIsScenario = isScenario(topPick);

    const stateKey = state === 'ANXIOUS' ? 'ANXIOUS' : 'STRESSED';

    const templateList = itemIsScenario
      ? SCENARIO_TEMPLATES[stateKey]
      : ACTIVITY_TEMPLATES[stateKey];

    const randomTemplateIndex = Math.floor(Math.random() * templateList.length);
    const messageBody = templateList[randomTemplateIndex](itemName);

    const title = state === 'ANXIOUS' ? 'Anxiety Relief' : 'Stress Detected';

    await Notifications.scheduleNotificationAsync({
      content: {
        title: title,
        body: messageBody,
        data: {
          itemId: topPick.id,
          isScenario: itemIsScenario,
          type: state,
        },
      },
      trigger: null,
    });
  };

  useEffect(() => {
    const isOnboarding = segments.some(
      (segment) => segment === 'onboarding' || segment === 'profile-selection',
    );

    // Se estivermos nessas páginas, NÃO INICIA o simulador
    if (isOnboarding) {
      // Opcional: Podes fazer reset aos dados se quiseres
      // setData(null);
      return;
    }
    const interval = setInterval(() => {
      if (trendRef.current === 'UP') {
        stressLevelRef.current += Math.floor(Math.random() * 20);
        if (stressLevelRef.current >= 100) trendRef.current = 'DOWN';
      } else {
        stressLevelRef.current -= Math.floor(Math.random() * 10);
        if (stressLevelRef.current <= 10) trendRef.current = 'UP';
      }

      stressLevelRef.current = Math.max(
        0,
        Math.min(100, stressLevelRef.current),
      );
      const newData = generateBiometricsFromStress(stressLevelRef.current);
      const newState = newData.detectedState;

      if (
        (newState === 'ANXIOUS' || newState === 'STRESSED') &&
        newState !== previousStateRef.current
      ) {
        sendHealthAlert(newState);
      }

      previousStateRef.current = newState;
      setCurrentState(newState);
      setData(newData);
    }, 10000);

    return () => clearInterval(interval);
  }, [segments]);

  return (
    <BiometricsContext.Provider value={{ data, currentState }}>
      {children}
    </BiometricsContext.Provider>
  );
};

export const useBiometrics = () => {
  const context = useContext(BiometricsContext);
  if (!context)
    throw new Error('useBiometrics must be used within a BiometricsProvider');
  return context;
};
