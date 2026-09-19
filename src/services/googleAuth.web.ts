import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

import { auth } from '../config/firebase';

export const isGoogleSignInAvailable = true;

export async function signInWithGoogle(): Promise<void> {
  await signInWithPopup(auth, new GoogleAuthProvider());
}
