import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, Image, Text } from 'react-native';
import { Icons } from '../../assets/assets';

import LogoIcon from '../../assets/images/Logo.png';

export default function TabLayout() {
  const TabLabel = ({ children, color }: { children: string; color: string }) => (
    <Text
      maxFontSizeMultiplier={1.2}
      style={{
        color,
        fontSize: 12,
        fontFamily: 'Nunito',
        textAlign: 'center',
      }}
    >
      {children}
    </Text>
  );

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#548F53',
        tabBarInactiveTintColor: '#354F52',
        tabBarStyle: {
          backgroundColor: '#F0F2EB',
          borderTopWidth: 0,
          height: 80, 
          paddingBottom: Platform.OS === 'ios' ? 30 : 15,
          paddingTop: 10, 
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: ({ color }) => <TabLabel color={color}>Home</TabLabel>,
          tabBarIcon: ({ color }) => (
            <Image
              source={LogoIcon}
              style={{ width: 26, height: 26, tintColor: color }}
              resizeMode="contain"
              accessible={false}
              importantForAccessibility="no"
            />
          ),
        }}
      />

      <Tabs.Screen
        name="Activities"
        options={{
          tabBarLabel: ({ color }) => <TabLabel color={color}>Activities</TabLabel>,
          tabBarIcon: ({ color }) => <Icons.SpaIcon width={26} height={26} fill={color} />,
        }}
      />

      <Tabs.Screen
        name="Routines"
        options={{
          tabBarLabel: ({ color }) => <TabLabel color={color}>Routines</TabLabel>,
          tabBarIcon: ({ color }) => <Icons.RoutineIcon width={26} height={26} fill={color} />,
        }}
      />

      <Tabs.Screen
        name="Rooms"
        options={{
          tabBarLabel: ({ color }) => <TabLabel color={color}>Rooms</TabLabel>,
          tabBarIcon: ({ color }) => <Icons.RoomsIcon width={26} height={26} fill={color} />,
        }}
      />
    </Tabs>
  );
}