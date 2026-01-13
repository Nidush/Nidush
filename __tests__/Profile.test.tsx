import { fireEvent, render } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import Profile from '../app/Profile';

// Mock do useRouter
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// Mock dos icones
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

// Mock para a imagem do perfil
jest.mock('@/assets/avatars/profile.png', () => 1, { virtual: true });

describe('Profile Screen', () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    });
  });

  test('deve renderizar o nome do utilizador e o título da página', () => {
    const { getByText } = render(<Profile />);
    
    expect(getByText('Laura Rossi')).toBeTruthy();
    expect(getByText('Profile')).toBeTruthy();
  });

  test('deve navegar para (tabs) ao clicar no botão de voltar', () => {
    const { getByTestId } = render(<Profile />);
    
    const backButton = getByTestId('back-button');
    fireEvent.press(backButton);
    
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  test('deve navegar para a seleção de perfil ao clicar no botão Logout', () => {
    const { getByTestId } = render(<Profile />);
    
    const logoutButton = getByTestId('logout-button');
    fireEvent.press(logoutButton);
    
    expect(mockReplace).toHaveBeenCalledWith('/profile-selection');
  });

  test('deve renderizar as secções de menu corretamente via testID', () => {
    const { getByTestId } = render(<Profile />);
    
    expect(getByTestId('menu-account')).toBeTruthy();
    expect(getByTestId('menu-notifications')).toBeTruthy();
    expect(getByTestId('menu-residents')).toBeTruthy();
  });

  test('deve mostrar os dispositivos wearables configurados', () => {
    const { getByTestId, getByText } = render(<Profile />);
    
    expect(getByTestId('device-apple-watch')).toBeTruthy();
    expect(getByText('Connected')).toBeTruthy();
    
    expect(getByTestId('device-mi-band')).toBeTruthy();
    expect(getByText('Disconnected')).toBeTruthy();
  });

  test('deve verificar a existência dos hobbies no ecrã', () => {
    const { getByText } = render(<Profile />);
    
    expect(getByText('Cooking')).toBeTruthy();
    expect(getByText('Workout')).toBeTruthy();
    expect(getByText('Meditation')).toBeTruthy();
    expect(getByText('Audiobooks')).toBeTruthy();
  });
});