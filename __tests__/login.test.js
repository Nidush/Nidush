import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import Login from '../app/login';

const mockPush = jest.fn();
const mockReplace = jest.fn();
const mockSignInWithPassword = jest.fn();
const mockMaybeSingle = jest.fn();
const mockApiLog = jest.fn();
const mockUseLocalSearchParams = jest.fn(() => ({
  registeredEmail: '',
}));

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    MaterialIcons: ({ name }) => <Text>{name}</Text>,
  };
});

jest.mock('../components/UI/VerificationModal', () => () => null);

jest.mock('../utils/supabase', () => ({
  supabase: {
    auth: {
      signInWithPassword: (...args) => mockSignInWithPassword(...args),
      getUser: jest.fn(),
    },
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          order: jest.fn(() => ({
            limit: jest.fn(() => ({
              maybeSingle: (...args) => mockMaybeSingle(...args),
            })),
          })),
        })),
      })),
    })),
  },
  apiLog: (...args) => mockApiLog(...args),
}));

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
  useLocalSearchParams: () => mockUseLocalSearchParams(),
}));

describe('Login Screen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    mockUseLocalSearchParams.mockReturnValue({ registeredEmail: '' });
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: 'user-123' } },
      error: null,
    });
    mockMaybeSingle.mockResolvedValue({ data: { home_id: 99 }, error: null });
  });

  it('renders correctly', () => {
    const { getByText } = render(<Login />);
    expect(getByText('Welcome Back')).toBeTruthy();
  });

  it('shows an error when email or password is missing', async () => {
    const { getByTestId, findByText } = render(<Login />);

    fireEvent.press(getByTestId('login-button'));

    expect(
      await findByText('Por favor preenche o email e a password.'),
    ).toBeTruthy();
    expect(mockSignInWithPassword).not.toHaveBeenCalled();
  });

  it('logs in users with a home and redirects to tabs', async () => {
    const { getByTestId } = render(<Login />);

    fireEvent.changeText(getByTestId('email-input'), 'laura@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'StrongPass123!');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(mockSignInWithPassword).toHaveBeenCalledWith({
        email: 'laura@example.com',
        password: 'StrongPass123!',
      });
    });

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@viewedOnboarding',
        'true',
      );
    });

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  it('redirects users without a home to setup-profile', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: null, error: null });

    const { getByTestId } = render(<Login />);

    fireEvent.changeText(getByTestId('email-input'), 'laura@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'StrongPass123!');
    fireEvent.press(getByTestId('login-button'));

    await waitFor(() => {
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@onboarding_progress');
    });

    expect(mockReplace).toHaveBeenCalledWith('/setup-profile');
  });

  it('shows a friendly error when Supabase login fails', async () => {
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    });

    const { getByTestId, findByText } = render(<Login />);

    fireEvent.changeText(getByTestId('email-input'), 'laura@example.com');
    fireEvent.changeText(getByTestId('password-input'), 'WrongPass123!');
    fireEvent.press(getByTestId('login-button'));

    expect(
      await findByText(
        'Email ou senha incorretos. Por favor, verifique os seus dados.',
      ),
    ).toBeTruthy();
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
