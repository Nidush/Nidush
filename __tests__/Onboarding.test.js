import React from 'react';
import { render, fireEvent, waitFor, act, cleanup } from '@testing-library/react-native';
import { Dimensions, Animated } from 'react-native';
import Onboarding from '../app/onboarding';

jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));
jest.mock('expo-splash-screen', () => ({ preventAutoHideAsync: jest.fn(), hideAsync: jest.fn() }));
jest.mock('expo-video', () => ({
  useVideoPlayer: jest.fn(() => ({ play: jest.fn().mockResolvedValue(undefined), pause: jest.fn(), loop: false })),
  VideoView: 'VideoView',
}));
jest.mock('@expo-google-fonts/nunito', () => ({
  useFonts: () => [true],
  Nunito_400Regular: 'Nunito_400Regular',
  Nunito_600SemiBold: 'Nunito_600SemiBold',
  Nunito_700Bold: 'Nunito_700Bold',
}));
const mockReplace = jest.fn();
jest.mock('expo-router', () => ({ useRouter: () => ({ replace: mockReplace }) }));
jest.mock('@react-native-async-storage/async-storage', () => require('@react-native-async-storage/async-storage/jest/async-storage-mock'));

jest.spyOn(Animated, 'timing').mockImplementation((value, config) => ({
  start: (cb) => {
    value.setValue(config.toValue);
    if (cb) cb({ finished: true });
  },
  stop: () => {},
}));

describe('Onboarding Screen', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    jest.spyOn(Dimensions, 'get').mockReturnValue({ width: 375, height: 812 });
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
    cleanup();
  });

  it('deve renderizar boas-vindas e navegar para os slides ao clicar em Discover', async () => {
    const { getByText, queryByText, getAllByText } = render(<Onboarding />);
    
    expect(getByText('Welcome to Nidush')).toBeTruthy();
    
    const discoverBtn = getByText('Discover');
    fireEvent.press(discoverBtn);

    act(() => { jest.advanceTimersByTime(800); });

    await waitFor(() => {
      expect(queryByText('Welcome to Nidush')).toBeNull();
      const slides = getAllByText(/Your home/);
      expect(slides[0]).toBeTruthy();
    });
  });

  it('deve permitir pular (Skip) o onboarding', async () => {
    const { getByText, getAllByText } = render(<Onboarding />);
    
    fireEvent.press(getByText('Discover'));
    act(() => { jest.advanceTimersByTime(1600); });

    const skipBtns = getAllByText('Skip');
    fireEvent.press(skipBtns[0]);

    act(() => { jest.advanceTimersByTime(800); });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/signup');
    });
  });

  it('deve atualizar dimensões ao redimensionar', () => {
    const { rerender } = render(<Onboarding />);
    act(() => {
      Dimensions.set({ window: { width: 1024, height: 768 } });
    });
    rerender(<Onboarding />);
  });
});