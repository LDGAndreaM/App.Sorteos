import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

import { TicketUnavailableError, claimTicket, releaseTicket, updateTicket } from '../services/raffles';
import { colors, radius, spacing } from '../theme';
import type { Raffle, Ticket, TicketStatus } from '../types';
import { confirm, notify } from '../utils/alert';
import { formatCurrency, formatTicketNumber } from '../utils/format';

type PaymentOption = Extract<TicketStatus, 'paid' | 'partial' | 'pending'>;

const STATUS_LABELS: Record<TicketStatus, string> = {
  available: 'Disponible',
  pending: 'Pendiente de pago',
  partial: 'Abonado',
  paid: 'Pagado completo',
};

export default function TicketModal({
  visible,
  ticket,
  raffle,
  actorUid,
  actorName,
  onClose,
}: {
  visible: boolean;
  ticket: Ticket | null;
  raffle: Raffle;
  actorUid: string;
  actorName: string;
  onClose: () => void;
}) {
  const [buyerName, setBuyerName] = useState('');
  const [buyerWhatsapp, setBuyerWhatsapp] = useState('');
  const [paymentOption, setPaymentOption] = useState<PaymentOption>('pending');
  const [amount, setAmount] = useState('');
  const [saving, setSaving] = useState(false);

  const isAvailable = ticket?.status === 'available';
  const isOwner = !!ticket && (ticket.soldByUid === actorUid || raffle.createdBy === actorUid);
  // Anyone can claim an open ticket; once it's sold, only the seller (or the
  // raffle's creator, as an admin override) can change it.
  const canEdit = isAvailable || isOwner;

  useEffect(() => {
    if (!ticket) return;
    setBuyerName(ticket.buyerName ?? '');
    setBuyerWhatsapp(ticket.buyerWhatsapp ?? '');
    if (ticket.status === 'paid' || ticket.status === 'partial' || ticket.status === 'pending') {
      setPaymentOption(ticket.status);
      setAmount(ticket.status === 'partial' ? String(ticket.amountPaid) : '');
    } else {
      setPaymentOption('pending');
      setAmount('');
    }
  }, [ticket]);

  if (!ticket) return null;

  const handleSave = async () => {
    if (buyerName.trim().length < 2) {
      notify('Falta el nombre', 'Escribe el nombre de quien compra el boleto.');
      return;
    }

    let amountPaid = 0;
    if (paymentOption === 'paid') {
      amountPaid = raffle.ticketPrice;
    } else if (paymentOption === 'partial') {
      const parsed = Number(amount);
      if (!parsed || parsed <= 0) {
        notify('Monto inválido', 'Escribe cuánto ha abonado.');
        return;
      }
      if (parsed >= raffle.ticketPrice) {
        notify('Monto inválido', 'Si ya cubrió el costo completo, usa "Pagó completo".');
        return;
      }
      amountPaid = parsed;
    }

    setSaving(true);
    try {
      const input = { buyerName, buyerWhatsapp, status: paymentOption, amountPaid };
      if (isAvailable) {
        await claimTicket(raffle.id, ticket.number, input, actorUid, actorName);
      } else {
        await updateTicket(raffle.id, ticket.number, input, actorUid, actorName);
      }
      onClose();
    } catch (error) {
      if (error instanceof TicketUnavailableError) {
        notify('Boleto no disponible', error.message);
        onClose();
      } else {
        notify('No se pudo guardar', error instanceof Error ? error.message : 'Intenta de nuevo.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleRelease = async () => {
    const accepted = await confirm(
      'Liberar boleto',
      `¿Seguro que quieres liberar el boleto ${formatTicketNumber(ticket.number, raffle.numberDigits)}? Se marcará como disponible de nuevo.`,
      'Liberar',
      { destructive: true }
    );
    if (!accepted) return;

    setSaving(true);
    try {
      await releaseTicket(raffle.id, ticket.number, actorUid, actorName);
      onClose();
    } catch (error) {
      notify('Error', error instanceof Error ? error.message : 'Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.sheet}>
          <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.handleBar} />
            <Text style={styles.title}>Boleto {formatTicketNumber(ticket.number, raffle.numberDigits)}</Text>
            <Text style={styles.price}>{formatCurrency(raffle.ticketPrice)}</Text>

            {!isAvailable && ticket.soldByName && (
              <Text style={styles.soldBy}>Vendido por {ticket.soldByName}</Text>
            )}

            {canEdit ? (
              <>
                <Text style={styles.label}>Nombre del comprador</Text>
                <TextInput
                  style={styles.input}
                  value={buyerName}
                  onChangeText={setBuyerName}
                  placeholder="Nombre completo"
                  placeholderTextColor={colors.textMuted}
                  maxLength={60}
                />

                <Text style={styles.label}>WhatsApp (opcional)</Text>
                <TextInput
                  style={styles.input}
                  value={buyerWhatsapp}
                  onChangeText={setBuyerWhatsapp}
                  placeholder="10 dígitos"
                  placeholderTextColor={colors.textMuted}
                  keyboardType="phone-pad"
                  maxLength={20}
                />

                <Text style={styles.label}>Estado de pago</Text>
                <View style={styles.paymentOptions}>
                  <PaymentButton
                    label="Pagó completo"
                    active={paymentOption === 'paid'}
                    color={colors.success}
                    bg={colors.successBg}
                    onPress={() => setPaymentOption('paid')}
                  />
                  <PaymentButton
                    label="Abonó"
                    active={paymentOption === 'partial'}
                    color={colors.partial}
                    bg={colors.partialBg}
                    onPress={() => setPaymentOption('partial')}
                  />
                  <PaymentButton
                    label="Pendiente"
                    active={paymentOption === 'pending'}
                    color={colors.warning}
                    bg={colors.warningBg}
                    onPress={() => setPaymentOption('pending')}
                  />
                </View>

                {paymentOption === 'partial' && (
                  <>
                    <Text style={styles.label}>¿Cuánto ha abonado?</Text>
                    <TextInput
                      style={styles.input}
                      value={amount}
                      onChangeText={setAmount}
                      placeholder="$0"
                      placeholderTextColor={colors.textMuted}
                      keyboardType="numeric"
                    />
                  </>
                )}

                <TouchableOpacity
                  style={[styles.saveButton, saving && styles.disabled]}
                  onPress={handleSave}
                  disabled={saving}
                >
                  {saving ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {isAvailable ? 'Registrar venta' : 'Guardar cambios'}
                    </Text>
                  )}
                </TouchableOpacity>

                {!isAvailable && (
                  <TouchableOpacity style={styles.releaseButton} onPress={handleRelease} disabled={saving}>
                    <Text style={styles.releaseButtonText}>Liberar boleto</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <View style={styles.readOnlyBlock}>
                <ReadOnlyRow label="Comprador" value={ticket.buyerName || '—'} />
                <ReadOnlyRow label="WhatsApp" value={ticket.buyerWhatsapp || '—'} />
                <ReadOnlyRow label="Estado" value={STATUS_LABELS[ticket.status]} />
                {ticket.status === 'partial' && (
                  <ReadOnlyRow label="Ha abonado" value={formatCurrency(ticket.amountPaid)} />
                )}
                <Text style={styles.readOnlyNote}>
                  Solo {ticket.soldByName ?? 'quien vendió este boleto'} o quien creó la rifa pueden
                  modificarlo.
                </Text>
              </View>
            )}

            <TouchableOpacity style={styles.cancelButton} onPress={onClose} disabled={saving}>
              <Text style={styles.cancelButtonText}>{canEdit ? 'Cancelar' : 'Cerrar'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function PaymentButton({
  label,
  active,
  color,
  bg,
  onPress,
}: {
  label: string;
  active: boolean;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.paymentButton,
        { backgroundColor: active ? bg : colors.surface, borderColor: active ? color : colors.border },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.paymentButtonText, { color: active ? color : colors.text }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.readOnlyRow}>
      <Text style={styles.readOnlyLabel}>{label}</Text>
      <Text style={styles.readOnlyValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.md,
    maxHeight: '88%',
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
  },
  price: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  soldBy: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  paymentOptions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  paymentButton: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  paymentButtonText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  releaseButton: {
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  releaseButtonText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cancelButtonText: {
    color: colors.textMuted,
    fontSize: 14,
  },
  disabled: {
    opacity: 0.6,
  },
  readOnlyBlock: {
    marginTop: spacing.md,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  readOnlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  readOnlyLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  readOnlyValue: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    flex: 1,
    textAlign: 'right',
    marginLeft: spacing.md,
  },
  readOnlyNote: {
    marginTop: spacing.sm,
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: 'italic',
  },
});
