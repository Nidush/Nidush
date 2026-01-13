import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import WearableSync from '../components/Onboarding/WearableSync';
import { Animated } from 'react-native';

// Mock do Animated.loop para não travar testes
Animated.loop = jest.fn(() => ({ start: jest.fn() }));

// Mock dos ícones
jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  Ionicons: 'Ionicons',
}));

// Mock do SVG/Icons que você usa no WearableSync
jest.mock('../assets/assets', () => ({
  Icons: { devices: () => null },
}));

describe('WearableSync', () => {
  test('deve chamar onNext e onSkip', () => {
    const onNextMock = jest.fn();
    const onSkipMock = jest.fn();

    const { getByText } = render(
      <WearableSync onNext={onNextMock} onSkip={onSkipMock} />
    );

    fireEvent.press(getByText('Start Scanning'));
    expect(onNextMock).toHaveBeenCalled();

    fireEvent.press(getByText("I'll do this later"));
    expect(onSkipMock).toHaveBeenCalled();
  });
});
