import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/colors';
import { fontFamily } from '@/lib/typography';
import { getWarrantyStatus } from '@/lib/warranty';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { ReceiptListCard, type ReceiptItemPreview } from '@/components/ui/ReceiptListCard';
import { EmptyState } from '@/components/ui/EmptyState';

interface ReceiptWithItems {
  id: string;
  store_name: string;
  purchase_date: string;
  total_amount: number;
  receipt_items: ReceiptItemPreview[];
}

type FilterKey = 'all' | 'active' | 'expiring' | 'expired';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'all', label: 'Sve' },
  { key: 'active', label: 'Aktivne' },
  { key: 'expiring', label: 'Ističu' },
  { key: 'expired', label: 'Istekle' },
];

export default function TimelineScreen() {
  const { user } = useAuth();
  const [receipts, setReceipts] = useState<ReceiptWithItems[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterKey>('all');

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
      .map((i) => getWarrantyStatus(i.warranty_expires_at!));
    if (statuses.includes('expiring')) return 'expiring';
    if (statuses.every((s) => s === 'expired')) return 'expired';
    return 'active';
  };

  const filtered = useMemo(() => {
    if (filter === 'all') return receipts;
    return receipts.filter((r) => getReceiptStatus(r.receipt_items) === filter);
  }, [receipts, filter]);

  return (
    <AppScreen>
      <View style={styles.flex}>
        <View style={styles.headerPad}>
          <ScreenHeader
            title="Kupovine"
            subtitle={`${receipts.length} računa ukupno`}
          />
          <View style={styles.chips}>
            {FILTERS.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.chip, filter === f.key && styles.chipActive]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ReceiptListCard
              id={item.id}
              storeName={item.store_name}
              purchaseDate={item.purchase_date}
              totalAmount={item.total_amount}
              receiptItems={item.receipt_items}
              onPress={() => router.push(`/receipt/${item.id}`)}
            />
          )}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              title={filter === 'all' ? 'Nemate sačuvanih kupovina' : 'Nema računa u ovoj kategoriji'}
              description={
                filter === 'all'
                  ? 'Skenirajte fiskalni račun da biste ga sačuvali i pratili garancije.'
                  : 'Promenite filter ili dodajte novi račun.'
              }
              actionLabel={filter === 'all' ? 'Skeniraj račun' : undefined}
              onAction={filter === 'all' ? () => router.push('/(tabs)/scan') : undefined}
            />
          }
        />
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerPad: { paddingHorizontal: 20 },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textInverse,
  },
  list: { paddingHorizontal: 20, paddingBottom: 100 },
});
