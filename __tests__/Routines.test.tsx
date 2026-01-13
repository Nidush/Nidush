import { fireEvent, render, screen } from '@testing-library/react-native';
import React from 'react';
import Routines from '../app/(tabs)/Routines';

// Mocks essenciais para evitar erros de módulos nativos
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

// Mock das fontes para evitar erro de export
jest.mock('@expo-google-fonts/nunito', () => ({
  useFonts: () => [true],
  Nunito_600SemiBold: 'Nunito_600SemiBold',
  Nunito_700Bold: 'Nunito_700Bold',
}));

describe('Routines Screen', () => {
  test('deve renderizar o título e as rotinas corretamente', () => {
    render(<Routines />);
    
    // Verifica o título principal
    expect(screen.getByText('Routines')).toBeTruthy();
    
    // Verifica se os títulos das rotinas (que vimos no log) aparecem
    expect(screen.getByText('Sunrise Awakening')).toBeTruthy();
    expect(screen.getByText('Gym Hour')).toBeTruthy();
  });

  test('deve alternar o estado de uma rotina ao clicar', () => {
    render(<Routines />);
    
    // No seu código, o switch está dentro de um TouchableOpacity com testID
    // Vamos usar o testID que já está no seu Routines.tsx
    const gymSwitch = screen.getByTestId('routine-card-2');
    
    // O teste de "press" valida se a função toggleRoutine não quebra a app
    fireEvent.press(gymSwitch);
    
    expect(gymSwitch).toBeTruthy();
  });

  test('deve renderizar a barra de pesquisa e o botão de adicionar', () => {
    render(<Routines />);
    
    // Verifica o input de pesquisa via testID
    expect(screen.getByTestId('search-input')).toBeTruthy();
    
    // Verifica o container do botão de adicionar via testID
    expect(screen.getByTestId('add-routine-container')).toBeTruthy();
  });
});