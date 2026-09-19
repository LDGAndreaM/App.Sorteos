import React from 'react';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';

import { colors, radius } from '../theme';
import type { Ticket } from '../types';
import { formatTicketNumber } from '../utils/format';

const STATUS_STYLES: Record<Ticket['status'], { bg: string; fg: string }> = {
  available: { bg: colors.availableBg, fg: colors.textMuted },
  pending: { bg: colors.warningBg, fg: colors.warning },
  partial: { bg: colors.partialBg, fg: colors.partial },
  paid: { bg: colors.successBg, fg: colors.success },
};

export default React.memo(function TicketCell({
  ticket,
  digits,
  size,
  onPress,
}: {
  ticket: Ticket;
  digits: number;
  size: number;
  onPress: () => void;
}) {
  const style = STATUS_STYLES[ticket.status];
  return (
    <TouchableOpacity
      style={[styles.cell, { backgroundColor: style.bg, width: size, height: size }]}
      onPress={onPress}
      activeOpacity={0.6}
    >
      <Text style={[styles.text, { color: style.fg }]} numberOfLines={1} adjustsFontSizeToFit>
        {formatTicketNumber(ticket.number, digits)}
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  cell: {
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
  },
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
});
