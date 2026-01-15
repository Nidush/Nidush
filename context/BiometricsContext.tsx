import { UserState, WearableData } from '@/constants/data/types';
import { generateBiometricsFromStress } from '@/utils/biometricSimulator';
import { useSegments } from 'expo-router';
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';

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
  const segments = useSegments();

  useEffect(() => {
    const isOnboarding = segments.some(
      (segment) => segment === 'onboarding' || segment === 'profile-selection',
    );

    if (isOnboarding) return;

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
