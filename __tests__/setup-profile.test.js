import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { Animated } from 'react-native';

import SetupProfile from '../app/setup-profile';

const mockReplace = jest.fn();
const mockGetUser = jest.fn();
const mockMaybeSingle = jest.fn();
const mockRpc = jest.fn();
const mockInvokeFunction = jest.fn();
const mockHomesInsertSingle = jest.fn();
const mockUsersUpsert = jest.fn();
const mockUserHomesUpsert = jest.fn();
const mockHouseIdValue = { current: '' };
const mockHouseModeValue = { current: 'create' };
const mockSelectedActivitiesValue = { current: ['meditation'] };

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
    replace: mockReplace,
  }),
}));

jest.mock('../components/Onboarding/WelcomeUser', () => (props) => {
  const { Text, TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity testID="welcome-step-button" onPress={props.onFinish}>
      <Text>{`welcome-step:${props.userName}`}</Text>
    </TouchableOpacity>
  );
});

jest.mock('../components/Onboarding/HouseName', () => (props) => {
  const { Text, TouchableOpacity, View } = require('react-native');
  return (
    <View>
      <Text>{`house-step:${props.houseName}|${props.houseId}|${props.homeMode}`}</Text>
      <TouchableOpacity
        testID="house-continue-button"
        onPress={() => {
          props.setHomeMode(mockHouseModeValue.current);
          props.setHouseId(mockHouseIdValue.current);
          props.onNext();
        }}
      >
        <Text>house-continue</Text>
      </TouchableOpacity>
    </View>
  );
});

jest.mock('../components/Onboarding/WearableSync', () => (props) => {
  const { Text, TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity testID="wearable-step-button" onPress={props.onNext}>
      <Text>wearable-step</Text>
    </TouchableOpacity>
  );
});

jest.mock('../components/Onboarding/ConsentStep', () => (props) => {
  const { Text, TouchableOpacity, View } = require('react-native');
  return (
    <View>
      <Text>{`consent-step:${props.badgeText}`}</Text>
      <TouchableOpacity
        testID={`consent-primary-${props.badgeText}`}
        onPress={props.onPrimary}
      >
        <Text>{props.primaryLabel}</Text>
      </TouchableOpacity>
      {props.onSecondary ? (
        <TouchableOpacity
          testID={`consent-secondary-${props.badgeText}`}
          onPress={props.onSecondary}
        >
          <Text>{props.secondaryLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

jest.mock('../components/Onboarding/SpotifyConnect', () => (props) => {
  const { Text, TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity testID="spotify-step-button" onPress={props.onNext}>
      <Text>spotify-step</Text>
    </TouchableOpacity>
  );
});

jest.mock('../components/Onboarding/ActivitySelection', () => (props) => {
  const { Text, TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity
      testID="activities-step-button"
      onPress={() => props.onFinish(mockSelectedActivitiesValue.current)}
    >
      <Text>activities-step</Text>
    </TouchableOpacity>
  );
});

jest.mock('../components/Onboarding/FinalLoading', () => (props) => {
  const { Text } = require('react-native');
  const { TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity testID="loading-step-button" onPress={props.onComplete}>
      <Text>loading-step</Text>
    </TouchableOpacity>
  );
});

jest.mock('../utils/supabase', () => ({
  supabase: {
    auth: {
      getUser: (...args) => mockGetUser(...args),
    },
    from: jest.fn((table) => {
      if (table === 'user_homes') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => ({
                  maybeSingle: (...args) => mockMaybeSingle(...args),
                })),
              })),
            })),
          })),
          upsert: (...args) => mockUserHomesUpsert(...args),
        };
      }

      if (table === 'homes') {
        return {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: (...args) => mockHomesInsertSingle(...args),
            })),
          })),
        };
      }

      if (table === 'users') {
        return {
          upsert: (...args) => mockUsersUpsert(...args),
        };
      }

      return {};
    }),
    rpc: (...args) => mockRpc(...args),
  },
  invokeFunction: (...args) => mockInvokeFunction(...args),
}));

