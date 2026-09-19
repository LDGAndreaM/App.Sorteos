import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import type { RootStackParamList } from '../navigation/types';
import { joinRaffleByCode } from '../services/raffles';
import { colors, radius, spacing } from '../theme';
import { notify } from '../utils/alert';

type Nav = NativeStackNavigationProp<RootStackParamList, 'JoinRaffle'>;

export default function JoinRaffleScreen() {
  const navigation = useNavigation<Nav>();
  const { uid, profile } = useAuth();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleJoin = async () => {
    if (!uid || !profile) return;
    if (code.trim().length < 4) {
      notify('Código inválido', 'Escribe el código de invitación de la rifa.');
      return;
    }
    setLoading(true);
    try {
      const raffle = await joinRaffleByCode(code, uid, profile.name);
      navigation.replace('RaffleDetail', { raffleId: raffle.id });
    } catch (error) {
      notify('No se pudo unir', error instanceof Error ? error.message : 'Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.content}>
          <Text style={styles.title}>Unirme a una rifa</Text>
          <Text style={styles.subtitle}>
            Pide a quien creó la rifa el código de invitación de 6 letras/números.
          </Text>

          <TextInput
            style={styles.input}
            value={code}
            onChangeText={(text) => setCode(text.toUpperCase())}
            placeholder="Código, ej. AB12CD"
            placeholderTextColor={colors.textMuted}
            autoCapitalize="characters"
            autoFocus
            maxLength={8}
            returnKeyType="done"
            onSubmitEditing={handleJoin}
          />

          <TouchableOpacity style={[styles.button, loading && styles.buttonDisabled]} onPress={handleJoin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Unirme</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginBottom: spacing.lg,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
    fontSize: 20,
    letterSpacing: 4,
    textAlign: 'center',
    color: colors.text,
    marginBottom: spacing.md,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
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
