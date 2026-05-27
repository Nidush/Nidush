import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import Profile from '../app/Profile';

const mockReplace = jest.fn();
const mockPickImage = jest.fn();
const mockUploadImage = jest.fn();
const mockGetUser = jest.fn();
const mockUpdateUser = jest.fn();
const mockInvoke = jest.fn();
const mockRemoveChannel = jest.fn();
const mockDeviceRows = { current: [] };
const mockDiscoveryRequestRow = { current: { data: null, error: null } };

jest.mock('@expo-google-fonts/nunito', () => ({
  useFonts: () => [true],
  Nunito_400Regular: {},
  Nunito_600SemiBold: {},
  Nunito_700Bold: {},
}));

jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    MaterialIcons: ({ name }) => <Text>{name}</Text>,
    MaterialCommunityIcons: ({ name }) => <Text>{name}</Text>,
  };
});

jest.mock('expo-router', () => ({
  useRouter: () => ({
    replace: mockReplace,
    push: jest.fn(),
  }),
}));

jest.mock('../utils/imagePicker', () => ({
  pickImage: (...args) => mockPickImage(...args),
}));

jest.mock('../context/SpotifyContext', () => ({
  useSpotify: () => ({
    isAuthenticated: false,
    login: jest.fn(),
    logout: jest.fn(),
    userProfile: null,
  }),
}));

jest.mock('../context/NotificationsContext', () => ({
  useNotifications: () => ({
    unreadCount: 0,
    markAllAsRead: jest.fn(),
    refreshNotifications: jest.fn(),
    notificationsEnabled: true,
    setNotificationsEnabled: jest.fn(),
  }),
}));

jest.mock('../context/BiometricsContext', () => ({
  useBiometrics: () => ({
    data: null,
  }),
}));

jest.mock('../components/legal/LegalContent', () => ({
  LegalContent: () => null,
}));

jest.mock('../utils/healthConnectSync', () => ({
  hasHeartRateReadPermission: jest.fn(() => false),
}));

jest.mock('../utils/devices', () => ({
  isRealHomeDevice: jest.fn(() => true),
  sortDevicesByFreshness: jest.fn((devices) => devices),
  subscribeToHomeDeviceChanges: jest.fn(() => ({ id: 'channel-1' })),
}));

jest.mock('react-native-health-connect', () => ({
  getGrantedPermissions: jest.fn(async () => []),
  getSdkStatus: jest.fn(async () => 'unavailable'),
  SdkAvailabilityStatus: {
    SDK_AVAILABLE: 'available',
  },
  initialize: jest.fn(async () => true),
  openHealthConnectDataManagement: jest.fn(),
  openHealthConnectSettings: jest.fn(),
}));

jest.mock('../utils/supabase', () => ({
  uploadImage: (...args) => mockUploadImage(...args),
  supabase: {
    auth: {
      getUser: (...args) => mockGetUser(...args),
      updateUser: (...args) => mockUpdateUser(...args),
      signOut: jest.fn(),
    },
    from: jest.fn((table) => {
      if (table === 'users') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn(async () => ({
                data: { hobbies: 'Cooking,Meditation', created_at: '2026-01-01T12:00:00Z' },
                error: null,
              })),
            })),
          })),
          update: jest.fn(() => ({
            eq: jest.fn(async () => ({ error: null })),
          })),
          upsert: jest.fn(),
        };
      }

      if (table === 'user_homes') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => ({
                  maybeSingle: jest.fn(async () => ({
                    data: { home_id: 7, role: 'admin', created_at: '2026-01-01T12:00:00Z' },
                    error: null,
                  })),
                })),
              })),
            })),
          })),
        };
      }

      if (table === 'homes') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn(async () => ({
                data: { name: 'Casa Serena', join_code: 'ABC123' },
                error: null,
              })),
            })),
          })),
        };
      }

      if (table === 'activities') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(async () => ({ count: 3, error: null })),
          })),
        };
      }

      if (table === 'shortcuts') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(async () => ({ count: 2, error: null })),
          })),
        };
      }

      if (table === 'devices') {
        return {
          select: jest.fn(() => ({
            order: jest.fn(() => ({
              eq: jest.fn(async () => ({
                data: mockDeviceRows.current,
                error: null,
              })),
            })),
          })),
        };
      }

      if (table === 'device_discovery_requests') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                maybeSingle: jest.fn(async () => mockDiscoveryRequestRow.current),
              })),
            })),
          })),
        };
      }

      return {};
    }),
    functions: {
      invoke: (...args) => mockInvoke(...args),
    },
    removeChannel: (...args) => mockRemoveChannel(...args),
  },
}));

