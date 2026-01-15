import { UserState, WearableData } from '@/constants/data/types';
import { generateBiometricsFromStress } from '@/utils/biometricSimulator';
import * as Notifications from 'expo-notifications';
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

// --- CONFIGURAÇÃO DE NOTIFICAÇÕES (Mantida igual) ---
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

// 1. DEFINIÇÃO DO TIPO DE DADOS DO CONTEXTO
interface BiometricsContextType {
  data: WearableData | null;
  currentState: UserState;
}

// 2. CRIAÇÃO DO CONTEXTO
const BiometricsContext = createContext<BiometricsContextType | undefined>(
  undefined,
);

// 3. O PROVIDER (A TUA LÓGICA VIVE AQUI AGORA)
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

  // Pedir permissões ao iniciar a App
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
    const messagePool =
      state === 'ANXIOUS' ? ANXIOUS_MESSAGES : STRESSED_MESSAGES;
    const randomIndex = Math.floor(Math.random() * messagePool.length);
    const selectedMessage = messagePool[randomIndex];

    await Notifications.scheduleNotificationAsync({
      content: {
        title: selectedMessage.title,
        body: selectedMessage.body,
      },
      trigger: null,
    });
  };

  // O MOTOR DE SIMULAÇÃO
  useEffect(() => {
    const interval = setInterval(() => {
      // Simulação de subida/descida do stress
      if (trendRef.current === 'UP') {
        stressLevelRef.current += Math.floor(Math.random() * 20);
        if (stressLevelRef.current >= 100) trendRef.current = 'DOWN';
      } else {
        stressLevelRef.current -= Math.floor(Math.random() * 10);
        if (stressLevelRef.current <= 10) trendRef.current = 'UP';
      }

      // Garante limites entre 0 e 100
      stressLevelRef.current = Math.max(
        0,
        Math.min(100, stressLevelRef.current),
      );

      const newData = generateBiometricsFromStress(stressLevelRef.current);
      const newState = newData.detectedState;

      // Verifica se o estado mudou para enviar notificação
      if (
        (newState === 'ANXIOUS' || newState === 'STRESSED') &&
        newState !== previousStateRef.current
      ) {
        sendHealthAlert(newState);
      }

      previousStateRef.current = newState;
      setCurrentState(newState);
      setData(newData);

      // Nota: 30000 = 30 segundos. Para testes podes baixar para 3000 (3s).
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <BiometricsContext.Provider value={{ data, currentState }}>
      {children}
    </BiometricsContext.Provider>
  );
};

// 4. HOOK PARA CONSUMIR OS DADOS
export const useBiometrics = () => {
  const context = useContext(BiometricsContext);
  if (!context) {
    throw new Error('useBiometrics must be used within a BiometricsProvider');
  }
  return context;
};
