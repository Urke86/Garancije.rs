import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Text,
  StyleSheet,
  SectionList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  View,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { fontFamily } from '@/lib/typography';
import { layout, space } from '@/lib/spacing';
import { Bell, Check, Clock } from 'lucide-react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { StackScreenHeader } from '@/components/ui/StackScreenHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { NotificationPermissionBanner } from '@/components/ui/NotificationPermissionBanner';
import { useScrollInsets } from '@/hooks/useScrollInsets';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useReminderBadge } from '@/hooks/useReminderBadge';
import { groupRemindersByDate } from '@/lib/reminder-groups';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { useColors } from '@/contexts/ThemeContext';

interface Reminder {
  id: string;
  remind_at: string;
  type: string;
  message: string;
  is_sent: boolean;
  is_dismissed: boolean;
  offset_days: number | null;
  receipt_item_id: string;
  receipt_items: { name: string; receipts: { store_name: string } };
}

export default function RemindersScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();

  const { user } = useAuth();
  const scrollInsets = useScrollInsets();
  const { register } = usePushNotifications();
  const { refresh: refreshBadge } = useReminderBadge();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadReminders = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('reminders')
      .select(
        `id, remind_at, type, message, is_sent, is_dismissed, offset_days, receipt_item_id,
         receipt_items(name, receipts(store_name))`,
      )
      .eq('user_id', user.id)
      .order('remind_at', { ascending: true });

    if (data) setReminders(data as unknown as Reminder[]);
    refreshBadge();
  }, [user, refreshBadge]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  useFocusEffect(
    useCallback(() => {
      loadReminders();
    }, [loadReminders]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReminders();
    setRefreshing(false);
  };

  const dismissReminder = async (id: string) => {
    await supabase.from('reminders').update({ is_dismissed: true }).eq('id', id);
    setReminders((prev) =>
      prev.map((r) => (r.id === id ? { ...r, is_dismissed: true } : r)),
    );
    refreshBadge();
  };

  const snoozeReminder = async (id: string, days: number) => {
    const reminder = reminders.find((r) => r.id === id);
    if (!reminder) return;
    const next = new Date(reminder.remind_at);
    next.setDate(next.getDate() + days);
    await supabase
      .from('reminders')
      .update({ remind_at: next.toISOString(), is_sent: false })
      .eq('id', id);
    await loadReminders();
  };

  const showSnoozeOptions = (id: string) => {
    Alert.alert('Odloži podsetnik', 'Za koliko da vas ponovo podsetimo?', [
      { text: '1 dan', onPress: () => snoozeReminder(id, 1) },
      { text: '7 dana', onPress: () => snoozeReminder(id, 7) },
      { text: 'Otkaži', style: 'cancel' },
    ]);
  };

  const pending = useMemo(
    () => reminders.filter((r) => !r.is_dismissed && !r.is_sent),
    [reminders],
  );
  const dismissed = useMemo(
    () => reminders.filter((r) => r.is_dismissed || r.is_sent),
    [reminders],
  );

  const groupedPending = useMemo(() => groupRemindersByDate(pending), [pending]);

  const sections = useMemo(() => {
    const result = groupedPending.map((g) => ({
      title: g.label,
      data: g.items,
    }));
    if (dismissed.length > 0) {
      result.push({ title: 'Završeni', data: dismissed });
    }
    return result;
  }, [groupedPending, dismissed]);

  const renderReminder = (item: Reminder, showActions: boolean) => {
    const isPast = new Date(item.remind_at) <= new Date();
    const urgent = isPast && !item.is_dismissed && !item.is_sent;
    const completed = item.is_dismissed || item.is_sent;

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={() => router.push(`/receipt/item/${item.receipt_item_id}`)}
        onLongPress={showActions ? () => showSnoozeOptions(item.id) : undefined}
        accessibilityRole="button"
        accessibilityLabel={`${item.message}, ${item.receipt_items?.name}`}
        accessibilityHint={
          showActions
            ? 'Pritisnite za detalje stavke. Dugi pritisak za odložiti podsetnik.'
            : undefined
        }
      >
        <Card
          style={[
            styles.reminderCard,
            completed && styles.dismissed,
            urgent && styles.urgentBorder,
          ]}
        >
          <View style={[styles.iconContainer, urgent && styles.iconUrgent]}>
            {completed ? (
              <Check size={18} color={colors.textMuted} />
            ) : (
              <Bell size={18} color={urgent ? colors.textInverse : colors.primary} />
            )}
          </View>
          <View style={styles.content}>
            <Text style={[styles.message, completed && styles.messageDismissed]}>
              {item.message}
            </Text>
            <Text style={styles.meta}>
              {item.receipt_items?.name} — {item.receipt_items?.receipts?.store_name}
            </Text>
            <View style={styles.dateRow}>
              <Clock size={12} color={colors.textMuted} />
              <Text style={styles.date}>
                {new Date(item.remind_at).toLocaleDateString('sr-RS', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          </View>
          {showActions ? (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={styles.snoozeButton}
                onPress={(e) => {
                  e.stopPropagation?.();
                  showSnoozeOptions(item.id);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Odloži podsetnik"
              >
                <Clock size={18} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dismissButton}
                onPress={(e) => {
                  e.stopPropagation?.();
                  dismissReminder(item.id);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityRole="button"
                accessibilityLabel="Označi podsetnik kao završen"
              >
                <Check size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
          ) : null}
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <AppScreen>
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderItem={({ item, section }) =>
          renderReminder(item, section.title !== 'Završeni')
        }
        renderSectionHeader={({ section: { title } }) => (
          <Text style={styles.sectionTitle}>{title}</Text>
        )}
        ListHeaderComponent={
          <View style={styles.headerPad}>
            <StackScreenHeader
              title="Podsetnici"
              subtitle={`${pending.length} aktivnih podsetnika`}
            />
            <NotificationPermissionBanner onPermissionGranted={() => register()} />
            {pending.length === 0 && dismissed.length === 0 ? null : (
              <Text style={styles.hint}>
                Koristite dugme sa sata pored podsetnika da ga odložite za 1 ili 7 dana
              </Text>
            )}
          </View>
        }
        contentContainerStyle={[
          styles.list,
          { paddingBottom: scrollInsets.paddingBottom },
          reminders.length === 0 && styles.listEmpty,
        ]}
        stickySectionHeadersEnabled={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <EmptyState
            title="Nema podsetnika"
            description="Podsetnici se kreiraju automatski kada dodate proizvode sa garancijom."
          />
        }
      />
    </AppScreen>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  headerPad: { paddingHorizontal: layout.gutter },
  list: {},
  listEmpty: { flexGrow: 1 },
  hint: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    marginBottom: space.sm,
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: fontFamily.semibold,
    color: colors.textSecondary,
    marginHorizontal: layout.gutter,
    marginTop: space.md,
    marginBottom: space.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: layout.gutter,
    marginBottom: layout.stack,
  },
  dismissed: { opacity: 0.55 },
  urgentBorder: {
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: layout.radius - 4,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: space.md,
  },
  iconUrgent: { backgroundColor: colors.primary },
  content: { flex: 1 },
  message: {
    fontSize: 14,
    fontFamily: fontFamily.semibold,
    color: colors.text,
  },
  messageDismissed: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
    fontFamily: fontFamily.regular,
  },
  meta: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    marginTop: space.xs,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    marginTop: space.xs,
  },
  date: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  snoozeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 184, 217, 0.2)',
  },
  dismissButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
