import { Tabs } from 'expo-router';
import React from 'react';
import { Image, Text } from 'react-native'; // <-- Já não precisas do Platform aqui
import { useSafeAreaInsets } from 'react-native-safe-area-context'; // <-- 1. Importar o hook

import { Icons } from '../../assets/assets';
import LogoIcon from '../../assets/images/Logo.png';

export default function TabLayout() {
  const insets = useSafeAreaInsets(); // <-- 2. Obter as medidas de segurança do ecrã

  const TabLabel = ({
    children,
    color,
  }: {
    children: string;
    color: string;
  }) => (
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
          // 3. Altura dinâmica: 60px de base + o tamanho exato da barra de sistema
          height: 60 + insets.bottom,
          // 4. Padding dinâmico: 10px de base para o texto respirar + barra de sistema
          paddingBottom: 10 + insets.bottom,
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
          tabBarLabel: ({ color }) => (
            <TabLabel color={color}>Activities</TabLabel>
          ),
          tabBarIcon: ({ color }) => (
            <Icons.SpaIcon width={26} height={26} fill={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Routines"
        options={{
          tabBarLabel: ({ color }) => (
            <TabLabel color={color}>Routines</TabLabel>
          ),
          tabBarIcon: ({ color }) => (
            <Icons.RoutineIcon width={26} height={26} fill={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Rooms"
        options={{
          tabBarLabel: ({ color }) => <TabLabel color={color}>Rooms</TabLabel>,
          tabBarIcon: ({ color }) => (
            <Icons.RoomsIcon width={26} height={26} fill={color} />
          ),
        }}
      />
    </Tabs>
  );
}
