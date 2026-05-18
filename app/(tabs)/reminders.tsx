import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/colors';
import { fontFamily } from '@/lib/typography';
import { Bell, Check } from 'lucide-react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';

interface Reminder {
  id: string;
  remind_at: string;
  type: string;
  message: string;
  is_sent: boolean;
  receipt_items: { name: string; receipts: { store_name: string } };
}

export default function RemindersScreen() {
  const { user } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadReminders = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('reminders')
      .select('id, remind_at, type, message, is_sent, receipt_items(name, receipts(store_name))')
      .eq('user_id', user.id)
      .order('remind_at', { ascending: true });

    if (data) setReminders(data as unknown as Reminder[]);
  }, [user]);

  useEffect(() => {
    loadReminders();
  }, [loadReminders]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReminders();
    setRefreshing(false);
  };

  const dismissReminder = async (id: string) => {
    await supabase.from('reminders').update({ is_sent: true }).eq('id', id);
    setReminders((prev) => prev.map((r) => (r.id === id ? { ...r, is_sent: true } : r)));
  };

  const pending = reminders.filter((r) => !r.is_sent);
  const dismissed = reminders.filter((r) => r.is_sent);

  const renderReminder = ({ item }: { item: Reminder }) => {
    const isPast = new Date(item.remind_at) <= new Date();
    const urgent = isPast && !item.is_sent;

    return (
      <Card
        style={[
          styles.reminderCard,
          item.is_sent && styles.dismissed,
          urgent && styles.urgentBorder,
        ]}
      >
        <View style={[styles.iconContainer, urgent && styles.iconUrgent]}>
          {item.is_sent ? (
            <Check size={18} color={colors.textMuted} />
          ) : (
            <Bell size={18} color={urgent ? colors.textInverse : colors.primary} />
          )}
        </View>
        <View style={styles.content}>
          <Text style={[styles.message, item.is_sent && styles.messageDismissed]}>
            {item.message}
          </Text>
          <Text style={styles.meta}>
            {item.receipt_items?.name} — {item.receipt_items?.receipts?.store_name}
          </Text>
          <Text style={styles.date}>
            {new Date(item.remind_at).toLocaleDateString('sr-RS', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </Text>
        </View>
        {!item.is_sent ? (
          <TouchableOpacity
            style={styles.dismissButton}
            onPress={() => dismissReminder(item.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Check size={18} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
      </Card>
    );
  };

  const listHeader = (
    <View style={styles.headerPad}>
      <ScreenHeader
        title="Podsetnici"
        subtitle={`${pending.length} aktivnih podsetnika`}
      />
      {pending.length > 0 ? <SectionHeader title="Aktivni" /> : null}
    </View>
  );

  const listFooter =
    dismissed.length > 0 ? (
      <View style={styles.footer}>
        <SectionHeader title="Završeni" />
        {dismissed.map((item) => (
          <View key={item.id}>{renderReminder({ item })}</View>
        ))}
      </View>
    ) : null;

  return (
    <AppScreen>
      <FlatList
        data={pending}
        keyExtractor={(item) => item.id}
        renderItem={renderReminder}
        ListHeaderComponent={listHeader}
        ListFooterComponent={listFooter}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          reminders.length === 0 ? (
            <EmptyState
              title="Nema podsetnika"
              description="Podsetnici se kreiraju automatski kada dodate proizvode sa garancijom."
            />
          ) : null
        }
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  headerPad: { paddingHorizontal: 20 },
  list: { paddingBottom: 100 },
  reminderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  dismissed: { opacity: 0.55 },
  urgentBorder: {
    borderLeftWidth: 4,
    borderLeftColor: colors.accent,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
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
    marginTop: 4,
  },
  date: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    marginTop: 4,
  },
  dismissButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: { marginTop: 8 },
});
