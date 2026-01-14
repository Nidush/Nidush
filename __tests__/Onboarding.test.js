import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import Onboarding from '../app/onboarding';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. MOCK DO EXPO-VIDEO (Fundamental para não dar erro de export)
jest.mock('expo-video', () => ({
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    loop: false,
  })),
  VideoView: 'VideoView',
}));

// 2. MOCK DO STATUS BAR
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// 3. OUTROS MOCKS
jest.mock('@react-native-async-storage/async-storage', () => 
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

const mockReplace = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

describe('Onboarding Screen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it('deve renderizar a tela de Welcome e navegar até o fim', async () => {
    const { getByText, queryByText } = render(<Onboarding />);
    
    expect(getByText('Welcome to Nidush')).toBeTruthy();
    
    fireEvent.press(getByText('Discover'));
    act(() => { jest.advanceTimersByTime(800); });

    await waitFor(() => {
      expect(getByText('Your home,\nyour safe space')).toBeTruthy();
    });

  });

  it('deve avançar automaticamente os slides', async () => {
    const { getByText } = render(<Onboarding />);
    fireEvent.press(getByText('Discover'));
    act(() => { jest.advanceTimersByTime(800); });

    act(() => {
      jest.advanceTimersByTime(5000);
    });

    await waitFor(() => {
      expect(getByText('Your home,\ntuned to you')).toBeTruthy();
    });
  });
});