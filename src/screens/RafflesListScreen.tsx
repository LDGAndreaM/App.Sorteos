import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import { Alert, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import RaffleCard from '../components/RaffleCard';
import { useAuth } from '../context/AuthContext';
import { subscribeToUserRaffles } from '../services/raffles';
import type { RootStackParamList } from '../navigation/types';
import { colors, radius, spacing } from '../theme';
import type { Raffle, RaffleStatus } from '../types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function RafflesListScreen({ status }: { status: RaffleStatus }) {
  const { uid } = useAuth();
  const navigation = useNavigation<Nav>();
  const [raffles, setRaffles] = useState<Raffle[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    const unsubscribe = subscribeToUserRaffles(
      uid,
      status,
      (data) => {
        setRaffles(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error al cargar rifas', error);
        setLoading(false);
        Alert.alert('No se pudieron cargar las rifas', error.message);
      }
    );
    return unsubscribe;
  }, [uid, status]);

  const isActiveTab = status === 'active';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>{isActiveTab ? 'Rifas activas' : 'Historial'}</Text>
        {isActiveTab && (
          <View style={styles.headerButtons}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('JoinRaffle')}
            >
              <Text style={styles.secondaryButtonText}>Unirme</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('CreateRaffle')}
            >
              <Text style={styles.primaryButtonText}>+ Nueva rifa</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <FlatList
        data={raffles}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <RaffleCard
            raffle={item}
            onPress={() => navigation.navigate('RaffleDetail', { raffleId: item.id })}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>
                {isActiveTab ? 'Aún no tienes rifas activas' : 'Todavía no hay rifas en tu historial'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {isActiveTab
                  ? 'Crea una rifa nueva o únete a una con el código que te compartieron.'
                  : 'Cuando cierres una rifa activa, aparecerá aquí.'}
              </Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    flex: 1,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    flex: 1,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
