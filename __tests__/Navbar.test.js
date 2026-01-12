import React from 'react';
import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import TabLayout from '../app/(tabs)/_layout';

const mockScreenCapture = jest.fn();

jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Tabs: Object.assign(
      ({ children }) => <View>{children}</View>,
      { Screen: (props) => { mockScreenCapture(props); return null; } }
    ),
  };
});

jest.mock('../assets/navbar/assets', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Icons: {
      SpaIcon: () => <View />,
      RoutineIcon: () => <View />,
      RoomsIcon: () => <View />,
    },
    Images: {}
  };
});

jest.mock('../assets/images/Logo.png', () => 1);

describe('TabLayout Full Coverage', () => {
  // Limpa os mocks entre os testes
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve cobrir os estilos de iOS (Branches do Platform.OS)', () => {
    Platform.OS = 'ios';
    render(<TabLayout />);
    
    // Executa os ícones para cobrir as funções
    mockScreenCapture.mock.calls.forEach((call) => {
      const { options } = call[0];
      if (options?.tabBarIcon) render(options.tabBarIcon({ color: '#000' }));
    });
  });

  it('deve cobrir os estilos de Android (Branches do Platform.OS)', () => {
    Platform.OS = 'android';
    render(<TabLayout />);
    
    // Verifica se renderizou com sucesso no Android também
    expect(mockScreenCapture).toHaveBeenCalled();
  });
});