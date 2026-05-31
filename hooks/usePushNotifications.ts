import { useEffect, useRef, useCallback, useState } from 'react';
import { Linking, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import {
  registerForPushNotifications,
  parseNotificationData,
  getPushPermissionStatus,
  ensureAndroidNotificationChannels,
  type PushPermissionStatus,
} from '@/lib/notifications';

export function usePushNotifications() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<PushPermissionStatus>('undetermined');
  const registeredRef = useRef<string | null>(null);

  const refreshPermission = useCallback(async () => {
    const status = await getPushPermissionStatus();
    setPermission(status);
    return status;
  }, []);

  const register = useCallback(async () => {
    if (!user || Platform.OS === 'web') return null;
    const result = await registerForPushNotifications(user.id);
    setPermission(result.permission);
    if (result.token) registeredRef.current = result.token;
    return result;
  }, [user]);

  useEffect(() => {
    refreshPermission();
    void ensureAndroidNotificationChannels();
  }, [refreshPermission]);

  useEffect(() => {
    if (!user || Platform.OS === 'web') return;
    register();
  }, [user, register]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as Record<string, unknown>;
      const { receiptItemId, type, url } = parseNotificationData(data);

      if (type === 'app_update' && url) {
        void Linking.openURL(url);
        return;
      }

      if (receiptItemId) {
        router.push(`/receipt/item/${receiptItemId}`);
      } else {
        router.push('/reminders');
      }
    });
    return () => sub.remove();
  }, []);

  return { permission, refreshPermission, register, requestPermissions: register };
}
