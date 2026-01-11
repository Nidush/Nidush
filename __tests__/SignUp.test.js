import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import SignUp from '../app/signup'; 

jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('../assets/images/Logo.png', () => 'Logo.png');
jest.mock('../assets/images/Wave2.png', () => 'Wave2.png');

jest.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }) => children,
  SafeAreaProvider: ({ children }) => children,
}));

describe('Página de Cadastro (SignUp)', () => {
  const mockReplace = jest.fn();
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useRouter.mockReturnValue({
      replace: mockReplace,
      push: mockPush,
    });
  });

  test('deve renderizar os textos principais corretamente', () => {
    const { getByText } = render(<SignUp />);
    
    expect(getByText('Welcome Home')).toBeTruthy();
  });

  test('deve navegar para /(tabs) ao clicar no botão Join Nidush', () => {
    const { getByText } = render(<SignUp />);
    const button = getByText('Join Nidush');

    fireEvent.press(button);
    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  test('deve navegar para /(tabs) ao clicar no link de Login', () => {
    const { getByText } = render(<SignUp />);
    const loginLink = getByText('Login');

    fireEvent.press(loginLink);
    expect(mockPush).toHaveBeenCalledWith('/(tabs)');
  });
});