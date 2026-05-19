export type ReminderGroupKey = 'today' | 'week' | 'later' | 'past';

export const REMINDER_GROUP_LABELS: Record<ReminderGroupKey, string> = {
  today: 'Danas',
  week: 'Ove nedelje',
  later: 'Kasnije',
  past: 'Prošlo',
};

export function getReminderGroup(remindAt: string): ReminderGroupKey {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const date = new Date(remindAt);
  date.setHours(0, 0, 0, 0);
  const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return 'past';
  if (diffDays === 0) return 'today';
  if (diffDays <= 7) return 'week';
  return 'later';
}

export interface GroupedReminders<T> {
  key: ReminderGroupKey;
  label: string;
  items: T[];
}

export function groupRemindersByDate<T extends { remind_at: string }>(
  items: T[],
): GroupedReminders<T>[] {
  const order: ReminderGroupKey[] = ['today', 'week', 'later', 'past'];
  const buckets = new Map<ReminderGroupKey, T[]>();

  for (const item of items) {
    const key = getReminderGroup(item.remind_at);
    const list = buckets.get(key) ?? [];
    list.push(item);
    buckets.set(key, list);
  }

  return order
    .filter((key) => (buckets.get(key)?.length ?? 0) > 0)
    .map((key) => ({
      key,
      label: REMINDER_GROUP_LABELS[key],
      items: buckets.get(key)!,
    }));
}
