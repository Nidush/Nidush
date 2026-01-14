import { UserState, WearableData } from '@/constants/data/types';
import { generateBiometricsFromStress } from '@/utils/biometricSimulator';
import * as Notifications from 'expo-notifications';
import { useEffect, useRef, useState } from 'react';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});
const ANXIOUS_MESSAGES = [
  {
    title: 'Need a moment of peace?',
    body: "Things seem a bit overwhelming right now. How about we relax together with 'Moonlight Bay'?",
  },
  {
    title: "Let's breathe together",
    body: "I noticed your heart is racing a bit. Why not let the 'Moonlight Bay' atmosphere ground you?",
  },
  {
    title: 'The world can wait...',
    body: "You deserve a few minutes of quiet. Let's transform your space into a sanctuary of calm.",
  },
];

const STRESSED_MESSAGES = [
  {
    title: 'Time for a quick reset?',
    body: "You've been doing great, but a little break might feel good. Want to try 'Forest Bathing'?",
  },
  {
    title: 'Feeling a bit tense?',
    body: "A quick refresh could work wonders. Let's bring the 'Forest Bathing' energy to your room.",
  },
  {
    title: 'Recharge your energy',
    body: 'Even a small pause helps you stay focused. Shall we activate a calming forest environment?',
  },
];

export const useWearableSimulator = () => {
  const [data, setData] = useState<WearableData | null>(null);
  const [currentState, setCurrentState] = useState<UserState>('RELAXED');

  const stressLevelRef = useRef(10);
  const trendRef = useRef<'UP' | 'DOWN'>('UP');
  const previousStateRef = useRef<UserState>('RELAXED');

  useEffect(() => {
    async function requestPermissions() {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        console.log('Permission for notifications not granted.');
      }
    }
    requestPermissions();
  }, []);

  const sendHealthAlert = async (state: UserState) => {
    // 1. Escolher qual lista usar
    const messagePool =
      state === 'ANXIOUS' ? ANXIOUS_MESSAGES : STRESSED_MESSAGES;

    // 2. Escolher uma mensagem aleatória da lista
    const randomIndex = Math.floor(Math.random() * messagePool.length);
    const selectedMessage = messagePool[randomIndex];

    // 3. Enviar a notificação
    await Notifications.scheduleNotificationAsync({
      content: {
        title: selectedMessage.title,
        body: selectedMessage.body,
      },
      trigger: null,
    });
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (trendRef.current === 'UP') {
        stressLevelRef.current += Math.floor(Math.random() * 20);
        if (stressLevelRef.current >= 100) trendRef.current = 'DOWN';
      } else {
        stressLevelRef.current -= Math.floor(Math.random() * 10);
        if (stressLevelRef.current <= 10) trendRef.current = 'UP';
      }

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
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    data,
    currentState,
  };
};
