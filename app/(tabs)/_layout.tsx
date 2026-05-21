import { Tabs } from 'expo-router';
import React from 'react';
import { Image, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Nunito_600SemiBold,
  Nunito_700Bold,
  useFonts,
} from '@expo-google-fonts/nunito';

import { Icons } from '../../assets/assets';
import LogoIcon from '../../assets/images/Logo.png';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const [fontsLoaded] = useFonts({
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  const TabLabel = ({
    children,
    color,
    focused,
  }: {
    children: string;
    color: string;
    focused: boolean;
  }) => (
    <Text
      maxFontSizeMultiplier={1.2}
      style={{
        color,
        fontSize: 12,
        fontFamily: focused ? 'Nunito_700Bold' : 'Nunito_600SemiBold',
        textAlign: 'center',
      }}
    >
      {children}
    </Text>
  );

  if (!fontsLoaded) return null;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#548F53',
        tabBarInactiveTintColor: '#354F52',
        tabBarStyle: {
          backgroundColor: '#F0F2EB',
          borderTopWidth: 0,
          height: 60 + insets.bottom,
          paddingBottom: 10 + insets.bottom,
          paddingTop: 10,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarLabel: ({ color, focused }) => (
            <TabLabel color={color} focused={focused}>Home</TabLabel>
          ),
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
          tabBarLabel: ({ color, focused }) => (
            <TabLabel color={color} focused={focused}>Activities</TabLabel>
          ),
          tabBarIcon: ({ color }) => (
            <Icons.SpaIcon width={26} height={26} fill={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Routines"
        options={{
          tabBarLabel: ({ color, focused }) => (
            <TabLabel color={color} focused={focused}>Routines</TabLabel>
          ),
          tabBarIcon: ({ color }) => (
            <Icons.RoutineIcon width={26} height={26} fill={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Rooms"
        options={{
          tabBarLabel: ({ color, focused }) => (
            <TabLabel color={color} focused={focused}>Rooms</TabLabel>
          ),
          tabBarIcon: ({ color }) => (
            <Icons.RoomsIcon width={26} height={26} fill={color} />
          ),
        }}
      />
    </Tabs>
  );
}
