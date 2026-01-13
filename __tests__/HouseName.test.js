import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HouseName from '../components/Onboarding/HouseName';

// Mock do Expo Status Bar
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Mock universal para imagens (Evita erro de path não encontrado)
jest.mock('react-native/Libraries/Image/RelativeImageStub', () => 'RelativeImageStub');

describe('HouseName', () => {
  test('onNext é chamado ao clicar no botão', () => {
    const onNextMock = jest.fn();
    
    const { getByText } = render(<HouseName onNext={onNextMock} />);
    
    // Simula o clique no botão
    const button = getByText('Create my home');
    fireEvent.press(button);
    
    // Verifica se a função foi chamada
    expect(onNextMock).toHaveBeenCalledTimes(1);
  });
});