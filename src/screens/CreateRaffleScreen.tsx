import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { createRaffle } from '../services/raffles';
import { colors, radius, spacing } from '../theme';

type Nav = NativeStackNavigationProp<RootStackParamList, 'CreateRaffle'>;

export default function CreateRaffleScreen() {
  const navigation = useNavigation<Nav>();
  const { uid, profile } = useAuth();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [prize, setPrize] = useState('');
  const [ticketPrice, setTicketPrice] = useState('');
  const [ticketCount, setTicketCount] = useState('100');
  const [startNumber, setStartNumber] = useState<'0' | '1'>('1');
  const [saving, setSaving] = useState(false);

  const handleCreate = async () => {
    if (!uid || !profile) return;

    if (name.trim().length < 2) {
      Alert.alert('Falta el nombre', 'Ponle un nombre a tu rifa.');
      return;
    }
    const price = Number(ticketPrice);
    if (!price || price <= 0) {
      Alert.alert('Precio inválido', 'Escribe el costo del boleto (mayor a 0).');
      return;
    }
    const count = Math.round(Number(ticketCount));
    if (!count || count <= 0 || count > 10000) {
      Alert.alert('Cantidad inválida', 'Escribe cuántos números tendrá la rifa (entre 1 y 10,000).');
      return;
    }

    setSaving(true);
    try {
      const raffleId = await createRaffle(
        {
          name,
          description,
          prize,
          ticketPrice: price,
          ticketCount: count,
          startNumber: Number(startNumber),
        },
        uid,
        profile.name
      );
      navigation.replace('RaffleDetail', { raffleId });
    } catch (error) {
      Alert.alert('No se pudo crear la rifa', error instanceof Error ? error.message : 'Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Text style={styles.title}>Nueva rifa</Text>

          <Field label="Nombre de la rifa">
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="Ej. Rifa pro-fondos 3ro A"
              placeholderTextColor={colors.textMuted}
              maxLength={60}
            />
          </Field>

          <Field label="Premio">
            <TextInput
              style={styles.input}
              value={prize}
              onChangeText={setPrize}
              placeholder="Ej. Canasta navideña"
              placeholderTextColor={colors.textMuted}
              maxLength={80}
            />
          </Field>

          <Field label="Descripción (opcional)">
            <TextInput
              style={[styles.input, styles.multiline]}
              value={description}
              onChangeText={setDescription}
              placeholder="Detalles adicionales, fecha del sorteo, etc."
              placeholderTextColor={colors.textMuted}
              multiline
              maxLength={200}
            />
          </Field>

          <View style={styles.row}>
            <Field label="Costo del boleto" style={styles.rowItem}>
              <TextInput
                style={styles.input}
                value={ticketPrice}
                onChangeText={setTicketPrice}
                placeholder="$50"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </Field>
            <Field label="Cantidad de números" style={styles.rowItem}>
              <TextInput
                style={styles.input}
                value={ticketCount}
                onChangeText={setTicketCount}
                placeholder="100"
                placeholderTextColor={colors.textMuted}
                keyboardType="numeric"
              />
            </Field>
          </View>

          <Field label="¿En qué número empiezan?">
            <View style={styles.segment}>
              {(['0', '1'] as const).map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.segmentOption, startNumber === option && styles.segmentOptionActive]}
                  onPress={() => setStartNumber(option)}
                >
                  <Text
                    style={[
                      styles.segmentText,
                      startNumber === option && styles.segmentTextActive,
                    ]}
                  >
                    Desde {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Field>

          <TouchableOpacity
            style={[styles.button, saving && styles.buttonDisabled]}
            onPress={handleCreate}
            disabled={saving}
          >
            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Crear rifa</Text>}
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  children,
  style,
}: {
  label: string;
  children: React.ReactNode;
  style?: object;
}) {
  return (
    <View style={[styles.field, style]}>
      <Text style={styles.label}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.lg,
  },
  field: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: spacing.xs,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  rowItem: {
    flex: 1,
  },
  segment: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segmentOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  segmentOptionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  segmentTextActive: {
    color: '#fff',
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
