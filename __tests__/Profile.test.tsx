import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import Profile from '../app/Profile';

// 1️⃣ Mock das fontes
jest.mock('@expo-google-fonts/nunito', () => ({
  useFonts: () => [true],
  Nunito_400Regular: 'Nunito_400Regular',
  Nunito_600SemiBold: 'Nunito_600SemiBold',
  Nunito_700Bold: 'Nunito_700Bold',
}));

// 2️⃣ Mock do useRouter
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// 3️⃣ Mock dos ícones: retorna string simples (não JSX)
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  Ionicons: 'Ionicons',
}), { virtual: true });

// 4️⃣ Mock das imagens
jest.mock('@/assets/avatars/profile.png', () => 1, { virtual: true });

// 5️⃣ Mock do SafeAreaContext: retorna objetos simples
jest.mock('react-native-safe-area-context', () => ({
  SafeAreaProvider: ({ children }: any) => children,
  SafeAreaView: ({ children }: any) => children,
  useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
}));

describe('Profile Screen', () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    });
  });

  test('deve renderizar os elementos principais do perfil', () => {
    const { getByText, getByTestId } = render(<Profile />);

    expect(getByText('Profile')).toBeTruthy();
    expect(getByText('Laura Rossi')).toBeTruthy();
    expect(getByTestId('menu-account')).toBeTruthy();
  });

  test('deve navegar corretamente ao clicar nos botões', () => {
    const { getByTestId } = render(<Profile />);

    fireEvent.press(getByTestId('back-button'));
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');

    fireEvent.press(getByTestId('logout-button'));
    expect(mockReplace).toHaveBeenCalledWith('/profile-selection');
  });

  test('deve listar os hobbies corretamente', () => {
    const { getByText } = render(<Profile />);

    expect(getByText('Cooking')).toBeTruthy();
    expect(getByText('Workout')).toBeTruthy();
    expect(getByText('Meditation')).toBeTruthy();
    expect(getByText('Audiobooks')).toBeTruthy();
  });
});