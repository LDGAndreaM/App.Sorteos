import type { FirebaseApp } from 'firebase/app';
import {
  type Auth,
  browserLocalPersistence,
  browserPopupRedirectResolver,
  getAuth,
  initializeAuth,
} from 'firebase/auth';

// initializeAuth must only be called once per app instance (it throws on a second
// call, e.g. during Fast Refresh / hot reload), so fall back to the already-initialized auth.
//
// popupRedirectResolver must be passed explicitly here: unlike getAuth(), which
// wires it up automatically, initializeAuth() only configures what you ask for —
// omitting it makes signInWithPopup() (used for "Continuar con Google") fail with
// `auth/argument-error`.
export function createAuth(app: FirebaseApp): Auth {
  try {
    return initializeAuth(app, {
      persistence: browserLocalPersistence,
      popupRedirectResolver: browserPopupRedirectResolver,
    });
  } catch {
    return getAuth(app);
  }
}
