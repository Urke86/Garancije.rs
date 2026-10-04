import AsyncStorage from '@react-native-async-storage/async-storage';

export type AppLocale = 'sr' | 'en';

const KEY_PREFIX = 'garancije-locale';
const DEVICE_KEY = `${KEY_PREFIX}:device`;

function storageKey(userId: string | null): string {
  return userId ? `${KEY_PREFIX}:${userId}` : `${KEY_PREFIX}:guest`;
}

function parseLocale(value: string | null): AppLocale | null {
  if (value === 'en' || value === 'sr') return value;
  return null;
}

async function readDeviceLocale(): Promise<AppLocale | null> {
  return parseLocale(await AsyncStorage.getItem(DEVICE_KEY));
}

export async function loadLocale(userId: string | null): Promise<AppLocale> {
  const stored = parseLocale(await AsyncStorage.getItem(storageKey(userId)));
  if (stored) return stored;

  if (userId) {
    const inherited =
      parseLocale(await AsyncStorage.getItem(storageKey(null))) ?? (await readDeviceLocale());
    if (inherited) {
      await AsyncStorage.setItem(storageKey(userId), inherited);
      return inherited;
    }
  }

  return (await readDeviceLocale()) ?? 'sr';
}

export async function saveLocale(userId: string | null, locale: AppLocale): Promise<void> {
  await AsyncStorage.multiSet([
    [storageKey(userId), locale],
    [DEVICE_KEY, locale],
  ]);
}

export function getDateLocale(locale: AppLocale): string {
  return locale === 'en' ? 'en-US' : 'sr-Latn-RS';
}
