// `firebase/auth`'s published type declarations resolve to a platform-neutral
// surface that omits `getReactNativePersistence`, even though the function is
// exported at runtime when Metro bundles the React Native build of
// `@firebase/auth` (see src/config/firebase.ts). This augmentation just adds
// the missing type so TypeScript knows about it too.
import type { Persistence, ReactNativeAsyncStorage } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: ReactNativeAsyncStorage): Persistence;
}
