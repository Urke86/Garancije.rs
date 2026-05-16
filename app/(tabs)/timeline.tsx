import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/colors';
import { getWarrantyStatus, getDaysUntilExpiry } from '@/lib/warranty';
import { Receipt, ShieldCheck, TriangleAlert as AlertTriangle, Circle as XCircle } from 'lucide-react-native';

interface ReceiptWithItems {
  id: string;
  store_name: string;
  purchase_date: string;
  total_amount: number;
  receipt_items: { id: string; name: string; warranty_expires_at: string; category: string }[];
}

export default function TimelineScreen() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<ReceiptWithItems[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadReceipts = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from('receipts')
      .select('id, store_name, purchase_date, total_amount, receipt_items(id, name, warranty_expires_at, category)')
      .eq('user_id', user.id)
      .order('purchase_date', { ascending: false });

    if (data) setReceipts(data as ReceiptWithItems[]);
  }, [user]);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReceipts();
    setRefreshing(false);
  };

  const getReceiptStatus = (items: ReceiptWithItems['receipt_items']) => {
    if (!items || items.length === 0) return 'active';
    const statuses = items
      .filter((i) => i.warranty_expires_at)
      .map((i) => getWarrantyStatus(i.warranty_expires_at));
    if (statuses.includes('expiring')) return 'expiring';
    if (statuses.every((s) => s === 'expired')) return 'expired';
    return 'active';
  };

  const StatusIcon = ({ status }: { status: string }) => {
    if (status === 'expiring') return <AlertTriangle size={16} color={colors.warning} />;
    if (status === 'expired') return <XCircle size={16} color={colors.error} />;
    return <ShieldCheck size={16} color={colors.success} />;
  };

  const renderReceipt = ({ item }: { item: ReceiptWithItems }) => {
    const status = getReceiptStatus(item.receipt_items);
    const nearestExpiry = item.receipt_items
      ?.filter((i) => i.warranty_expires_at && getWarrantyStatus(i.warranty_expires_at) !== 'expired')
      .sort((a, b) => new Date(a.warranty_expires_at).getTime() - new Date(b.warranty_expires_at).getTime())[0];

    return (
      <TouchableOpacity style={styles.card} onPress={() => router.push(`/receipt/${item.id}`)}>
        <View style={styles.cardHeader}>
          <View style={styles.cardIcon}>
            <Receipt size={20} color={colors.primary} />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.storeName}>{item.store_name || 'Nepoznata prodavnica'}</Text>
            <Text style={styles.date}>{new Date(item.purchase_date).toLocaleDateString('sr-RS')}</Text>
          </View>
          <Text style={styles.amount}>{Number(item.total_amount).toLocaleString('sr-RS')} RSD</Text>
        </View>
        {item.receipt_items && item.receipt_items.length > 0 && (
          <View style={styles.cardItems}>
            {item.receipt_items.slice(0, 3).map((ri) => (
              <View key={ri.id} style={styles.itemRow}>
                <StatusIcon status={ri.warranty_expires_at ? getWarrantyStatus(ri.warranty_expires_at) : 'active'} />
                <Text style={styles.itemName} numberOfLines={1}>{ri.name}</Text>
                {ri.warranty_expires_at && (
                  <Text style={[styles.itemExpiry, { color: getWarrantyStatus(ri.warranty_expires_at) === 'expired' ? colors.error : colors.textSecondary }]}>
                    {getDaysUntilExpiry(ri.warranty_expires_at) > 0
                      ? `${getDaysUntilExpiry(ri.warranty_expires_at)} dana`
                      : 'Istekla'}
                  </Text>
                )}
              </View>
            ))}
            {item.receipt_items.length > 3 && (
              <Text style={styles.moreItems}>+{item.receipt_items.length - 3} stavki</Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kupovine</Text>
        <Text style={styles.subtitle}>{receipts.length} računa ukupno</Text>
      </View>
      <FlatList
        data={receipts}
        keyExtractor={(item) => item.id}
        renderItem={renderReceipt}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Receipt size={48} color={colors.textMuted} />
            <Text style={styles.emptyText}>Nemate sačuvanih kupovina</Text>
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
    backgroundColor: colors.surface, borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: colors.border,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardIcon: {
    width: 40, height: 40, borderRadius: 10, backgroundColor: colors.primaryLight + '20',
    alignItems: 'center', justifyContent: 'center', marginRight: 12,
  },
  cardInfo: { flex: 1 },
  storeName: { fontSize: 15, fontFamily: 'Inter-SemiBold', color: colors.text },
  date: { fontSize: 13, fontFamily: 'Inter-Regular', color: colors.textSecondary, marginTop: 2 },
  amount: { fontSize: 15, fontFamily: 'Inter-SemiBold', color: colors.text },
  cardItems: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: colors.borderLight, gap: 8 },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemName: { flex: 1, fontSize: 14, fontFamily: 'Inter-Regular', color: colors.textSecondary },
  itemExpiry: { fontSize: 12, fontFamily: 'Inter-Medium' },
  moreItems: { fontSize: 13, fontFamily: 'Inter-Medium', color: colors.textMuted, marginTop: 4 },
  empty: { alignItems: 'center', paddingVertical: 64, gap: 12 },
  emptyText: { fontSize: 16, fontFamily: 'Inter-Medium', color: colors.textSecondary },
});
