import { type User, onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { auth, isFirebaseConfigured } from '../config/firebase';
import { createProfile, fetchProfile } from '../services/profile';
import type { UserProfile } from '../types';

interface AuthContextValue {
  isFirebaseConfigured: boolean;
  authReady: boolean;
  uid: string | null;
  profile: UserProfile | null;
  profileLoading: boolean;
  setProfileName: (name: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [uid, setUid] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthReady(true);
      setProfileLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error('No se pudo iniciar sesión anónima', error);
          setAuthReady(true);
          setProfileLoading(false);
        }
        return;
      }

      setUid(user.uid);
      setAuthReady(true);
      try {
        const existing = await fetchProfile(user.uid);
        setProfile(existing);
      } catch (error) {
        console.error('No se pudo cargar el perfil', error);
      } finally {
        setProfileLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const setProfileName = async (name: string) => {
    if (!uid) throw new Error('No hay sesión activa todavía.');
    const created = await createProfile(uid, name);
    setProfile(created);
  };

  const refreshProfile = async () => {
    if (!uid) return;
    const existing = await fetchProfile(uid);
    setProfile(existing);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      isFirebaseConfigured,
      authReady,
      uid,
      profile,
      profileLoading,
      setProfileName,
      refreshProfile,
    }),
    [authReady, uid, profile, profileLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
