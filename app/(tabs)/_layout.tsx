import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { HapticTab } from '@/components/HapticTab';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#392de9',
        tabBarInactiveTintColor: '#A0A0B2',
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          backgroundColor: '#161622',
          borderTopColor: '#2A2A3C',
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Gerador',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons size={size || 26} name="vpn-key" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="passwords"
        options={{
          title: 'Minhas Senhas',
          tabBarIcon: ({ color, size }) => (
            <MaterialIcons size={size || 26} name="lock" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
