import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import Profile from '../app/Profile';

// Mock do router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// Mock dos ícones
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

// Mock imagem
jest.mock('@/assets/avatars/profile.png', () => 1, { virtual: true });

// 🔥 MOCK DO SUPABASE (IMPORTANTE para evitar async real)
jest.mock('../utils/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() =>
        Promise.resolve({
          data: {
            user: {
              email: 'laura@test.com',
              user_metadata: {
                first_name: 'Laura',
                last_name: 'Rossi',
              },
            },
          },
          error: null,
        })
      ),
      signOut: jest.fn(() => Promise.resolve()),
    },
  },
}));

describe('Profile Screen', () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    });
  });

  test('deve renderizar nome e título', async () => {
    const { findByText } = render(<Profile />);

    expect(await findByText('Laura Rossi')).toBeTruthy();
    expect(await findByText('Profile')).toBeTruthy();
  });

  test('botão voltar navega para tabs', async () => {
    const { getByTestId } = render(<Profile />);

    await waitFor(() => {
      expect(getByTestId('back-button')).toBeTruthy();
    });

    fireEvent.press(getByTestId('back-button'));

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  test('logout navega para login', async () => {
    const { getByTestId } = render(<Profile />);

    fireEvent.press(getByTestId('logout-button'));

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  test('menus renderizam', async () => {
    const { getByTestId } = render(<Profile />);

    await waitFor(() => {
      expect(getByTestId('menu-account')).toBeTruthy();
      expect(getByTestId('menu-notifications')).toBeTruthy();
      expect(getByTestId('menu-residents')).toBeTruthy();
    });
  });

  test('dispositivos renderizam', async () => {
    const { getByTestId, getByText } = render(<Profile />);

    await waitFor(() => {
      expect(getByTestId('device-apple-watch')).toBeTruthy();
      expect(getByText('Connected')).toBeTruthy();

      expect(getByTestId('device-mi-band')).toBeTruthy();
      expect(getByText('Disconnected')).toBeTruthy();
    });
  });

  test('hobbies aparecem', async () => {
    const { getByText } = render(<Profile />);

    await waitFor(() => {
      expect(getByText('Cooking')).toBeTruthy();
      expect(getByText('Workout')).toBeTruthy();
      expect(getByText('Meditation')).toBeTruthy();
      expect(getByText('Audiobooks')).toBeTruthy();
    });
  });
});