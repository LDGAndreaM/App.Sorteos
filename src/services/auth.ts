import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';

import { auth } from '../config/firebase';

export async function registerWithEmail(email: string, password: string): Promise<void> {
  await createUserWithEmailAndPassword(auth, email.trim(), password);
}

export async function loginWithEmail(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email.trim());
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

/** Turns Firebase Auth error codes into short, friendly Spanish messages. */
export function describeAuthError(error: unknown): string {
  const code = (error as { code?: string } | undefined)?.code ?? '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'Ya existe una cuenta con ese correo. Intenta iniciar sesión.';
    case 'auth/invalid-email':
      return 'Ese correo no es válido.';
    case 'auth/weak-password':
      return 'La contraseña debe tener al menos 6 caracteres.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Correo o contraseña incorrectos.';
    case 'auth/user-not-found':
      return 'No hay ninguna cuenta con ese correo.';
    case 'auth/too-many-requests':
      return 'Demasiados intentos. Espera un momento e intenta de nuevo.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Se cerró la ventana antes de terminar.';
    default:
      return error instanceof Error ? error.message : 'Intenta de nuevo.';
  }
}
