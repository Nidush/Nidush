import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import SignUp from '../app/signup';

/* ===============================
   MOCK ANIMATIONS (resolve act)
================================ */
jest.spyOn(Animated, 'timing').mockImplementation(() => ({
  start: (cb) => cb && cb(),
}));

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@expo-google-fonts/nunito', () => ({
  useFonts: () => [true],
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('../assets/images/Logo.png', () => 'Logo.png');
jest.mock('../assets/images/Wave2.png', () => 'Wave2.png');

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
}));

/* ===============================
   🔥 SUPABASE MOCK (rápido e síncrono)
================================ */
jest.mock('../utils/supabase', () => ({
  supabase: {
    auth: {
      signUp: jest.fn(() =>
        Promise.resolve({
          data: { user: {} },
          error: null,
        })
      ),
    },
  },
}));

/* ===============================
   ONBOARDING MOCKS
================================ */
jest.mock('../components/Onboarding/WelcomeUser', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ onFinish }) => (
    <Text testID="welcome" onPress={onFinish}>
      Welcome
    </Text>
  );
});

jest.mock('../components/Onboarding/HouseName', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ onNext }) => (
    <Text testID="house" onPress={onNext}>
      House
    </Text>
  );
});

jest.mock('../components/Onboarding/WearableSync', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  return ({ onNext, onSkip }) => (
    <View>
      <Text testID="wearable-next" onPress={onNext}>
        Next
      </Text>
      <Text testID="wearable-skip" onPress={onSkip}>
        Skip
      </Text>
    </View>
  );
});

jest.mock('../components/Onboarding/ActivitySelection', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ onFinish }) => (
    <Text testID="activities" onPress={onFinish}>
      Activities
    </Text>
  );
});

jest.mock('../components/Onboarding/FinalLoading', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ onComplete }) => (
    <Text testID="loading" onPress={onComplete}>
      Loading
    </Text>
  );
});

/* ===============================
   TESTES
================================ */
describe('SignUp – fluxo completo 100%', () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({
      replace: mockReplace,
      push: jest.fn(),
    });
    Platform.OS = 'android';
  });

  it('renderiza a tela inicial', () => {
    const { getByText } = render(<SignUp />);
    expect(getByText('Welcome Home')).toBeTruthy();
  });

  it('completa fluxo até /(tabs)', async () => {
    const { getByText, getByTestId, findByTestId } = render(<SignUp />);

    // 🔥 preencher inputs
    fireEvent.changeText(getByTestId('first-name-input'), 'Laura');
    fireEvent.changeText(getByTestId('last-name-input'), 'Rossi');
    fireEvent.changeText(getByTestId('email-input'), 'laura@test.com');
    fireEvent.changeText(getByTestId('password-input'), '123456');

    fireEvent.press(getByText('Join Nidush'));

    // 🔥 esperar onboarding aparecer
    const welcome = await findByTestId('welcome');

    fireEvent.press(welcome);
    fireEvent.press(getByTestId('house'));
    fireEvent.press(getByTestId('wearable-next'));
    fireEvent.press(getByTestId('activities'));
    fireEvent.press(getByTestId('loading'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
    });
  });

  it('permite pular wearable', async () => {
    const { getByText, getByTestId, findByTestId } = render(<SignUp />);

    fireEvent.changeText(getByTestId('first-name-input'), 'Laura');
    fireEvent.changeText(getByTestId('last-name-input'), 'Rossi');
    fireEvent.changeText(getByTestId('email-input'), 'laura@test.com');
    fireEvent.changeText(getByTestId('password-input'), '123456');

    fireEvent.press(getByText('Join Nidush'));

    const welcome = await findByTestId('welcome');

    fireEvent.press(welcome);
    fireEvent.press(getByTestId('house'));
    fireEvent.press(getByTestId('wearable-skip'));
    fireEvent.press(getByTestId('activities'));
    fireEvent.press(getByTestId('loading'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalled();
    });
  });

  it('cobre branch iOS', () => {
    Platform.OS = 'ios';
    render(<SignUp />);
  });
});

/* ===============================
   CLEANUP (evita leaks)
================================ */
afterAll(() => {
  jest.useRealTimers();
});