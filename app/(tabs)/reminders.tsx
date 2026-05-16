import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/colors';
import { Bell, BellOff, Check } from 'lucide-react-native';

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
    return (
      <View style={[styles.card, item.is_sent && styles.cardDismissed]}>
        <View style={[styles.iconContainer, isPast && !item.is_sent && styles.iconActive]}>
          {item.is_sent ? (
            <Check size={18} color={colors.textMuted} />
          ) : (
            <Bell size={18} color={isPast ? colors.textInverse : colors.primary} />
          )}
        </View>
        <View style={styles.content}>
          <Text style={[styles.message, item.is_sent && styles.messageDismissed]}>{item.message}</Text>
          <Text style={styles.meta}>
            {item.receipt_items?.name} - {item.receipt_items?.receipts?.store_name}
          </Text>
          <Text style={styles.date}>
            {new Date(item.remind_at).toLocaleDateString('sr-RS', { day: 'numeric', month: 'long', year: 'numeric' })}
          </Text>
        </View>
        {!item.is_sent && (
          <TouchableOpacity style={styles.dismissButton} onPress={() => dismissReminder(item.id)}>
            <Check size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Podsetnici</Text>
        <Text style={styles.subtitle}>{pending.length} aktivnih podsetnika</Text>
      </View>
      <FlatList
        data={[...pending, ...dismissed]}
        keyExtractor={(item) => item.id}
        renderItem={renderReminder}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <BellOff size={48} color={colors.textMuted} />
            <Text style={styles.emptyTitle}>Nema podsetnika</Text>
            <Text style={styles.emptyText}>Podsetnici se kreiraju automatski kada dodate proizvode sa garancijom</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 16 },
  title: { fontSize: 24, fontFamily: 'Inter-Bold', color: colors.text },
  subtitle: { fontSize: 14, fontFamily: 'Inter-Regular', color: colors.textSecondary, marginTop: 4 },
  list: { padding: 24, paddingTop: 0, gap: 12 },
  card: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 16,
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border,
  },
  cardDismissed: { opacity: 0.6 },
  iconContainer: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: colors.primaryLight + '20',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  iconActive: { backgroundColor: colors.primary },
  content: { flex: 1 },
  message: { fontSize: 14, fontFamily: 'Inter-Medium', color: colors.text },
  messageDismissed: { textDecorationLine: 'line-through', color: colors.textMuted },
  meta: { fontSize: 13, fontFamily: 'Inter-Regular', color: colors.textSecondary, marginTop: 2 },
  date: { fontSize: 12, fontFamily: 'Inter-Regular', color: colors.textMuted, marginTop: 4 },
  dismissButton: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: colors.surfaceAlt,
    alignItems: 'center', justifyContent: 'center',
  },
  empty: { alignItems: 'center', paddingVertical: 64, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter-SemiBold', color: colors.text },
  emptyText: { fontSize: 14, fontFamily: 'Inter-Regular', color: colors.textSecondary, textAlign: 'center', paddingHorizontal: 32 },
});
