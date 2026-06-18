import { useEffect, useRef, useCallback, useState } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useColors } from '@/contexts/ThemeContext';
import {
  registerForPushNotifications,
  resolveNotificationTapAction,
  openPlayStoreUrl,
  getPushPermissionStatus,
  ensureAndroidNotificationChannels,
  type PushPermissionStatus,
} from '@/lib/notifications';

export function usePushNotifications() {
  const { user } = useAuth();
  const colors = useColors();
  const [permission, setPermission] = useState<PushPermissionStatus>('undetermined');
  const registeredRef = useRef<string | null>(null);
  const handledNotificationIdRef = useRef<string | null>(null);

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

  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const notificationId = response.notification.request.identifier;
      if (handledNotificationIdRef.current === notificationId) return;
      handledNotificationIdRef.current = notificationId;

      const data = response.notification.request.content.data as Record<string, unknown>;
      const action = resolveNotificationTapAction(data);

      if (action.kind === 'open_store') {
        void openPlayStoreUrl(action.url);
        return;
      }

      if (action.kind === 'receipt_item') {
        router.push(`/receipt/item/${action.receiptItemId}`);
      } else {
        router.push('/reminders');
      }
    },
    [],
  );

  useEffect(() => {
    refreshPermission();
    void ensureAndroidNotificationChannels(colors.primary);
  }, [refreshPermission, colors.primary]);

  useEffect(() => {
    if (!user || Platform.OS === 'web') return;
    register();
  }, [user, register]);

  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    // Kad je app bio zatvoren, tap samo pokrene app — listener još nije registrovan.
    void Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationResponse(response);
        void Notifications.clearLastNotificationResponseAsync();
      }
    });

    return () => sub.remove();
  }, [handleNotificationResponse]);

  return { permission, refreshPermission, register, requestPermissions: register };
}
