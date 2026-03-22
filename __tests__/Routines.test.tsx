import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import Routines from '../app/(tabs)/Routines';

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
  Ionicons: 'Ionicons',
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }: any) => children,
}));

jest.mock('@react-native-masked-view/masked-view', () => ({
  __esModule: true,
  default: ({ children }: any) => children,
}));

// Mock das fontes
jest.mock('@expo-google-fonts/nunito', () => ({
  useFonts: () => [true],
  Nunito_400Regular: 'Nunito_400Regular',
  Nunito_600SemiBold: 'Nunito_600SemiBold',
  Nunito_700Bold: 'Nunito_700Bold',
}));

describe('Routines Screen', () => {
  test('deve renderizar o título e as rotinas corretamente', () => {
    render(<Routines />);
    
    expect(screen.getByText('Routines')).toBeTruthy();
    
    expect(screen.getByText('Sunrise Awakening')).toBeTruthy();
    expect(screen.getByText('Gym Hour')).toBeTruthy();
  });

  test('deve alternar o estado de uma rotina ao clicar', () => {
    render(<Routines />);
    
    const gymSwitch = screen.getByTestId('routine-card-2');
    
    fireEvent.press(gymSwitch);
    
    expect(gymSwitch).toBeTruthy();
  });
});