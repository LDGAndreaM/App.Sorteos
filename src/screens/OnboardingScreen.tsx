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
import { colors, radius, spacing } from '../theme';
import { notify } from '../utils/alert';

export default function OnboardingScreen() {
  const { setProfileName, isFirebaseConfigured, authReady } = useAuth();
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);

  const handleContinue = async () => {
    if (name.trim().length < 2) {
      notify('Falta tu nombre', 'Escribe tu nombre o apodo para identificarte como vendedor.');
      return;
    }
    setSaving(true);
    try {
      await setProfileName(name);
    } catch (error) {
      notify('No se pudo guardar', error instanceof Error ? error.message : 'Intenta de nuevo.');
    } finally {
      setSaving(false);
    }
  };

  if (!isFirebaseConfigured) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Falta configurar Firebase</Text>
          <Text style={styles.subtitle}>
            Esta app necesita un proyecto de Firebase para sincronizar las rifas entre todos los
            vendedores. Copia el archivo .env.example a .env, llena tus credenciales y vuelve a
            iniciar la app. Revisa el README para el paso a paso.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.emoji}>🎟️</Text>
          <Text style={styles.title}>¡Bienvenido a Rifas!</Text>
          <Text style={styles.subtitle}>
            Escribe tu nombre para que tus compañeros sepan qué boletos vendiste tú.
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Tu nombre"
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={40}
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />

          <TouchableOpacity
            style={[styles.button, (!authReady || saving) && styles.buttonDisabled]}
            onPress={handleContinue}
            disabled={!authReady || saving}
          >
            {saving || !authReady ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Continuar</Text>
            )}
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
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  emoji: {
    fontSize: 56,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 15,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 21,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
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
});
