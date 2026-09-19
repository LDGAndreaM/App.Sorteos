import { Alert } from 'react-native';

/** Simple one-button message. */
export function notify(title: string, message?: string): void {
  Alert.alert(title, message);
}

/**
 * Confirmation dialog. Resolves `true` if the user tapped the confirm button,
 * `false` if they cancelled/dismissed it.
 */
export function confirm(
  title: string,
  message: string,
  confirmLabel: string,
  options?: { destructive?: boolean }
): Promise<boolean> {
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: options?.destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}
