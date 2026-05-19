import { usePushNotifications } from '@/hooks/usePushNotifications';

/** Registers push token and handles notification tap routing. */
export function PushNotificationsBootstrap() {
  usePushNotifications();
  return null;
}
