import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';//  Tenho que meter o Ionicons do MaterialIcons da Google

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#4A665E', 
        tabBarInactiveTintColor: '#9BA3A1',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#F1F4E9', 
          borderTopWidth: 0,
          height: Platform.OS === 'ios' ? 90 : 70,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          elevation: 0, 
        },
        tabBarLabelStyle: {
          fontFamily: 'Nunito-SemiBold',
          fontSize: 12,
        },
      }}>
      
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "home" : "home-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Activities"
        options={{
          title: 'Activities',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "leaf" : "leaf-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Routines"
        options={{
          title: 'Routines',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "sunny" : "sunny-outline"} size={24} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="Rooms"
        options={{
          title: 'Rooms',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? "grid" : "grid-outline"} size={24} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
