import { type FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import type { Auth } from 'firebase/auth';
import { type Firestore, getFirestore } from 'firebase/firestore';

import { createAuth } from './authPersistence';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const hasConfigValues = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId
);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

// `initializeAuth`/`getAuth` validate the API key eagerly (synchronously, at call
// time) and throw if it's missing or wrong — e.g. an empty or mistyped
// EXPO_PUBLIC_FIREBASE_API_KEY. Since this file runs at module load, an uncaught
// throw here would crash the whole app before React ever renders (a blank white
// screen with no visible message). Guard the whole init so a bad/missing config
// falls back to `isFirebaseConfigured = false` instead, which the UI shows as a
// normal "configure Firebase" screen.
if (hasConfigValues) {
  try {
    app = getApps().length ? getApp() : initializeApp(firebaseConfig);
    authInstance = createAuth(app);
    dbInstance = getFirestore(app);
  } catch (error) {
    console.error(
      'No se pudo inicializar Firebase. Revisa tus variables EXPO_PUBLIC_FIREBASE_* (en .env o en las Environment Variables de Vercel).',
      error
    );
    app = null;
    authInstance = null;
    dbInstance = null;
  }
}

export const isFirebaseConfigured = app !== null;
export const firebaseApp = app as FirebaseApp;
export const auth = authInstance as Auth;
export const db = dbInstance as Firestore;
