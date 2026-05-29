import React from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import SignUp from '../app/signup';
import { LEGAL_CONSENT_KEY } from '../components/legal/LegalContent';

const mockReplace = jest.fn();
const mockPush = jest.fn();
const mockSignUp = jest.fn();
const mockInvokeFunction = jest.fn();
const mockApiLog = jest.fn();

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@expo-google-fonts/nunito', () => ({
  useFonts: () => [true],
  Nunito_400Regular: {},
  Nunito_600SemiBold: {},
  Nunito_700Bold: {},
}));

jest.mock('expo-router', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: mockReplace,
  }),
}));

jest.mock('../utils/supabase', () => ({
  supabase: {
    auth: {
      signUp: (...args) => mockSignUp(...args),
    },
  },
  invokeFunction: (...args) => mockInvokeFunction(...args),
  apiLog: (...args) => mockApiLog(...args),
}));

describe('SignUp Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.setItem(LEGAL_CONSENT_KEY, 'accepted');
    mockSignUp.mockResolvedValue({ error: null });
    mockInvokeFunction.mockResolvedValue({ ok: true });
  });

  it('shows an error when required fields are missing', async () => {
    const { getByText, findByText } = render(<SignUp />);

    fireEvent.press(getByText('Join Nidush'));

    expect(await findByText('Por favor preenche todos os campos.')).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('blocks weak passwords before calling Supabase', async () => {
    const { getByTestId, getByText, findByText } = render(<SignUp />);

    fireEvent.changeText(getByTestId('first-name-input'), 'Laura');
    fireEvent.changeText(getByTestId('last-name-input'), 'Rossi');
    fireEvent.changeText(getByTestId('email-input'), 'laura@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'weakpass');
    fireEvent.press(getByText('Join Nidush'));

    expect(
      await findByText(
        'Password must have at least 12 characters, uppercase and lowercase letters, a number, and one symbol.',
      ),
    ).toBeTruthy();
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('signs up successfully and redirects to login', async () => {
    const { getByTestId, getByText } = render(<SignUp />);

    fireEvent.changeText(getByTestId('first-name-input'), 'Laura');
    fireEvent.changeText(getByTestId('last-name-input'), 'Rossi');
    fireEvent.changeText(getByTestId('email-input'), 'laura@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'StrongPass123!');
    fireEvent.press(getByText('Join Nidush'));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith({
        email: 'laura@example.com',
        password: 'StrongPass123!',
        options: {
          data: {
            first_name: 'Laura',
            last_name: 'Rossi',
          },
        },
      });
    });

    await waitFor(() => {
      expect(mockInvokeFunction).toHaveBeenCalledWith('welcome-user', {
        name: 'Laura',
        email: 'laura@example.com',
      });
    });

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith({
        pathname: '/login',
        params: { registeredEmail: 'laura@example.com' },
      });
    });
  });
});
