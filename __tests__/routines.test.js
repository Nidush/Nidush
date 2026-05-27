import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';

import Routines from '../app/(tabs)/Routines';

const mockGetUser = jest.fn();
const mockRoutineInsertSingle = jest.fn();
const mockScenarioMaybeSingle = jest.fn();

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
  };
});

jest.mock('expo-router', () => ({
  useFocusEffect: (callback) => {
    const React = require('react');
    React.useEffect(() => {
      const cleanup = callback();
      return typeof cleanup === 'function' ? cleanup : undefined;
    }, [callback]);
  },
}));

jest.mock('../components/rooms/AddRoomDevice', () => (props) => {
  const React = require('react');
  const { TouchableOpacity, Text } = require('react-native');
  return (
    <TouchableOpacity
      testID="open-add-routine-button"
      onPress={() => props.actions[0].onPress()}
    >
      <Text>Open add routine</Text>
    </TouchableOpacity>
  );
});

jest.mock('../components/routines/RoutineCard', () => (props) => {
  const React = require('react');
  const { Text, TouchableOpacity } = require('react-native');
  return (
    <TouchableOpacity onPress={props.onPress}>
      <Text>{props.title}</Text>
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
              order: jest.fn(async () => ({
                data: [{ id: 12, name: 'Kitchen' }],
                error: null,
              })),
            })),
          })),
        };
      }

      if (table === 'routines') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                range: jest.fn(async () => ({
                  data: [],
                  error: null,
                  count: 0,
                })),
              })),
            })),
          })),
          insert: jest.fn(() => ({
            select: jest.fn(() => ({
              single: (...args) => mockRoutineInsertSingle(...args),
            })),
          })),
          update: jest.fn(() => ({
            eq: jest.fn(async () => ({ error: null })),
          })),
          delete: jest.fn(() => ({
            eq: jest.fn(async () => ({ error: null })),
          })),
        };
      }

      if (table === 'scenarios') {
        return {
          select: jest.fn(() => ({
            eq: jest.fn(() => ({
              order: jest.fn(() => ({
                limit: jest.fn(() => ({
                  maybeSingle: (...args) => mockScenarioMaybeSingle(...args),
                })),
              })),
            })),
          })),
          insert: jest.fn(),
        };
      }

      return {};
    }),
  },
}));

describe('Routines Screen', () => {
  let consoleErrorSpy;

  beforeEach(() => {
    jest.clearAllMocks();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGetUser.mockResolvedValue({
      data: {
        user: {
          id: 'user-123',
        },
      },
    });
    mockScenarioMaybeSingle.mockResolvedValue({
      data: { id: 55 },
      error: null,
    });
    mockRoutineInsertSingle.mockResolvedValue({
      data: {
        id: 99,
        name: 'Morning Kitchen Prep',
        execution_time: '07:30:00',
        days_of_week: 'Mon,Tue,Wed,Thu,Fri',
        is_active: true,
        image: 'sunrise_awakening',
      },
      error: null,
    });
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    jest.restoreAllMocks();
  });

  const openRoutineModal = async (screen) => {
    await waitFor(() => {
      expect(mockGetUser).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByTestId('open-add-routine-button'));

    await screen.findByText('Add Routine');
  };

  it('shows a validation alert when saving a routine without a name', async () => {
    const screen = render(<Routines />);

    await openRoutineModal(screen);
    fireEvent.press(await screen.findByText('Save Routine'));

    expect(await screen.findByText('Give your routine a name first.')).toBeTruthy();
  });

  it('creates a routine successfully with the default selections', async () => {
    const screen = render(<Routines />);

    await openRoutineModal(screen);
    fireEvent.changeText(
      screen.getByPlaceholderText('e.g. Morning Kitchen Prep'),
      'Morning Kitchen Prep',
    );
    fireEvent.press(await screen.findByText('Save Routine'));

    await waitFor(() => {
      expect(mockRoutineInsertSingle).toHaveBeenCalled();
    });

    const insertCall = mockRoutineInsertSingle.mock.calls[0];
    expect(insertCall).toBeTruthy();

    expect(await screen.findByText('Morning Kitchen Prep')).toBeTruthy();
  });
});
