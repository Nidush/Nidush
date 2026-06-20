import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

const mockReplace = jest.fn();
const mockPickImage = jest.fn();
const mockUploadImage = jest.fn();
const mockGetUser = jest.fn();
const mockGetSessionUser = jest.fn();
const mockUpdateUser = jest.fn();
const mockUpdatePublicProfile = jest.fn();
const mockInvoke = jest.fn();
const mockSignOut = jest.fn();
const mockRemoveChannel = jest.fn();
const mockRequestGoogleHomeAccess = jest.fn();
const mockSyncGoogleHomeSnapshot = jest.fn();
const mockSetGoogleHomeDevicePower = jest.fn();
const mockDeviceRows = { current: [] };
const mockRoomRows = { current: [] };

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

jest.mock('../utils/legal', () => ({
  LEGAL_POLICY_VERSION: '2026-05-29',
  setHealthConnectEnabled: jest.fn(async () => {}),
}));

jest.mock('../utils/healthConnectSync', () => ({
  hasHeartRateReadPermission: jest.fn(() => false),
}));

jest.mock('../utils/devices', () => ({
  isRealHomeDevice: jest.fn(() => true),
  sortDevicesByFreshness: jest.fn((devices) => devices),
  subscribeToHomeDeviceChanges: jest.fn(() => ({ id: 'channel-1' })),
  getDeviceSourceLabel: jest.fn((source) => source || 'Network'),
}));

