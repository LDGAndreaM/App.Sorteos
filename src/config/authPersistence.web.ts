import type { FirebaseApp } from 'firebase/app';
import { type Auth, browserLocalPersistence, getAuth, initializeAuth } from 'firebase/auth';

// initializeAuth must only be called once per app instance (it throws on a second
// call, e.g. during Fast Refresh / hot reload), so fall back to the already-initialized auth.
export function createAuth(app: FirebaseApp): Auth {
  try {
    return initializeAuth(app, { persistence: browserLocalPersistence });
  } catch {
    return getAuth(app);
  }
}
