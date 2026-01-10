import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Image } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4A665E',
        tabBarInactiveTintColor: '#9BA3A1',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#F0F2EB',
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          elevation: 0,
        },
        tabBarLabelStyle: {
          fontFamily: 'Nunito-SemiBold',
          fontSize: 12,
        },
      }}
    >
      {/* Home com o logo da Nidush */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Image
              source={require('../../assets/images/Logo.png')}
              style={{ width: 26, height: 26, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />

      {/* Activities */}
      <Tabs.Screen
        name="Activities"
        options={{
          title: 'Activities',
          tabBarIcon: ({ color }) => (
            <Image
              source={require('../../assets/navbar/spa.png')}
              style={{ width: 26, height: 26, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />

      {/* Routines */}
      <Tabs.Screen
        name="Routines"
        options={{
          title: 'Routines',
          tabBarIcon: ({ color }) => (
            <Image
              source={require('../../assets/navbar/routine.png')}
              style={{ width: 26, height: 26, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />

      {/* Rooms */}
      <Tabs.Screen
        name="Rooms"
        options={{
          title: 'Rooms',
          tabBarIcon: ({ color }) => (
            <Image
              source={require('../../assets/navbar/auto_awesome_mosaic.png')}
              style={{ width: 26, height: 26, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
}
