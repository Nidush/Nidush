import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Image } from 'react-native';
import { Icons } from '../../assets/navbar/assets';

import LogoIcon from '../../assets/images/Logo.png';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4A665E',
        tabBarInactiveTintColor: '#9BA3A1',
        tabBarStyle: {
          backgroundColor: '#F0F2EB',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Nunito-SemiBold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Image
              source={LogoIcon}
              style={{ width: 26, height: 26, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="Activities"
        options={{
          title: 'Activities',
          tabBarIcon: ({ color }) => <Icons.SpaIcon width={26} height={26} fill={color} />,
        }}
      />

      <Tabs.Screen
        name="Routines"
        options={{
          title: 'Routines',
          tabBarIcon: ({ color }) => <Icons.RoutineIcon width={26} height={26} fill={color} />,
        }}
      />

      <Tabs.Screen
        name="Rooms"
        options={{
          title: 'Rooms',
          tabBarIcon: ({ color }) => <Icons.RoomsIcon width={26} height={26} fill={color} />,
        }}
      />
    </Tabs>
  );
}
