import { supabase } from '@/lib/supabase';
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

export const OFFSET_OPTIONS = [
  { days: 30, label: '30 dana pre' },
  { days: 14, label: '14 dana pre' },
  { days: 7, label: '7 dana pre' },
  { days: 1, label: '1 dan pre' },
] as const;
