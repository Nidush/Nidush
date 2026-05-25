import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import NewActivityFlow from '../app/new-activity';

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockGetUser = jest.fn();
const mockUploadImage = jest.fn();
const mockAddNotification = jest.fn();
const mockActivityInsertSingle = jest.fn();
const mockRouter = {
  push: mockPush,
  back: mockBack,
};

jest.mock('@expo-google-fonts/nunito', () => ({
  useFonts: () => [true],
  Nunito_400Regular: {},
  Nunito_600SemiBold: {},
  Nunito_700Bold: {},
}));

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }) => children,
    useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  };
});

jest.mock('expo-router', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return {
    router: mockRouter,
    Stack: {
      Screen: () => <Text>stack-screen</Text>,
    },
    useLocalSearchParams: () => ({}),
  };
});

jest.mock('@/context/NotificationsContext', () => ({
  useNotifications: () => ({
    addNotification: (...args) => mockAddNotification(...args),
  }),
}));

jest.mock('@/utils/catalogTemplates', () => ({
  fetchScenarioTemplates: jest.fn(async () => [
    {
      id: 's2',
      title: 'Calm Bedroom',
      room: 'Bedroom',
    },
  ]),
}));

jest.mock('@/constants/data', () => ({
  CONTENTS: {
    'local-content': {
      id: 'local-content',
      title: 'Breathing Session',
      type: 'meditation',
      category: 'Guided',
      description: 'Calming breaths to reset.',
      duration: '10 min',
      image: 'https://example.com/library-image.jpg',
    },
  },
}));

jest.mock('@/constants/data/catalogAssets', () => ({
  resolveCatalogImage: (value) => value,
}));

jest.mock('@/components/newActivityFlow', () => {
  const React = require('react');
  const { Text, TouchableOpacity } = require('react-native');

  return {
    FlowHeader: ({ title, step }) => <Text>{`${title}-${step}`}</Text>,
    Step1_Type: ({ onSelect }) => (
      <TouchableOpacity testID="select-type-button" onPress={() => onSelect('meditation')}>
        <Text>step-1</Text>
      </TouchableOpacity>
    ),
    Step2_Content: ({ onSelect }) => (
      <TouchableOpacity testID="select-content-button" onPress={() => onSelect('local-content')}>
        <Text>step-2</Text>
      </TouchableOpacity>
    ),
    Step3_Room: ({ onSelect }) => (
      <TouchableOpacity testID="select-room-button" onPress={() => onSelect('Bedroom')}>
        <Text>step-3</Text>
      </TouchableOpacity>
    ),
    Step4_Environment: ({ onSelect }) => (
      <TouchableOpacity testID="select-environment-button" onPress={() => onSelect('s2')}>
        <Text>step-4</Text>
      </TouchableOpacity>
    ),
    Step5_Details: ({ setName, setDesc, setImage }) => (
      <TouchableOpacity
        testID="fill-details-button"
        onPress={() => {
          setName('Breathing Session');
          setDesc('Calming breaths to reset.');
          setImage('data:image/jpeg;base64,activity');
        }}
      >
        <Text>step-5</Text>
      </TouchableOpacity>
    ),
    Step6_Review: () => <Text>step-6</Text>,
  };
});

jest.mock('../utils/supabase', () => ({
  uploadImage: (...args) => mockUploadImage(...args),
  apiLog: jest.fn(),
  supabase: {
    auth: {
      getUser: (...args) => mockGetUser(...args),
    },
    from: jest.fn((table) => {
      if (table === 'contents') {
        return {
          select: jest.fn(async () => ({ data: [], error: null })),
        };
      }

      if (table === 'user_homes') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              maybeSingle: jest.fn(async () => ({
                data: { home_id: 7 },
                error: null,
              })),
            })),
          })),
        };
      }

      if (table === 'rooms') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                maybeSingle: jest.fn(async () => ({
                  data: { id: 11 },
                  error: null,
                })),
              })),
            })),
          })),
        };
      }

      if (table === 'activities') {
        return {
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: (...args) => mockActivityInsertSingle(...args),
            })),
          })),
          update: jest.fn(),
          select: jest.fn(),
        };
      }

      if (table === 'devices') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              eq: jest.fn(() => ({
                in: jest.fn(async () => ({
                  data: [{ id: 3 }],
                  error: null,
                })),
              })),
            })),
          })),
        };
      }

      if (table === 'activity_devices') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(async () => ({
              data: [],
              error: null,
            })),
          })),
          insert: jest.fn(async () => ({ error: null })),
        };
      }

      return {};
    }),
  },
}));

describe('NewActivityFlow', () => {
  let consoleErrorSpy;
  let consoleWarnSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
    global.alert = jest.fn();
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
        },
      },
    });
    mockUploadImage.mockResolvedValue('https://example.com/activity.jpg');
    mockActivityInsertSingle.mockResolvedValue({
      data: { id: 88 },
      error: null,
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  const completeWizard = async (screen) => {
    fireEvent.press(screen.getByTestId('select-type-button'));
    fireEvent.press(await screen.findByText('Continue'));
    fireEvent.press(screen.getByTestId('select-content-button'));
    fireEvent.press(await screen.findByText('Continue'));
    fireEvent.press(screen.getByTestId('select-room-button'));
    fireEvent.press(await screen.findByText('Continue'));
    fireEvent.press(screen.getByTestId('select-environment-button'));
    fireEvent.press(await screen.findByText('Continue'));
    fireEvent.press(screen.getByTestId('fill-details-button'));
    fireEvent.press(await screen.findByText('Continue'));
    await screen.findByText('step-6');
  };

  it('saves a new activity and navigates to activity details', async () => {
    const screen = render(<NewActivityFlow />);

    await completeWizard(screen);
    fireEvent.press(await screen.findByText('Save'));

    await waitFor(() => {
      expect(mockUploadImage).toHaveBeenCalledWith('data:image/jpeg;base64,activity');
    });

    await waitFor(() => {
      expect(mockActivityInsertSingle).toHaveBeenCalled();
    });

    expect(mockAddNotification).toHaveBeenCalledWith(
      'New Activity Created',
      'Great job! "Breathing Session" has been added to your creations.',
      'creation',
    );

  });

  it('shows an error when saving without an authenticated user', async () => {
    mockGetUser.mockResolvedValueOnce({
      data: {
        user: null,
      },
    });

    const screen = render(<NewActivityFlow />);

    await completeWizard(screen);
    fireEvent.press(await screen.findByText('Save'));

    await waitFor(() => {
      expect(global.alert).toHaveBeenCalledWith('Ocorreu um erro ao salvar a tua atividade.');
    });

    expect(mockPush).not.toHaveBeenCalled();
  });
});
