import { type User, onAuthStateChanged } from 'firebase/auth';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

import { auth, isFirebaseConfigured } from '../config/firebase';
import { createProfile, fetchProfile } from '../services/profile';
import type { UserProfile } from '../types';

interface AuthContextValue {
  isFirebaseConfigured: boolean;
  authReady: boolean;
  user: User | null;
  uid: string | null;
  profile: UserProfile | null;
  profileLoading: boolean;
  setProfileName: (name: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authReady, setAuthReady] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setAuthReady(true);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthReady(true);

      if (!nextUser) {
        setProfile(null);
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      try {
        const existing = await fetchProfile(nextUser.uid);
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
    if (!user) throw new Error('No hay sesión activa todavía.');
    const created = await createProfile(user.uid, name, user.email);
    setProfile(created);
  };

  const refreshProfile = async () => {
    if (!user) return;
    const existing = await fetchProfile(user.uid);
    setProfile(existing);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      isFirebaseConfigured,
      authReady,
      user,
      uid: user?.uid ?? null,
      profile,
      profileLoading,
      setProfileName,
      refreshProfile,
    }),
    [authReady, user, profile, profileLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
