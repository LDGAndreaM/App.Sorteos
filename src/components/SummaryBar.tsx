import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme';
import type { RaffleTotals, SellerBreakdown } from '../types';
import { formatCurrency } from '../utils/format';

export default function SummaryBar({
  totals,
  sellers,
}: {
  totals: RaffleTotals;
  sellers: SellerBreakdown[];
}) {
  const sold = totals.pending + totals.partial + totals.paid;

  return (
    <View style={styles.container}>
      <View style={styles.statsRow}>
        <Stat label="Vendidos" value={String(sold)} color={colors.text} />
        <Stat label="Disponibles" value={String(totals.available)} color={colors.textMuted} />
        <Stat label="Recaudado" value={formatCurrency(totals.totalCollected)} color={colors.success} />
        <Stat label="Por cobrar" value={formatCurrency(totals.totalPending)} color={colors.warning} />
      </View>

      {sellers.length > 0 && (
        <View style={styles.sellers}>
          <Text style={styles.sellersTitle}>Por vendedor</Text>
          {sellers.map((seller) => (
            <View key={seller.uid} style={styles.sellerRow}>
              <Text style={styles.sellerName} numberOfLines={1}>
                {seller.name}
              </Text>
              <Text style={styles.sellerStats}>
                {seller.ticketsSold} boletos · {formatCurrency(seller.totalCollected)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, { color }]} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsRow: {
    flexDirection: 'row',
  },
  stat: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  sellers: {
    marginTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.sm,
  },
  sellersTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  sellerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  sellerName: {
    fontSize: 13,
    color: colors.text,
    flex: 1,
    marginRight: spacing.sm,
  },
  sellerStats: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
