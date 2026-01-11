import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import Onboarding from '../app/onboarding'; 
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Mocks de Infraestrutura
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// 2. Mock do expo-video
jest.mock('expo-video', () => ({
  useVideoPlayer: jest.fn(() => ({
    play: jest.fn(),
    pause: jest.fn(),
    loop: false,
    muted: true,
  })),
  VideoView: () => null,
}));

// 3. Mocks de Assets
jest.mock('../assets/images/Logo.png', () => 'Logo.png');
jest.mock('../assets/videos/nidush_video1.mp4', () => 1);
jest.mock('../assets/videos/nidush_video2.mp4', () => 2);
jest.mock('../assets/videos/nidush_video3.mp4', () => 3);
jest.mock('../assets/videos/nidush_video4.mp4', () => 4);
jest.mock('../assets/videos/nidush_video5.mp4', () => 5);
jest.mock('../assets/videos/nidush_video6.mp4', () => 6);
jest.mock('../assets/videos/nidush_video7.mp4', () => 7);

jest.useFakeTimers();

describe('Onboarding - Testes de Cobertura', () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({ replace: mockReplace });
  });

  test('deve avançar e voltar slides manualmente via áreas de toque', () => {
    const { getByText, getAllByText, getAllByTestId } = render(<Onboarding />);
    
    // Inicia o onboarding
    fireEvent.press(getByText('Discover'));

    // Avança para o slide 2
    const rightAreas = getAllByTestId('right-tap-area');
    fireEvent.press(rightAreas[0]); 
    
    expect(getByText('Your home, tuned to you')).toBeTruthy();

    // Volta para o slide 1
    const leftAreas = getAllByTestId('left-tap-area');
    fireEvent.press(leftAreas[1]); 
    
    // Usamos getAllByText para evitar o erro de múltiplos elementos
    // e pegamos o primeiro da lista [0]
    const welcomeText = getAllByText(/your safe space/i);
    expect(welcomeText[0]).toBeTruthy();
  });

  test('deve avançar automaticamente conforme o timer', () => {
    const { getByText } = render(<Onboarding />);
    fireEvent.press(getByText('Discover'));
    
    act(() => {
      jest.advanceTimersByTime(5000); 
    });

    expect(getByText('Your home, tuned to you')).toBeTruthy();
  });

  test('deve salvar estado e ir para signup ao clicar em Skip', async () => {
    const { getByText, getAllByText } = render(<Onboarding />);
    fireEvent.press(getByText('Discover'));

    // Pega o primeiro botão Skip encontrado
    const skipButtons = getAllByText('Skip');
    fireEvent.press(skipButtons[0]);

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@viewedOnboarding', 'true');
      expect(mockReplace).toHaveBeenCalledWith('/signup');
    });
  });

  test('deve completar o onboarding no último slide', async () => {
    const { getByText } = render(<Onboarding />);
    fireEvent.press(getByText('Discover'));

    // Pular para o último slide (5 * 5000ms)
    act(() => {
      jest.advanceTimersByTime(25000); 
    });

    const beginButton = getByText('Begin Journey');
    fireEvent.press(beginButton);

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/signup');
    });
  });
  
  test('deve navegar para signup mesmo se o AsyncStorage falhar', async () => {
    // Simula uma falha no setItem
    AsyncStorage.setItem.mockRejectedValueOnce(new Error('AsyncStorage Error'));
    
    const { getByText, getAllByText } = render(<Onboarding />);
    
    // Entra no onboarding
    fireEvent.press(getByText('Discover'));

    // Clica no Skip
    const skipButtons = getAllByText('Skip');
    fireEvent.press(skipButtons[0]);

    // Verifica se, apesar do erro, o redirecionamento aconteceu (Linha 87)
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/signup');
    });
  });
});