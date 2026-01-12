import React from 'react';
import { render, fireEvent, within } from '@testing-library/react-native';
import Rooms from '../app/(tabs)/Rooms'; 
import { SafeAreaProvider } from 'react-native-safe-area-context';

jest.mock('../components/rooms/device-card', () => {
  const { TouchableOpacity, Text, View } = require('react-native');
  return ({ item, onToggle, onUpdateLevel }) => (
    <View testID={`device-card-${item.id}`}>
      <Text>{item.name}</Text>
      <Text>{item.status}</Text>
      <Text>Level: {item.level}</Text>
      
      <TouchableOpacity testID={`button-toggle-${item.id}`} onPress={onToggle}>
        <Text>Toggle</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        testID={`button-level-${item.id}`} 
        onPress={() => onUpdateLevel(75)}
      >
        <Text>Set Level 75</Text>
      </TouchableOpacity>
    </View>
  );
});

jest.mock('../components/rooms/CategoryPill', () => {
  const { TouchableOpacity, Text } = require('react-native');
  return ({ item, isActive, onPress }) => (
    <TouchableOpacity testID={`pill-${item.id}`} onPress={() => onPress(item.id)}>
      <Text>{item.name}</Text>
      {isActive ? <Text>Active</Text> : null}
    </TouchableOpacity>
  );
});

jest.mock('../components/rooms/AddRoomDevice', () => {
  const { View } = require('react-native');
  return () => <View testID="add-device-button" />;
});

jest.mock('@expo/vector-icons', () => ({
  MaterialIcons: 'MaterialIcons',
  MaterialCommunityIcons: 'MaterialCommunityIcons',
}));

describe('Página Rooms - Cobertura Total', () => {
  const renderRooms = () => render(
    <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 0, height: 0 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
      <Rooms />
    </SafeAreaProvider>
  );

  test('deve atualizar o nível do dispositivo (Linhas 80-81)', () => {
    const { getByTestId } = renderRooms();
    
    const deviceCard = getByTestId('device-card-1');
    const levelButton = getByTestId('button-level-1');

    expect(within(deviceCard).getByText('Level: 100')).toBeTruthy();

    fireEvent.press(levelButton);

    expect(within(deviceCard).getByText('Level: 75')).toBeTruthy();
  });

  test('deve filtrar dispositivos e alternar status', () => {
    const { getByText, getByTestId, queryByText } = renderRooms();

    fireEvent.press(getByTestId('pill-2'));
    expect(getByText('Living Room Lights')).toBeTruthy();
    expect(queryByText('Bedroom Lights')).toBeNull();

    const toggleButton = getByTestId('button-toggle-5');
    fireEvent.press(toggleButton);
    expect(within(getByTestId('device-card-5')).getByText('On')).toBeTruthy();
  });

  test('deve renderizar o estado vazio', () => {
    const { getByTestId, getByText } = renderRooms();
    fireEvent.press(getByTestId('pill-4')); 
    expect(getByText('Your devices will live here.')).toBeTruthy();
  });
});