import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  FlatList,
  ScrollView,
  StatusBar,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AddRoomDevice from '../../components/rooms/AddRoomDevice';
import CategoryPill from '../../components/rooms/CategoryPill';
import DeviceCard from '../../components/rooms/device-card';

const ROOMS_DATA = [
  { id: 1, name: 'Bedroom' },
  { id: 2, name: 'Living Room' },
  { id: 3, name: 'Kitchen' },
  { id: 4, name: 'Bathroom' },
];

const INITIAL_DEVICES = [
  {
    id: 1,
    name: 'Bedroom Lights',
    type: 'light',
    status: 'Off',
    level: 100,
    roomId: 1,
  },
  {
    id: 2,
    name: 'Speakers',
    type: 'speaker',
    status: 'Off',
    level: 50,
    roomId: 1,
  },
  {
    id: 3,
    name: 'Difuser',
    type: 'difuser',
    status: 'Off',
    level: 0,
    roomId: 1,
  },
  {
    id: 4,
    name: 'Air Purifier',
    type: 'purifier',
    status: 'Off',
    level: 0,
    roomId: 1,
  },
  {
    id: 5,
    name: 'Living Room Lights',
    type: 'light',
    status: 'Off',
    level: 100,
    roomId: 2,
  },
];

export default function Rooms() {
  const [activeRoom, setActiveRoom] = useState(1);
  const [devices, setDevices] = useState(INITIAL_DEVICES);

  const toggleDevice = (id) => {
    setDevices((current) =>
      current.map((d) =>
        d.id === id ? { ...d, status: d.status === 'On' ? 'Off' : 'On' } : d,
      ),
    );
  };

  const updateDeviceLevel = (id, newLevel) => {
    setDevices((current) =>
      current.map((d) => (d.id === id ? { ...d, level: newLevel } : d)),
    );
  };

  const filteredDevices = devices.filter(
    (device) => device.roomId === activeRoom,
  );

  const menuActions = [
    {
      label: 'Device',
    },
    {
      label: 'Room',
    },
  ];
  return (
    <SafeAreaView className="flex-1 bg-[#F1F3EA]" edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#F2F5F0" />

      {/* Header */}
      <View className="items-center mt-2 mb-6">
        <Text
          className="text-3xl font-semibold text-[#354F52]"
          style={{ fontFamily: 'Nunito_600SemiBold' }}
        >
          Rooms
        </Text>
      </View>

      <View className="px-5 mb-6">
        <View className="flex-row items-center justify-center border border-[#BDC7C2] rounded-full px-4 h-12 bg-transparent">
          <MaterialIcons
            name="search"
            size={24}
            color="#7A8C85"
            style={{ marginRight: 10 }}
          />
          <TextInput
            placeholder="Search..."
            placeholderTextColor="#7A8C85"
            className="flex-1 h-full text-base text-[#2C3A35]"
            style={{
              fontFamily: 'Nunito_600SemiBold',
              paddingVertical: 0,
            }}
            textAlignVertical="center"
          />
        </View>
      </View>
      <View className="h-10 mb-9 flex justify-center items-center">
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20 }}
        >
          {ROOMS_DATA.map((room) => (
            <CategoryPill
              key={room.id}
              item={room}
              isActive={activeRoom === room.id}
              onPress={setActiveRoom}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        data={filteredDevices}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <DeviceCard
            item={item}
            onToggle={() => toggleDevice(item.id)}
            onUpdateLevel={(newLevel) => updateDeviceLevel(item.id, newLevel)}
          />
        )}
        numColumns={2}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center mt-36 justify-center">
            <MaterialCommunityIcons
              name="home-plus"
              size={80}
              color="#354F52"
            />
            <Text
              className="text-[#7A8C85] mt-5 text-lg"
              style={{ fontFamily: 'Nunito_600SemiBold' }}
            >
              Your devices will live here.
            </Text>
          </View>
        }
      />
      <AddRoomDevice actions={menuActions} />
    </SafeAreaView>
  );
}
