import { supabase } from '@/lib/supabase';
import { t } from '@/lib/i18n';
import { DEFAULT_REMINDER_OFFSETS } from '@/lib/reminders';

export interface NotificationPreferences {
  enabled: boolean;
  offsets_days: number[];
}

export async function getNotificationPreferences(
  userId: string,
): Promise<NotificationPreferences> {
  const { data } = await supabase
    .from('notification_preferences')
    .select('enabled, offsets_days')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data) {
    return { enabled: true, offsets_days: [...DEFAULT_REMINDER_OFFSETS] };
  }

  return {
    enabled: data.enabled ?? true,
    offsets_days: (data.offsets_days as number[]) ?? [...DEFAULT_REMINDER_OFFSETS],
  };
}

export async function upsertNotificationPreferences(
  userId: string,
  prefs: NotificationPreferences,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('notification_preferences').upsert(
    {
      user_id: userId,
      enabled: prefs.enabled,
      offsets_days: prefs.offsets_days,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );

  return { error: error?.message ?? null };
}

export function getOffsetOptions() {
  return [
    { days: 30, label: t('notifications.offset30Days') },
    { days: 14, label: t('notifications.offset14Days') },
    { days: 7, label: t('notifications.offset7Days') },
    { days: 1, label: t('notifications.offset1Day') },
  ] as const;
}
