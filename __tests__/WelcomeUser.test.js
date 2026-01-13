import React from 'react';
import { render } from '@testing-library/react-native';
import WelcomeUser from '../components/Onboarding/WelcomeUser';

// Mock do expo-video
jest.mock('expo-video', () => ({
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    loop: true,
    muted: true,
    playbackRate: 0.6
  })),
  VideoView: 'VideoView', // Usar string facilita o debug
}));

// Mock do expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: 'StatusBar',
}));

// Mock do react-native-safe-area-context
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
}));

describe('WelcomeUser', () => {
  test('renderiza sem crashar e mostra primeira frase', () => {
    const onFinishMock = jest.fn();
    const { getByText } = render(<WelcomeUser onFinish={onFinishMock} />);
    
    // Usamos queryByText ou regex para evitar erros de case sensitive
    expect(getByText(/Welcome home/i)).toBeTruthy();
  });
});