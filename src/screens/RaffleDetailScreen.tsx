import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import React, { useEffect, useLayoutEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import SummaryBar from '../components/SummaryBar';
import TicketGrid from '../components/TicketGrid';
import TicketModal from '../components/TicketModal';
import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { exportRaffleToExcel } from '../services/exportRaffle';
import { closeRaffle, reopenRaffle, subscribeToRaffle, subscribeToTickets } from '../services/raffles';
import { colors, radius, spacing } from '../theme';
import type { Raffle, Ticket } from '../types';
import { computeSellerBreakdown, computeTotals } from '../utils/stats';

type Props = NativeStackScreenProps<RootStackParamList, 'RaffleDetail'>;

export default function RaffleDetailScreen({ route, navigation }: Props) {
  const { raffleId } = route.params;
  const { uid, profile } = useAuth();

  const [raffle, setRaffle] = useState<Raffle | null>(null);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [exporting, setExporting] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const unsubscribeRaffle = subscribeToRaffle(
      raffleId,
      (data) => {
        setRaffle(data);
        setLoading(false);
      },
      (error) => {
        console.error('Error al cargar la rifa', error);
        setLoading(false);
        Alert.alert('No se pudo cargar la rifa', error.message);
      }
    );
    const unsubscribeTickets = subscribeToTickets(raffleId, setTickets, (error) => {
      console.error('Error al cargar los boletos', error);
      Alert.alert('No se pudieron cargar los boletos', error.message);
    });
    return () => {
      unsubscribeRaffle();
      unsubscribeTickets();
    };
  }, [raffleId]);

  useLayoutEffect(() => {
    navigation.setOptions({ title: raffle?.name ?? 'Rifa' });
  }, [navigation, raffle?.name]);

  const totals = useMemo(() => (raffle ? computeTotals(tickets, raffle) : null), [tickets, raffle]);
  const sellers = useMemo(() => computeSellerBreakdown(tickets), [tickets]);

  if (loading) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  if (!raffle) {
    return (
      <SafeAreaView style={styles.center}>
        <Text style={styles.notFound}>No se encontró la rifa.</Text>
      </SafeAreaView>
    );
  }

  const isCreator = raffle.createdBy === uid;
  const isClosed = raffle.status === 'closed';

  const handleShareCode = async () => {
    const message = `Únete a mi rifa "${raffle.name}" en la app de Rifas. Código de invitación: ${raffle.inviteCode}`;
    try {
      await Share.share({ message });
    } catch {
      // No hay hoja para compartir disponible (típico en navegadores de escritorio):
      // copiamos el código al portapapeles como respaldo.
      await Clipboard.setStringAsync(raffle.inviteCode);
      Alert.alert('Código copiado', `Se copió "${raffle.inviteCode}" al portapapeles.`);
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await exportRaffleToExcel(raffle, tickets);
    } catch (error) {
      Alert.alert('No se pudo exportar', error instanceof Error ? error.message : 'Intenta de nuevo.');
    } finally {
      setExporting(false);
    }
  };

  const handleToggleStatus = () => {
    const action = isClosed ? 'reabrir' : 'cerrar';
    Alert.alert(
      isClosed ? 'Reabrir rifa' : 'Cerrar rifa',
      isClosed
        ? 'La rifa volverá a aparecer en tus rifas activas.'
        : 'La rifa se moverá al historial. Podrás reabrirla después si lo necesitas.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: isClosed ? 'Reabrir' : 'Cerrar rifa',
          style: isClosed ? 'default' : 'destructive',
          onPress: async () => {
            setBusy(true);
            try {
              if (isClosed) {
                await reopenRaffle(raffle.id);
              } else {
                await closeRaffle(raffle.id);
              }
            } catch (error) {
              Alert.alert('Error', error instanceof Error ? error.message : `No se pudo ${action} la rifa.`);
            } finally {
              setBusy(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.topBar}>
        <View style={styles.topBarInfo}>
          {!!raffle.prize && <Text style={styles.prize}>🏆 {raffle.prize}</Text>}
          <TouchableOpacity onPress={handleShareCode} style={styles.codeRow}>
            <Text style={styles.codeLabel}>Código:</Text>
            <Text style={styles.codeValue}>{raffle.inviteCode}</Text>
            <Text style={styles.shareHint}>compartir ↗</Text>
          </TouchableOpacity>
        </View>
        {isClosed && (
          <View style={styles.closedBadge}>
            <Text style={styles.closedBadgeText}>Cerrada</Text>
          </View>
        )}
      </View>

      {totals && <SummaryBar totals={totals} sellers={sellers} />}

      <Legend />

      <TicketGrid tickets={tickets} digits={raffle.numberDigits} onSelect={setSelectedTicket} />

      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.exportButton]}
          onPress={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <Text style={styles.exportButtonText}>Exportar a Excel</Text>
          )}
        </TouchableOpacity>

        {isCreator && (
          <TouchableOpacity
            style={[styles.actionButton, isClosed ? styles.reopenButton : styles.closeButton]}
            onPress={handleToggleStatus}
            disabled={busy}
          >
            <Text style={isClosed ? styles.reopenButtonText : styles.closeButtonText}>
              {busy ? '...' : isClosed ? 'Reabrir rifa' : 'Cerrar rifa'}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {uid && profile && (
        <TicketModal
          visible={!!selectedTicket}
          ticket={selectedTicket}
          raffle={raffle}
          actorUid={uid}
          actorName={profile.name}
          onClose={() => setSelectedTicket(null)}
        />
      )}
    </SafeAreaView>
  );
}

function Legend() {
  const items: { label: string; bg: string; fg: string }[] = [
    { label: 'Disponible', bg: colors.availableBg, fg: colors.textMuted },
    { label: 'Pendiente', bg: colors.warningBg, fg: colors.warning },
    { label: 'Abonado', bg: colors.partialBg, fg: colors.partial },
    { label: 'Pagado', bg: colors.successBg, fg: colors.success },
  ];
  return (
    <View style={styles.legend}>
      {items.map((item) => (
        <View key={item.label} style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: item.bg, borderColor: item.fg }]} />
          <Text style={styles.legendText}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  notFound: {
    color: colors.textMuted,
    fontSize: 15,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  topBarInfo: {
    flex: 1,
  },
  prize: {
    fontSize: 14,
    color: colors.text,
    marginBottom: 2,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  codeLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  codeValue: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: 1,
  },
  shareHint: {
    fontSize: 11,
    color: colors.textMuted,
  },
  closedBadge: {
    backgroundColor: colors.dangerBg,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  closedBadgeText: {
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  legendText: {
    fontSize: 11,
    color: colors.textMuted,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: Platform.OS === 'android' ? spacing.md : spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  actionButton: {
    flex: 1,
    borderRadius: radius.md,
    paddingVertical: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exportButton: {
    backgroundColor: colors.availableBg,
  },
  exportButtonText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
  closeButton: {
    backgroundColor: colors.dangerBg,
  },
  closeButtonText: {
    color: colors.danger,
    fontWeight: '700',
    fontSize: 14,
  },
  reopenButton: {
    backgroundColor: colors.successBg,
  },
  reopenButtonText: {
    color: colors.success,
    fontWeight: '700',
    fontSize: 14,
  },
});