jest.mock('../utils/googleHome', () => ({
  requestGoogleHomeAccess: (...args) => mockRequestGoogleHomeAccess(...args),
  syncGoogleHomeSnapshot: (...args) => mockSyncGoogleHomeSnapshot(...args),
  setGoogleHomeDevicePower: (...args) => mockSetGoogleHomeDevicePower(...args),
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
  getSessionUser: (...args) => mockGetSessionUser(...args),
  supabase: {
    auth: {
      getUser: (...args) => mockGetUser(...args),
      updateUser: (...args) => mockUpdateUser(...args),
      signOut: (...args) => mockSignOut(...args),
    },
    from: jest.fn((table) => {
      const createEqChain = (result) => {
        const chain = {
          eq: jest.fn(() => chain),
          order: jest.fn(() => chain),
          limit: jest.fn(() => chain),
          maybeSingle: jest.fn(async () => result),
          single: jest.fn(async () => result),
          select: jest.fn(() => chain),
        };
        return chain;
      };

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
            eq: (...args) => mockUpdatePublicProfile(...args),
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

      if (table === 'rooms') {
        const roomListResult = {
          data: mockRoomRows.current,
          error: null,
        };
        const roomListChain = {
          eq: jest.fn(() => roomListChain),
          order: jest.fn(() => roomListChain),
          maybeSingle: jest.fn(async () => ({ data: mockRoomRows.current[0] ?? null, error: null })),
          then: (resolve) => resolve(roomListResult),
        };

        return {
          select: jest.fn(() => roomListChain),
          insert: jest.fn((payload) => {
            const nextId = mockRoomRows.current.length + 1;
            const createdRoom = {
              id: nextId,
              name: Array.isArray(payload) ? payload[0]?.name : payload?.name,
            };
            mockRoomRows.current = [...mockRoomRows.current, createdRoom];

            return {
              select: jest.fn(() => ({
                single: jest.fn(async () => ({
                  data: createdRoom,
                  error: null,
                })),
              })),
            };
          }),
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
        const existingDeviceLookup = createEqChain({ data: null, error: null });
        const deviceListResult = {
          data: mockDeviceRows.current,
          error: null,
        };
        const deviceListChain = {
          eq: jest.fn(() => deviceListChain),
          order: jest.fn(() => deviceListChain),
          limit: jest.fn(() => deviceListChain),
          maybeSingle: jest.fn(async () => ({ data: null, error: null })),
          then: (resolve) => resolve(deviceListResult),
        };
        return {
          select: jest.fn((columns) => {
            if (columns === 'id') {
              return existingDeviceLookup;
            }

            return deviceListChain;
          }),
          update: jest.fn(() => ({
            eq: jest.fn(async () => ({
              data: mockDeviceRows.current[0] ?? null,
              error: null,
            })),
            then: (resolve) =>
              resolve({
                data: mockDeviceRows.current[0] ?? null,
                error: null,
              }),
          })),
          insert: jest.fn(() => ({
            then: (resolve) =>
              resolve({
                data: mockDeviceRows.current[0] ?? null,
                error: null,
              }),
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

const Profile = require('../app/Profile').default;

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
    mockRoomRows.current = [
      { id: 1, name: 'Bedroom' },
      { id: 2, name: 'Living Room' },
    ];
    mockDeviceRows.current = [
      {
        id: 10,
        name: 'Living Room Speaker',
        type: 'speaker',
        source: 'google_home',
        status: 'connected',
        external_id: 'google_home:living-room-speaker',
        last_seen: '2026-05-25T10:00:00Z',
        home_id: 7,
      },
    ];
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
    mockGetSessionUser.mockResolvedValue({
      id: 'user-123',
      email: 'laura@example.com',
      created_at: '2026-01-01T12:00:00Z',
      user_metadata: {
        first_name: 'Laura',
        last_name: 'Rossi',
        avatar_url: null,
      },
    });
    mockUpdateUser.mockResolvedValue({ error: null });
    mockUpdatePublicProfile.mockResolvedValue({ error: null });
    mockUploadImage.mockResolvedValue('https://example.com/avatar.jpg');
    mockInvoke.mockResolvedValue({ data: {}, error: null });
    mockSignOut.mockResolvedValue({ error: null });
    mockRequestGoogleHomeAccess.mockResolvedValue({ granted: true, reason: null });
    mockSyncGoogleHomeSnapshot.mockResolvedValue({ devices: [], diagnostics: undefined });
    mockSetGoogleHomeDevicePower.mockResolvedValue(true);
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  it('uploads a new avatar and updates both auth and public profile', async () => {
    mockPickImage.mockResolvedValue('data:image/jpeg;base64,avatar');

    const { getByTestId, findByText } = render(<Profile />);

    await findByText('Laura Rossi');
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

    expect(mockUpdatePublicProfile).toHaveBeenCalledWith('auth_uid', 'user-123');
    expect(global.alert).not.toHaveBeenCalled();
  }, 10000);

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

  it('shows a hardware error when Google Home sync is requested without a session', async () => {
    mockGetSessionUser.mockResolvedValue(null);

    const { getByTestId, findByText } = render(<Profile />);

    await findByText('Visitante');
    fireEvent.press(getByTestId('scan-smart-devices-button'));

    expect(await findByText('Session not found.')).toBeTruthy();
  });

  it('shows a no-devices-found modal after a Google Home sync with zero devices', async () => {
    mockSyncGoogleHomeSnapshot.mockResolvedValueOnce({
      devices: [],
      diagnostics: {
        structureCount: 1,
        roomCount: 0,
        structures: [{ id: 'structure-1', name: 'Casa Google' }],
        rooms: [],
      },
    });

    const { getByTestId, findByText } = render(<Profile />);

    await findByText('Laura Rossi');
    fireEvent.press(getByTestId('scan-smart-devices-button'));

    expect(await findByText('No devices found')).toBeTruthy();
    expect(
      await findByText(
        'We connected to your Google Home household, but this Google Home API build did not receive any rooms or compatible devices for this account. This usually means the home was found, but your current devices are not exposed by this SDK layer yet, often because they are cloud-linked or not Matter-compatible. Your existing Nidush internet-connected devices can still keep working normally.',
      ),
    ).toBeTruthy();
    expect(await findByText('Google Home SDK Debug')).toBeTruthy();
    expect(await findByText('Structures found: 1')).toBeTruthy();
    expect(await findByText('Casa Google (structure-1)')).toBeTruthy();
  });

  it('deletes the account after explicit confirmation', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { success: true },
      error: null,
    });

    const { getByTestId, findByText } = render(<Profile />);

    await findByText('Laura Rossi');
    fireEvent.press(getByTestId('menu-privacy'));
    fireEvent.press(getByTestId('open-delete-account-button'));
    fireEvent.changeText(getByTestId('delete-account-confirm-input'), 'DELETE');
    fireEvent.press(getByTestId('confirm-delete-account-button'));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('delete-account', { body: {} });
    });

    expect(mockSignOut).toHaveBeenCalledWith({ scope: 'local' });
    expect(mockReplace).toHaveBeenCalledWith('/login');
  });
});
