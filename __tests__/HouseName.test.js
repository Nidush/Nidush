import { render, fireEvent } from '@testing-library/react-native';
import HouseName from '../components/Onboarding/HouseName';

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('react-native/Libraries/Image/RelativeImageStub', () => 'RelativeImageStub');

jest.mock('@expo-google-fonts/nunito', () => ({
  useFonts: () => [true],
  Nunito_400Regular: 'Nunito_400Regular',
  Nunito_600SemiBold: 'Nunito_600SemiBold',
  Nunito_700Bold: 'Nunito_700Bold',
}));

describe('HouseName', () => {
  test('onNext é chamado ao clicar no botão', () => {
    const onNextMock = jest.fn();
    
    const { getByText } = render(<HouseName onNext={onNextMock} />);
    
    const button = getByText('Create my home');
    fireEvent.press(button);
    
    expect(onNextMock).toHaveBeenCalledTimes(1);
  });
});