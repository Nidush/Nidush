import { render } from '@testing-library/react-native';
import { Platform } from 'react-native';
import TabLayout from '../app/(tabs)/_layout';

const mockScreenCapture = jest.fn();

jest.mock('expo-router', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    Tabs: Object.assign(
      ({ children }) => <View>{children}</View>,
      {
        Screen: (props) => {
          mockScreenCapture(props);
          return null;
        },
      }
    ),
  };
});

jest.mock('../assets/assets', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    Icons: {
      SpaIcon: () => <View testID="spa-icon" />,
      RoutineIcon: () => <View testID="routine-icon" />,
      RoomsIcon: () => <View testID="rooms-icon" />,
    },
  };
});

jest.mock('../assets/images/Logo.png', () => 1);

describe('TabLayout Full Coverage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('deve cobrir estilos de iOS', () => {
    Platform.OS = 'ios';
    render(<TabLayout />);

    mockScreenCapture.mock.calls.forEach((call) => {
      const { options } = call[0];
      if (options?.tabBarIcon) render(options.tabBarIcon({ color: '#000' }));
    });
  });

  it('deve cobrir estilos de Android', () => {
    Platform.OS = 'android';
    render(<TabLayout />);
    expect(mockScreenCapture).toHaveBeenCalled();
  });
});
