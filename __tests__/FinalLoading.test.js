import React from 'react';
import { render, act } from '@testing-library/react-native';
import FinalLoading from '../components/Onboarding/FinalLoading';

// Mock dos componentes usando o mesmo caminho do arquivo original
jest.mock('@/components/loading/BreathingLoader', () => {
  const { View } = require('react-native');
  return () => <View testID="breathing-loader" />;
});

jest.mock('@/components/loading/TipDisplay', () => {
  const { Text } = require('react-native');
  return ({ tip }) => <Text>{tip}</Text>;
});

jest.mock('@/constants/loadingData', () => ({
  TIPS: ['Test Tip 1', 'Test Tip 2'],
}));

jest.useFakeTimers();

describe('FinalLoading', () => {
  test('chama onComplete após 4s', () => {
    const onCompleteMock = jest.fn();
    
    const { getByText } = render(<FinalLoading onComplete={onCompleteMock} />);
    
    // Verifica se a mensagem inicial aparece
    expect(getByText('Take a deep breath. We are preparing your safe space...')).toBeTruthy();

    act(() => {
      // Avança 2 segundos para a segunda mensagem
      jest.advanceTimersByTime(2000);
    });
    
    expect(getByText('Crafting activities for you...')).toBeTruthy();

    act(() => {
      // Avança mais 2 segundos (total 4s) para completar
      jest.advanceTimersByTime(2000);
    });

    expect(onCompleteMock).toHaveBeenCalledTimes(1);
  });
});