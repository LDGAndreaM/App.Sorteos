import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import React from 'react';
import { Text } from 'react-native';

import ProfileScreen from '../screens/ProfileScreen';
import RafflesListScreen from '../screens/RafflesListScreen';
import { colors } from '../theme';
import type { MainTabParamList } from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

function TabIcon({ emoji }: { emoji: string }) {
  return <Text style={{ fontSize: 20 }}>{emoji}</Text>;
}

export default function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
      }}
    >
      <Tab.Screen
        name="Activas"
        options={{ tabBarIcon: () => <TabIcon emoji="🎟️" /> }}
      >
        {() => <RafflesListScreen status="active" />}
      </Tab.Screen>
      <Tab.Screen
        name="Historial"
        options={{ tabBarIcon: () => <TabIcon emoji="🗂️" /> }}
      >
        {() => <RafflesListScreen status="closed" />}
      </Tab.Screen>
      <Tab.Screen
        name="Perfil"
        component={ProfileScreen}
        options={{ tabBarIcon: () => <TabIcon emoji="👤" /> }}
      />
    </Tab.Navigator>
  );
}
