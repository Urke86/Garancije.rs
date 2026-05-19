import { supabase } from '@/lib/supabase';

export const DEFAULT_REMINDER_OFFSETS = [30, 14, 7, 1] as const;

export type ReminderOffset = (typeof DEFAULT_REMINDER_OFFSETS)[number];

export function buildReminderMessage(name: string, offsetDays: number): string {
  if (offsetDays === 1) {
    return `Garancija za „${name}” ističe sutra`;
  }
  return `Garancija za „${name}” ističe za ${offsetDays} dana`;
}

export function computeRemindAt(warrantyExpiresAt: string, offsetDays: number): Date | null {
  const expiry = new Date(warrantyExpiresAt);
  const remind = new Date(expiry);
  remind.setDate(remind.getDate() - offsetDays);
  remind.setHours(9, 0, 0, 0);
  if (remind <= new Date()) return null;
  return remind;
}

export async function getUserReminderOffsets(userId: string): Promise<number[]> {
  const { data } = await supabase
    .from('notification_preferences')
    .select('offsets_days, enabled')
    .eq('user_id', userId)
    .maybeSingle();

  if (!data || data.enabled === false) return [];

  const offsets = data.offsets_days as number[] | null;
  if (!offsets?.length) return [...DEFAULT_REMINDER_OFFSETS];
  return offsets.filter((d) => d > 0).sort((a, b) => b - a);
}

export async function syncRemindersForItem(
  userId: string,
  itemId: string,
  name: string,
  warrantyExpiresAt: string,
): Promise<void> {
  await supabase.from('reminders').delete().eq('receipt_item_id', itemId).eq('user_id', userId);

  const offsets = await getUserReminderOffsets(userId);
  if (offsets.length === 0) return;

  const rows: {
    user_id: string;
    receipt_item_id: string;
    remind_at: string;
    type: string;
    message: string;
    offset_days: number;
  }[] = [];

  for (const offsetDays of offsets) {
    const remindAt = computeRemindAt(warrantyExpiresAt, offsetDays);
    if (!remindAt) continue;
    rows.push({
      user_id: userId,
      receipt_item_id: itemId,
      remind_at: remindAt.toISOString(),
      type: 'warranty_expiring',
      message: buildReminderMessage(name, offsetDays),
      offset_days: offsetDays,
    });
  }

  if (rows.length > 0) {
    await supabase.from('reminders').insert(rows);
  }
}

export async function createRemindersForItem(
  userId: string,
  itemId: string,
  name: string,
  warrantyExpiresAt: string,
): Promise<void> {
  await syncRemindersForItem(userId, itemId, name, warrantyExpiresAt);
}