describe('SetupProfile Screen', () => {
  let animatedTimingSpy;
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    AsyncStorage.clear();
    global.alert = jest.fn();
    mockHouseIdValue.current = '';
    mockHouseModeValue.current = 'create';
    mockSelectedActivitiesValue.current = ['meditation'];
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'laura@example.com',
          user_metadata: {
            first_name: 'Laura',
            last_name: 'Rossi',
          },
        },
      },
    });
    mockMaybeSingle.mockResolvedValue({ data: null });
    mockRpc.mockResolvedValue({ data: null, error: null });
    mockInvokeFunction.mockResolvedValue({});
    mockHomesInsertSingle.mockResolvedValue({ data: { id: 77 }, error: null });
    mockUsersUpsert.mockResolvedValue({ error: null });
    mockUserHomesUpsert.mockResolvedValue({ error: null });
    animatedTimingSpy = jest.spyOn(Animated, 'timing').mockImplementation(() => ({
      start: (callback) => callback?.({ finished: true }),
    }));
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation((...args) => {
      if (
        typeof args[0] === 'string' &&
        args[0].includes('not wrapped in act')
      ) {
        return;
      }
    });
  });

  afterEach(() => {
    animatedTimingSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  const renderScreen = () => render(<SetupProfile />);

  it('redirects unauthenticated users to login', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });

    renderScreen();

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith('/login');
    });
  });

  it('bypasses onboarding when the user already belongs to a home', async () => {
    mockMaybeSingle.mockResolvedValueOnce({ data: { home_id: 42 } });

    renderScreen();

    await waitFor(() => {
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@viewedOnboarding', 'true');
    });

    expect(mockReplace).toHaveBeenCalledWith('/(tabs)');
  });

  it('restores saved onboarding progress safely from loading to house step', async () => {
    await AsyncStorage.setItem(
      '@onboarding_progress',
      JSON.stringify({
        step: 'loading',
        data: {
          houseName: 'Casa Serena',
          houseId: 'ABC123',
          homeMode: 'join',
          selectedActivities: ['meditation'],
        },
      }),
    );

    const { findByText } = renderScreen();

    expect(await findByText('house-step:Casa Serena|ABC123|join')).toBeTruthy();
  });

  it('restores the health consent step from saved onboarding progress', async () => {
    await AsyncStorage.setItem(
      '@onboarding_progress',
      JSON.stringify({
        step: 'health-consent',
        data: { homeMode: 'create' },
      }),
    );
    const { findByText } = renderScreen();
    expect(await findByText('consent-step:Health consent')).toBeTruthy();
  });

  it('restores the spotify consent step from saved onboarding progress', async () => {
    await AsyncStorage.setItem(
      '@onboarding_progress',
      JSON.stringify({
        step: 'spotify-consent',
        data: { homeMode: 'create' },
      }),
    );
    const { findByText } = renderScreen();
    expect(await findByText('consent-step:Spotify consent')).toBeTruthy();
  });

  it('restores the app consent step from saved onboarding progress', async () => {
    await AsyncStorage.setItem(
      '@onboarding_progress',
      JSON.stringify({
        step: 'app-consent',
        data: { homeMode: 'create', selectedActivities: ['meditation'] },
      }),
    );
    const { findByText } = renderScreen();
    expect(await findByText('consent-step:Privacy and app consent')).toBeTruthy();
  });

  it('shows health consent before wearable sync in the main flow', async () => {
    const { getByTestId, findByText } = renderScreen();

    fireEvent.press(await findByText('welcome-step:Laura'));
    fireEvent.press(getByTestId('house-continue-button'));

    expect(await findByText('consent-step:Health consent')).toBeTruthy();
  });

  it('shows spotify consent before spotify connect in the main flow', async () => {
    const { getByTestId, findByText, findByTestId } = renderScreen();

    fireEvent.press(await findByText('welcome-step:Laura'));
    fireEvent.press(getByTestId('house-continue-button'));
    fireEvent.press(getByTestId('consent-primary-Health consent'));
    fireEvent.press(await findByTestId('wearable-step-button'));

    expect(await findByText('consent-step:Spotify consent')).toBeTruthy();
  });

});
