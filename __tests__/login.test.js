import React from 'react';
import { render } from '@testing-library/react-native';
import Login from '../app/login';

// Mock do AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

// Mock do supabase para não dar erro durante os testes
jest.mock('../utils/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: jest.fn(),
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn(),
        })),
      })),
    })),
  },
  apiLog: jest.fn(),
}));

// Mock das fontes do Expo
jest.mock('@expo-google-fonts/nunito', () => ({
  useFonts: () => [true],
  Nunito_400Regular: {},
  Nunito_600SemiBold: {},
  Nunito_700Bold: {},
}));

// Mock do expo-router
jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
  }),
  useLocalSearchParams: () => ({
    registeredEmail: '',
  }),
}));


describe('Login Screen', () => {
  it('renders correctly', () => {
    const { getByText } = render(<Login />);
    // Verifica se os textos principais aparecem
    expect(getByText('Welcome Back')).toBeTruthy();
  });
});
