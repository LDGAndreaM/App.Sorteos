import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '../context/AuthContext';
import { updateProfileName } from '../services/profile';
import { colors, radius, spacing } from '../theme';

export default function ProfileScreen() {
  const { profile, uid, refreshProfile } = useAuth();
  const [name, setName] = useState(profile?.name ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!uid) return;
    if (name.trim().length < 2) {
      Alert.alert('Nombre inválido', 'Escribe al menos 2 caracteres.');
      return;
    }
    setSaving(true);
    try {
      await updateProfileName(uid, name);
      await refreshProfile();
      Alert.alert('Listo', 'Tu nombre se actualizó.');
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.content}>
        <Text style={styles.title}>Mi perfil</Text>
        <Text style={styles.subtitle}>
          Este es el nombre con el que aparecerás como vendedor en tus rifas.
        </Text>

        <Text style={styles.label}>Nombre</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Tu nombre"
          placeholderTextColor={colors.textMuted}
          maxLength={40}
        />

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.buttonText}>{saving ? 'Guardando…' : 'Guardar cambios'}</Text>
        </TouchableOpacity>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Comparte el código de cada rifa con tus compañeros para que se unan y vendan boletos
            desde su propio celular. Todos verán en tiempo real qué números ya se vendieron.
          </Text>
        </View>
      </View>
    </SafeAreaView>
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
  infoBox: {
    marginTop: spacing.xl,
    backgroundColor: colors.availableBg,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  infoText: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 19,
  },
});
