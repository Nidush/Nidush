import { render, fireEvent } from '@testing-library/react-native';
import HouseName from '../components/Onboarding/HouseName';

jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

jest.mock('react-native/Libraries/Image/RelativeImageStub', () => 'RelativeImageStub');

describe('HouseName', () => {
  test('onNext é chamado ao clicar no botão', () => {
    const onNextMock = jest.fn();
    
    const { getByText } = render(<HouseName onNext={onNextMock} />);
    
    // Simula o clique no botão
    const button = getByText('Create my home');
    fireEvent.press(button);
    
    expect(onNextMock).toHaveBeenCalledTimes(1);
  });
});