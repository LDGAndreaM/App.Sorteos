import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { Raffle } from '../types';
import { formatCurrency, formatDate } from '../utils/format';
import { colors, radius, spacing } from '../theme';

export default function RaffleCard({ raffle, onPress }: { raffle: Raffle; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.headerRow}>
        <Text style={styles.name} numberOfLines={1}>
          {raffle.name}
        </Text>
        <View style={styles.codeBadge}>
          <Text style={styles.codeText}>{raffle.inviteCode}</Text>
        </View>
      </View>
      {!!raffle.prize && (
        <Text style={styles.prize} numberOfLines={1}>
          🏆 {raffle.prize}
        </Text>
      )}
      <View style={styles.footerRow}>
        <Text style={styles.meta}>
          {raffle.ticketCount} números · {formatCurrency(raffle.ticketPrice)} c/u
        </Text>
        <Text style={styles.meta}>{formatDate(raffle.createdAt)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  name: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  codeBadge: {
    backgroundColor: colors.availableBg,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  codeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  prize: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  meta: {
    fontSize: 12,
    color: colors.textMuted,
  },
});
