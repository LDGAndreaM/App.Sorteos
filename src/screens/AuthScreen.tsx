import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
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

import { describeAuthError, loginWithEmail, registerWithEmail, resetPassword } from '../services/auth';
import { isGoogleSignInAvailable, signInWithGoogle } from '../services/googleAuth';
import { colors, radius, spacing } from '../theme';
import { notify } from '../utils/alert';

type Mode = 'login' | 'register';

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const isRegister = mode === 'register';

  const handleSubmit = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail.includes('@')) {
      notify('Correo inválido', 'Escribe un correo válido.');
      return;
    }
    if (password.length < 6) {
      notify('Contraseña muy corta', 'Debe tener al menos 6 caracteres.');
      return;
    }
    if (isRegister && password !== confirmPassword) {
      notify('Las contraseñas no coinciden', 'Escribe la misma contraseña en ambos campos.');
      return;
    }

    setSubmitting(true);
    try {
      if (isRegister) {
        await registerWithEmail(trimmedEmail, password);
      } else {
        await loginWithEmail(trimmedEmail, password);
      }
      // El listener de AuthContext detecta la sesión y navega automáticamente.
    } catch (error) {
      notify(isRegister ? 'No se pudo crear la cuenta' : 'No se pudo iniciar sesión', describeAuthError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    const trimmedEmail = email.trim();
    if (!trimmedEmail.includes('@')) {
      notify('Escribe tu correo', 'Ponlo en el campo de correo y vuelve a tocar "Olvidé mi contraseña".');
      return;
    }
    try {
      await resetPassword(trimmedEmail);
      notify('Listo', `Te enviamos un correo a ${trimmedEmail} para restablecer tu contraseña.`);
    } catch (error) {
      notify('No se pudo enviar el correo', describeAuthError(error));
    }
  };

  const handleGoogle = async () => {
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      notify('No se pudo iniciar sesión con Google', describeAuthError(error));
    } finally {
      setGoogleSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <Image source={require('../../assets/icon.png')} style={styles.logo} />
          <Text style={styles.title}>¡Bienvenido a Rifas!</Text>
          <Text style={styles.subtitle}>
            {isRegister ? 'Crea tu cuenta con tu correo.' : 'Inicia sesión con tu correo.'}
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Correo"
            placeholderTextColor={colors.textMuted}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            textContentType="emailAddress"
          />

          <TextInput
            style={styles.input}
            placeholder="Contraseña"
            placeholderTextColor={colors.textMuted}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            textContentType={isRegister ? 'newPassword' : 'password'}
          />

          {isRegister && (
            <TextInput
              style={styles.input}
              placeholder="Confirma tu contraseña"
              placeholderTextColor={colors.textMuted}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              textContentType="newPassword"
            />
          )}

          {!isRegister && (
            <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotLink}>
              <Text style={styles.forgotLinkText}>¿Olvidaste tu contraseña?</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.button, submitting && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
          >
            {submitting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{isRegister ? 'Crear cuenta' : 'Iniciar sesión'}</Text>
            )}
          </TouchableOpacity>

          {isGoogleSignInAvailable && (
            <>
              <View style={styles.dividerRow}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>o</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                style={[styles.googleButton, googleSubmitting && styles.buttonDisabled]}
                onPress={handleGoogle}
                disabled={googleSubmitting}
              >
                {googleSubmitting ? (
                  <ActivityIndicator color={colors.text} />
                ) : (
                  <Text style={styles.googleButtonText}>Continuar con Google</Text>
                )}
              </TouchableOpacity>
            </>
          )}

          <TouchableOpacity
            style={styles.switchModeButton}
            onPress={() => setMode(isRegister ? 'login' : 'register')}
          >
            <Text style={styles.switchModeText}>
              {isRegister ? '¿Ya tienes cuenta? ' : '¿No tienes cuenta? '}
              <Text style={styles.switchModeTextBold}>{isRegister ? 'Inicia sesión' : 'Crea una'}</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
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
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  logo: {
    width: 96,
    height: 96,
    borderRadius: radius.lg,
    alignSelf: 'center',
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
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: spacing.md,
    marginTop: -spacing.sm,
  },
  forgotLinkText: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: '600',
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
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.sm,
    color: colors.textMuted,
    fontSize: 13,
  },
  googleButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: 14,
    alignItems: 'center',
  },
  googleButtonText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
  },
  switchModeButton: {
    marginTop: spacing.lg,
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  switchModeTextBold: {
    color: colors.primary,
    fontWeight: '700',
  },
});
