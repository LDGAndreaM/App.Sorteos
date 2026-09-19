import { doc, getDoc, serverTimestamp, setDoc, updateDoc } from 'firebase/firestore';

import { db } from '../config/firebase';
import type { UserProfile } from '../types';

function fromDoc(uid: string, data: Record<string, unknown>): UserProfile {
  return {
    uid,
    name: (data.name as string) ?? '',
    createdAt: (data.createdAt as { toMillis?: () => number })?.toMillis?.() ?? Date.now(),
  };
}

export async function fetchProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'profiles', uid));
  if (!snap.exists()) return null;
  return fromDoc(uid, snap.data());
}

export async function createProfile(uid: string, name: string): Promise<UserProfile> {
  const trimmed = name.trim();
  await setDoc(doc(db, 'profiles', uid), {
    name: trimmed,
    createdAt: serverTimestamp(),
  });
  return { uid, name: trimmed, createdAt: Date.now() };
}

export async function updateProfileName(uid: string, name: string): Promise<void> {
  const trimmed = name.trim();
  await updateDoc(doc(db, 'profiles', uid), { name: trimmed });
}
