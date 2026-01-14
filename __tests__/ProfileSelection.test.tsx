import { fireEvent, render } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import React from 'react';
import ProfileSelection from '../app/profile-selection';

// Mock do useRouter
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

// Mock dos icons
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
}));

// Mock dos assets
jest.mock('./../assets/avatars/profile.png', () => 1, { virtual: true });
jest.mock('./../assets/avatars/profile1.png', () => 2, { virtual: true });
jest.mock('./../assets/avatars/profile3.png', () => 3, { virtual: true });
jest.mock('./../assets/images/Wave2.png', () => 4, { virtual: true });

describe('Profile Selection Screen', () => {
  const mockReplace = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue({
      replace: mockReplace,
    });
  });

  test('deve renderizar o título correto com o host Laura', () => {
    const { getByText } = render(<ProfileSelection />);
    expect(getByText("Who is at Laura's home?")).toBeTruthy();
  });

  test('deve listar os três perfis iniciais', () => {
    const { getByText, getByTestId } = render(<ProfileSelection />);
    
    expect(getByText('Laura Rossi')).toBeTruthy();
    expect(getByText('Miguel Soares')).toBeTruthy();
    expect(getByText('Inês Silva')).toBeTruthy();
    
    // Verifica se os IDs de teste estão presentes
    expect(getByTestId('profile-item-1')).toBeTruthy();
    expect(getByTestId('profile-item-2')).toBeTruthy();
    expect(getByTestId('profile-item-3')).toBeTruthy();
  });

  test('deve navegar para as tabs ao selecionar o primeiro perfil', () => {
    const { getByTestId } = render(<ProfileSelection />);
    
    const profileNode = getByTestId('profile-item-1');
    fireEvent.press(profileNode);
    
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  test('deve renderizar os botões de ação (Add e Manage)', () => {
    const { getByTestId, getByText } = render(<ProfileSelection />);
    
    expect(getByTestId('add-profile-button')).toBeTruthy();
    expect(getByText('Add Profile')).toBeTruthy();
    
    expect(getByTestId('manage-profiles-button')).toBeTruthy();
    expect(getByText('Manage profiles')).toBeTruthy();
  });
});