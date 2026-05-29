import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ThemeMode } from '@/lib/theme';

const KEY_PREFIX = 'garancije-theme';

function storageKey(userId: string | null): string {
  return userId ? `${KEY_PREFIX}:${userId}` : `${KEY_PREFIX}:guest`;
}

export async function loadThemeMode(userId: string | null): Promise<ThemeMode> {
  const stored = await AsyncStorage.getItem(storageKey(userId));
  return stored === 'dark' ? 'dark' : 'light';
}

export async function saveThemeMode(userId: string | null, mode: ThemeMode): Promise<void> {
  await AsyncStorage.setItem(storageKey(userId), mode);
}
