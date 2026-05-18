import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/** PKCE code_verifier must survive full-page OAuth redirect on web — use localStorage. */
export const authStorage =
  Platform.OS === 'web' && typeof window !== 'undefined'
    ? {
        getItem: (key: string) => Promise.resolve(window.localStorage.getItem(key)),
        setItem: (key: string, value: string) => {
          window.localStorage.setItem(key, value);
          return Promise.resolve();
        },
        removeItem: (key: string) => {
          window.localStorage.removeItem(key);
          return Promise.resolve();
        },
      }
    : AsyncStorage;
