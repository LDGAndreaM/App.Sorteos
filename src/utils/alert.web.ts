// react-native-web's Alert.alert() is a no-op (see node_modules/react-native-web
// dist/cjs/exports/Alert), so on web we fall back to the browser's own dialogs.

/** Simple one-button message. */
export function notify(title: string, message?: string): void {
  window.alert(message ? `${title}\n\n${message}` : title);
}

/**
 * Confirmation dialog. Resolves `true` if the user accepted, `false` if they
 * cancelled. Browsers don't support custom button labels on window.confirm,
 * so `confirmLabel`/`options` are accepted for API parity with alert.ts but
 * unused here.
 */
export function confirm(
  title: string,
  message: string,
  _confirmLabel?: string,
  _options?: { destructive?: boolean }
): Promise<boolean> {
  return Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title));
}
