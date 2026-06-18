import { Linking, Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/colors';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type PushPermissionStatus = 'granted' | 'denied' | 'undetermined';

export async function getPushPermissionStatus(): Promise<PushPermissionStatus> {
  if (Platform.OS === 'web') return 'denied';
  const { status } = await Notifications.getPermissionsAsync();
  if (status === 'granted') return 'granted';
  if (status === 'denied') return 'denied';
  return 'undetermined';
}

export async function ensureAndroidNotificationChannels(lightColor?: string): Promise<void> {
  if (Platform.OS !== 'android') return;

  const channelColor = lightColor || colors.primary;

  await Notifications.setNotificationChannelAsync('reminders', {
    name: 'Podsetnici garancije',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: channelColor,
    sound: 'default',
  });
  await Notifications.setNotificationChannelAsync('app_updates', {
    name: 'Ažuriranja aplikacije',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: channelColor,
    sound: 'default',
  });
}

export async function requestPushPermissions(): Promise<PushPermissionStatus> {
  if (Platform.OS === 'web' || !Device.isDevice) return 'denied';

  const existing = await Notifications.getPermissionsAsync();
  let finalStatus = existing.status;

  if (existing.status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    finalStatus = requested.status;
  }

  if (finalStatus !== 'granted') return 'denied';

  await ensureAndroidNotificationChannels();

  return 'granted';
}

export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === 'web' || !Device.isDevice) return null;

  const projectId =
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId;

  if (!projectId) {
    console.warn('EAS projectId missing — push token unavailable');
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({ projectId });
    return token.data;
  } catch (err) {
    console.warn('Failed to get Expo push token:', err);
    return null;
  }
}

export async function savePushToken(userId: string, token: string): Promise<void> {
  const platform =
    Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

  await supabase.from('push_tokens').upsert(
    {
      user_id: userId,
      expo_push_token: token,
      platform,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'expo_push_token' },
  );
}

export async function registerForPushNotifications(userId: string): Promise<{
  token: string | null;
  permission: PushPermissionStatus;
}> {
  const permission = await requestPushPermissions();
  if (permission !== 'granted') {
    return { token: null, permission };
  }

  const token = await getExpoPushToken();
  if (token) {
    await savePushToken(userId, token);
  }

  return { token, permission };
}

export const PLAY_STORE_URL =
  'https://play.google.com/store/apps/details?id=rs.garancije.app';

const PLAY_STORE_PACKAGE = 'rs.garancije.app';

export type NotificationTapAction =
  | { kind: 'open_store'; url: string }
  | { kind: 'receipt_item'; receiptItemId: string }
  | { kind: 'reminders' };

export function parseNotificationData(
  data: Record<string, unknown> | undefined,
): {
  receiptItemId?: string;
  reminderId?: string;
  type?: string;
  url?: string;
} {
  if (!data) return {};
  return {
    receiptItemId: typeof data.receiptItemId === 'string' ? data.receiptItemId : undefined,
    reminderId: typeof data.reminderId === 'string' ? data.reminderId : undefined,
    type: data.type != null ? String(data.type) : undefined,
    url: data.url != null ? String(data.url) : undefined,
  };
}

/** Šta uraditi kad korisnik tapne notifikaciju. */
export function resolveNotificationTapAction(
  data: Record<string, unknown> | undefined,
): NotificationTapAction {
  const parsed = parseNotificationData(data);

  if (parsed.type === 'app_update') {
    return { kind: 'open_store', url: parsed.url || PLAY_STORE_URL };
  }
  if (parsed.receiptItemId) {
    return { kind: 'receipt_item', receiptItemId: parsed.receiptItemId };
  }
  return { kind: 'reminders' };
}

/** Otvara Play Store (market:// na Androidu, zatim https fallback). */
export async function openPlayStoreUrl(url: string = PLAY_STORE_URL): Promise<void> {
  if (Platform.OS === 'android') {
    const marketUrl = `market://details?id=${PLAY_STORE_PACKAGE}`;
    const canOpenMarket = await Linking.canOpenURL(marketUrl);
    if (__DEV__) {
      console.log('[push] market:// canOpenURL:', canOpenMarket);
    }
    if (canOpenMarket) {
      await Linking.openURL(marketUrl);
      return;
    }
  }
  await Linking.openURL(url);
}
