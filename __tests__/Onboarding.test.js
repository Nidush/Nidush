import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import Onboarding from '../app/onboarding';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FlatList } from 'react-native';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('expo-video', () => ({
  useVideoPlayer: jest.fn((source, callback) => {
    const player = { play: jest.fn(), pause: jest.fn(), loop: false, muted: false };
    if (callback) callback(player);
    return player;
  }),
  VideoView: () => null,
}));

jest.mock('../assets/images/Logo.png', () => 'Logo.png');
jest.mock('../assets/videos/nidush_video1.mp4', () => 1);
jest.mock('../assets/videos/nidush_video2.mp4', () => 2);
jest.mock('../assets/videos/nidush_video3.mp4', () => 3);
jest.mock('../assets/videos/nidush_video4.mp4', () => 4);
jest.mock('../assets/videos/nidush_video5.mp4', () => 5);
jest.mock('../assets/videos/nidush_video6.mp4', () => 6);
jest.mock('../assets/videos/nidush_video7.mp4', () => 7);

jest.useFakeTimers();

describe('Onboarding - Testes de Cobertura Total', () => {
  const mockReplace = jest.fn();
  let scrollSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({ replace: mockReplace });
    scrollSpy = jest.spyOn(FlatList.prototype, 'scrollToIndex').mockImplementation(() => {});
  });

  afterEach(() => {
    scrollSpy.mockRestore();
  });

  test('deve avançar e voltar slides manualmente via áreas de toque', () => {
    const { getByText, getAllByTestId } = render(<Onboarding />);
    fireEvent.press(getByText('Discover'));

    const rightAreas = getAllByTestId('right-tap-area');
    fireEvent.press(rightAreas[0]);
    expect(scrollSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 1 }));

    const leftAreas = getAllByTestId('left-tap-area');
    fireEvent.press(leftAreas[0]);
    expect(scrollSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 0 }));
  });

  test('deve avançar automaticamente conforme o timer', () => {
    const { getByText } = render(<Onboarding />);
    fireEvent.press(getByText('Discover'));
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(scrollSpy).toHaveBeenCalled();
  });

  test('deve salvar estado e ir para signup ao clicar em Skip', async () => {
    const { getByText, getAllByText } = render(<Onboarding />);
    fireEvent.press(getByText('Discover'));
    const skipButtons = getAllByText('Skip');
    fireEvent.press(skipButtons[0]);
    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@viewedOnboarding', 'true');
      expect(mockReplace).toHaveBeenCalledWith('/signup');
    });
  });

  test('deve completar o onboarding ao chegar no final do timer', async () => {
    const { getByText } = render(<Onboarding />);
    fireEvent.press(getByText('Discover'));
    act(() => {
      jest.advanceTimersByTime(5000 * 6);
    });
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/signup');
    });
  });

  test('deve navegar mesmo se o AsyncStorage falhar', async () => {
    AsyncStorage.setItem.mockRejectedValueOnce(new Error('Fail'));
    const { getByText, getAllByText } = render(<Onboarding />);
    fireEvent.press(getByText('Discover'));
    const skipButtons = getAllByText('Skip');
    fireEvent.press(skipButtons[0]);
    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/signup');
    });
  });

  test('deve executar getItemLayout para garantir cobertura', () => {
    const { getByTestId, getByText } = render(<Onboarding />);
    fireEvent.press(getByText('Discover'));
    const list = getByTestId('onboarding-flatlist');
    const layout = list.props.getItemLayout(null, 1);
    expect(layout).toEqual({ length: expect.any(Number), offset: expect.any(Number), index: 1 });
  });

  test('deve cobrir goToPrev quando currentIndex > 0', () => {
    const { getByText, getAllByTestId } = render(<Onboarding />);
    fireEvent.press(getByText('Discover'));

    const rightAreas = getAllByTestId('right-tap-area');
    fireEvent.press(rightAreas[0]); 

    const leftAreas = getAllByTestId('left-tap-area');
    fireEvent.press(leftAreas[0]); 
    expect(scrollSpy).toHaveBeenCalledWith(expect.objectContaining({ index: 0 }));
  });
});
