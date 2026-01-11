import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import Onboarding from '../app/onboarding'; 
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Mocks de Infraestrutura
jest.mock('expo-router', () => ({ useRouter: jest.fn() }));
jest.mock('@react-native-async-storage/async-storage', () => ({ 
  setItem: jest.fn(() => Promise.resolve()) 
}));
jest.mock('expo-status-bar', () => ({ StatusBar: () => null }));

jest.useFakeTimers();

// 2. Mocks de Imagens e GIFs (Individuais para evitar erro de escopo)
jest.mock('../assets/images/Logo.png', () => 'Logo.png');
jest.mock('../assets/gif/Inico.png', () => 'Inico.png');
jest.mock('../assets/gif/video.png', () => 'video.png');
jest.mock('../assets/gif/video3.png', () => 'video3.png');
jest.mock('../assets/gif/video4.png', () => 'video4.png');
jest.mock('../assets/gif/video5.png', () => 'video5.png');
jest.mock('../assets/gif/video11.png', () => 'video11.png');

describe('Onboarding - Testes de Cobertura Total', () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({ replace: mockReplace });
  });

  test('deve navegar manualmente ao clicar nas áreas laterais', () => {
    const { getByText, getAllByTestId } = render(<Onboarding />);
    
    fireEvent.press(getByText('Discover'));

    const rightArea = getAllByTestId('right-tap-area')[0];
    const leftArea = getAllByTestId('left-tap-area')[0];

    fireEvent.press(rightArea);
    expect(getByText('Your home, tuned to you')).toBeTruthy();

    fireEvent.press(leftArea);
    expect(getByText('Your home, your safe space')).toBeTruthy();
  });

  test('deve navegar para signup mesmo se o AsyncStorage falhar', async () => {
    AsyncStorage.setItem.mockRejectedValueOnce(new Error('Erro de Banco'));
    
    const { getByText, getAllByText } = render(<Onboarding />);
    fireEvent.press(getByText('Discover'));

    const skipButtons = getAllByText('Skip');
    fireEvent.press(skipButtons[0]);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/signup');
    });
  });

  test('deve avançar automaticamente após o tempo definido', () => {
    const { getByText } = render(<Onboarding />);
    fireEvent.press(getByText('Discover'));
    
    act(() => {
      jest.advanceTimersByTime(5000);
    });

    expect(getByText('Your home, tuned to you')).toBeTruthy();
  });

  test('deve atualizar o índice ao disparar scroll manual', () => {
    const { getByText, getByTestId } = render(<Onboarding />);
    fireEvent.press(getByText('Discover'));

    const flatList = getByTestId('onboarding-flatlist');
    
    fireEvent(flatList, 'momentumScrollEnd', {
      nativeEvent: {
        contentOffset: { x: 400 }, 
        layoutMeasurement: { width: 400 }
      },
    });
  });

  test('deve navegar ao final ao clicar em Begin Journey', async () => {
    const { getByText } = render(<Onboarding />);
    fireEvent.press(getByText('Discover'));

    act(() => {
      jest.advanceTimersByTime(25000); 
    });

    const beginButton = getByText('Begin Journey');
    fireEvent.press(beginButton);

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@viewedOnboarding', 'true');
      expect(mockReplace).toHaveBeenCalledWith('/signup');
    });
  });
});