describe('Profile Screen', () => {
  let consoleErrorSpy;
  let consoleLogSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    global.alert = jest.fn();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    mockDeviceRows.current = [
      {
        id: 10,
        name: 'Living Room Speaker',
        type: 'speaker',
        source: 'network',
        status: 'connected',
        external_id: 'network:living-room-speaker',
        last_seen: '2026-05-25T10:00:00Z',
        home_id: 7,
      },
    ];
    mockDiscoveryRequestRow.current = { data: null, error: null };
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
          email: 'laura@example.com',
          created_at: '2026-01-01T12:00:00Z',
          user_metadata: {
            first_name: 'Laura',
            last_name: 'Rossi',
            avatar_url: null,
          },
        },
      },
    });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockUploadImage.mockResolvedValue('https://example.com/avatar.jpg');
    mockInvoke.mockResolvedValue({ data: {}, error: null });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('uploads a new avatar and updates both auth and public profile', async () => {
    mockPickImage.mockResolvedValue('data:image/jpeg;base64,avatar');

    const { getByTestId, findByText } = render(<Profile />);

    expect(await findByText('Laura Rossi')).toBeTruthy();

    fireEvent.press(getByTestId('avatar-picker-button'));

    await waitFor(() => {
      expect(mockUploadImage).toHaveBeenCalledWith(
        'data:image/jpeg;base64,avatar',
        'avatars',
        expect.stringMatching(/^user-123\/\d+\.jpg$/),
      );
    });

    expect(mockUpdateUser).toHaveBeenCalledWith({
      data: { avatar_url: 'https://example.com/avatar.jpg' },
    });

    expect(mockUpdateUser).toHaveBeenCalledWith({
      data: { avatar_url: 'https://example.com/avatar.jpg' },
    });
    expect(global.alert).not.toHaveBeenCalled();
  });

  it('shows an error when avatar upload fails', async () => {
    mockPickImage.mockResolvedValue('data:image/jpeg;base64,avatar');
    mockUploadImage.mockResolvedValueOnce(null);

    const { getByTestId, findByText } = render(<Profile />);

    await findByText('Laura Rossi');
    fireEvent.press(getByTestId('avatar-picker-button'));

    await waitFor(() => {
      expect(mockUploadImage).toHaveBeenCalled();
    });

    expect(mockUpdateUser).not.toHaveBeenCalled();
    expect(global.alert).not.toHaveBeenCalled();
  });

  it('shows a hardware error when smart-device scan is requested without a session', async () => {
    mockGetUser
      .mockResolvedValueOnce({
        data: {
          user: {
            id: 'user-123',
            email: 'laura@example.com',
            created_at: '2026-01-01T12:00:00Z',
            user_metadata: {
              first_name: 'Laura',
              last_name: 'Rossi',
              avatar_url: null,
            },
          },
        },
      })
      .mockResolvedValueOnce({ data: { user: null } });

    const { getByTestId, findByText } = render(<Profile />);

    await findByText('Laura Rossi');
    fireEvent.press(getByTestId('scan-smart-devices-button'));

    expect(await findByText('Session not found.')).toBeTruthy();
  });

  it('shows a no-devices-found modal after a completed scan with zero discoveries', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { request: { id: 15, status: 'pending' } },
      error: null,
    });
    mockDiscoveryRequestRow.current = {
      data: {
        status: 'completed',
        error_message: null,
        result: { discovered: 0 },
      },
      error: null,
    };

    const { getByTestId, findByText } = render(<Profile />);

    await findByText('Laura Rossi');
    fireEvent.press(getByTestId('scan-smart-devices-button'));

    expect(await findByText('No devices found')).toBeTruthy();
    expect(
      await findByText(
        'We scanned your home network but did not find any compatible smart devices this time. Make sure the devices are turned on and connected to the same Wi-Fi, then try again.',
      ),
    ).toBeTruthy();
  });
});
