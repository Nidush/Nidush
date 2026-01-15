import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';

/* ===============================
   MOCK DO ANIMATED
================================ */
jest.spyOn(Animated, 'timing').mockImplementation(() => ({
  start: (cb) => cb && cb(),
}));


jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@expo-google-fonts/nunito', () => ({
  useFonts: () => [true],
  Nunito_400Regular: 'Nunito_400Regular',
  Nunito_600SemiBold: 'Nunito_600SemiBold',
  Nunito_700Bold: 'Nunito_700Bold',
}));


jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('../assets/images/Logo.png', () => 'Logo.png');
jest.mock('../assets/images/Wave2.png', () => 'Wave2.png');

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
}));



jest.mock('../components/Onboarding/WelcomeUser', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ onFinish }) => (
    <Text testID="welcome" onPress={onFinish}>Welcome</Text>
  );
});

jest.mock('../components/Onboarding/HouseName', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ onNext }) => (
    <Text testID="house" onPress={onNext}>House</Text>
  );
});

jest.mock('../components/Onboarding/WearableSync', () => {
  const React = require('react');
  const { Text, View } = require('react-native');
  return ({ onNext, onSkip }) => (
    <View>
      <Text testID="wearable-next" onPress={onNext}>Next</Text>
      <Text testID="wearable-skip" onPress={onSkip}>Skip</Text>
    </View>
  );
});

jest.mock('../components/Onboarding/ActivitySelection', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ onFinish }) => (
    <Text testID="activities" onPress={onFinish}>Activities</Text>
  );
});

jest.mock('../components/Onboarding/FinalLoading', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ onComplete }) => (
    <Text testID="loading" onPress={onComplete}>Loading</Text>
  );
});

import SignUp from '../app/signup';


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

  it('completa todo o fluxo até /(tabs)', () => {
    const { getByText, getByTestId } = render(<SignUp />);

    fireEvent.press(getByText('Join Nidush'));
    fireEvent.press(getByTestId('welcome'));
    fireEvent.press(getByTestId('house'));
    fireEvent.press(getByTestId('wearable-next'));
    fireEvent.press(getByTestId('activities'));
    fireEvent.press(getByTestId('loading'));

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  it('permite pular o wearable', () => {
    const { getByText, getByTestId } = render(<SignUp />);

    fireEvent.press(getByText('Join Nidush'));
    fireEvent.press(getByTestId('welcome'));
    fireEvent.press(getByTestId('house'));
    fireEvent.press(getByTestId('wearable-skip'));
    fireEvent.press(getByTestId('activities'));
    fireEvent.press(getByTestId('loading'));

    expect(mockReplace).toHaveBeenCalled();
  });

  it('cobre branch do iOS', () => {
    Platform.OS = 'ios';
    render(<SignUp />);
  });
});
