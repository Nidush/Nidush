import { render, act } from '@testing-library/react-native';
import FinalLoading from '../components/Onboarding/FinalLoading';

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

jest.mock('@expo-google-fonts/nunito', () => ({
  useFonts: () => [true],
  Nunito_400Regular: 'Nunito_400Regular',
  Nunito_600SemiBold: 'Nunito_600SemiBold',
  Nunito_700Bold: 'Nunito_700Bold',
}));

jest.useFakeTimers();

describe('FinalLoading', () => {
  test('chama onComplete após 4s', () => {
    const onCompleteMock = jest.fn();
    
    const { getByText } = render(<FinalLoading onComplete={onCompleteMock} />);
    
    expect(getByText('Take a deep breath. We are preparing your safe space...')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(2000);
    });
    
    expect(getByText('Crafting activities for you...')).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(onCompleteMock).toHaveBeenCalledTimes(1);
  });
});