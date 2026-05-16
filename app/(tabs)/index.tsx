import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/colors';
import { getDaysUntilExpiry, getWarrantyStatus } from '@/lib/warranty';
import { Camera, ShieldCheck, TriangleAlert as AlertTriangle, Circle as XCircle } from 'lucide-react-native';

interface WarrantyItem {
  id: string;
  name: string;
  warranty_expires_at: string;
  receipt_id: string;
  category: string;
  receipts: { store_name: string };
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [items, setItems] = useState<WarrantyItem[]>([]);
  const [stats, setStats] = useState({ total: 0, active: 0, expiring: 0, expired: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('receipt_items')
      .select('id, name, warranty_expires_at, receipt_id, category, receipts(store_name)')
      .eq('user_id', user.id)
      .not('warranty_expires_at', 'is', null)
      .order('warranty_expires_at', { ascending: true });

    if (data) {
      setItems(data as unknown as WarrantyItem[]);
      const active = data.filter((i) => getWarrantyStatus(i.warranty_expires_at!) === 'active').length;
      const expiring = data.filter((i) => getWarrantyStatus(i.warranty_expires_at!) === 'expiring').length;
      const expired = data.filter((i) => getWarrantyStatus(i.warranty_expires_at!) === 'expired').length;
      setStats({ total: data.length, active, expiring, expired });
    }
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const expiringItems = items.filter((i) => getWarrantyStatus(i.warranty_expires_at) === 'expiring');

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={styles.greeting}>Zdravo!</Text>
        <Text style={styles.subtitle}>Vaš digitalni garancijski novčanik</Text>
      </View>

      <View style={styles.statsRow}>
        <View style={[styles.statCard, { backgroundColor: colors.successLight }]}>
          <ShieldCheck size={20} color={colors.success} />
          <Text style={[styles.statNumber, { color: colors.success }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Aktivne</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.warningLight }]}>
          <AlertTriangle size={20} color={colors.warning} />
          <Text style={[styles.statNumber, { color: colors.warning }]}>{stats.expiring}</Text>
          <Text style={styles.statLabel}>Ističu</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: colors.errorLight }]}>
          <XCircle size={20} color={colors.error} />
          <Text style={[styles.statNumber, { color: colors.error }]}>{stats.expired}</Text>
          <Text style={styles.statLabel}>Istekle</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.scanButton} onPress={() => router.push('/(tabs)/scan')}>
        <Camera size={24} color={colors.textInverse} />
        <Text style={styles.scanButtonText}>Skeniraj novi račun</Text>
      </TouchableOpacity>

      {expiringItems.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Uskoro ističe garancija</Text>
          {expiringItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.warningCard}
              onPress={() => router.push(`/receipt/${item.receipt_id}`)}
            >
              <View style={styles.warningIcon}>
                <AlertTriangle size={18} color={colors.warning} />
              </View>
              <View style={styles.warningContent}>
                <Text style={styles.warningName}>{item.name}</Text>
                <Text style={styles.warningStore}>{item.receipts?.store_name}</Text>
              </View>
              <Text style={styles.warningDays}>
                {getDaysUntilExpiry(item.warranty_expires_at)} dana
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {items.length === 0 && (
        <View style={styles.emptyState}>
          <ShieldCheck size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>Nemate sačuvanih računa</Text>
          <Text style={styles.emptyText}>Skenirajte prvi račun da biste počeli da pratite garancije</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 60 },
  header: { marginBottom: 24 },
  greeting: { fontSize: 28, fontFamily: 'Inter-Bold', color: colors.text },
  subtitle: { fontSize: 15, fontFamily: 'Inter-Regular', color: colors.textSecondary, marginTop: 4 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    gap: 6,
  },
  statNumber: { fontSize: 24, fontFamily: 'Inter-Bold' },
  statLabel: { fontSize: 12, fontFamily: 'Inter-Medium', color: colors.textSecondary },
  scanButton: {
    backgroundColor: colors.primary,
    borderRadius: 16,
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 32,
  },
  scanButtonText: { color: colors.textInverse, fontSize: 16, fontFamily: 'Inter-SemiBold' },
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 18, fontFamily: 'Inter-SemiBold', color: colors.text, marginBottom: 12 },
  warningCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.warningLight,
  },
  warningIcon: { marginRight: 12 },
  warningContent: { flex: 1 },
  warningName: { fontSize: 15, fontFamily: 'Inter-Medium', color: colors.text },
  warningStore: { fontSize: 13, fontFamily: 'Inter-Regular', color: colors.textSecondary, marginTop: 2 },
  warningDays: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: colors.warning },
  emptyState: { alignItems: 'center', paddingVertical: 48, gap: 12 },
  emptyTitle: { fontSize: 18, fontFamily: 'Inter-SemiBold', color: colors.text },
  emptyText: { fontSize: 14, fontFamily: 'Inter-Regular', color: colors.textSecondary, textAlign: 'center' },
});
