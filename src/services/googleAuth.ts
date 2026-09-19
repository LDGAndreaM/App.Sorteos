// Google Sign-In on native (iOS/Android) needs a dedicated OAuth flow with a
// platform-specific client id and a fixed custom URL scheme registered with
// Google — that only works reliably from an EAS development/production
// build, not from Expo Go. Rather than ship an OAuth flow that can't be
// tested end-to-end here, native sign-in is email/password only for now;
// see googleAuth.web.ts for the web implementation (works out of the box).
export const isGoogleSignInAvailable = false;

export async function signInWithGoogle(): Promise<void> {
  throw new Error(
    'Iniciar sesión con Google todavía no está disponible en la app. Usa tu correo, o entra desde la versión web.'
  );
}
