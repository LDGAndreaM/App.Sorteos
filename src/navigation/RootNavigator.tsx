import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';

import { useAuth } from '../context/AuthContext';
import CreateRaffleScreen from '../screens/CreateRaffleScreen';
import JoinRaffleScreen from '../screens/JoinRaffleScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import RaffleDetailScreen from '../screens/RaffleDetailScreen';
import { colors } from '../theme';
import MainTabs from './MainTabs';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { authReady, profile, profileLoading, isFirebaseConfigured } = useAuth();

  const showOnboarding = !isFirebaseConfigured || !authReady || profileLoading || !profile;

  if (isFirebaseConfigured && (!authReady || profileLoading)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerTintColor: colors.primary }}>
        {showOnboarding ? (
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} options={{ headerShown: false }} />
            <Stack.Screen name="CreateRaffle" component={CreateRaffleScreen} options={{ title: 'Nueva rifa' }} />
            <Stack.Screen name="JoinRaffle" component={JoinRaffleScreen} options={{ title: 'Unirme a rifa' }} />
            <Stack.Screen name="RaffleDetail" component={RaffleDetailScreen} options={{ title: 'Rifa' }} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
