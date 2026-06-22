import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { fontFamily } from '@/lib/typography';
import { getWarrantyStatus } from '@/lib/warranty';
import { filterReceiptsByQuery } from '@/lib/receipt-search';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { SearchField } from '@/components/ui/SearchField';
import { ReceiptListCard, type ReceiptItemPreview } from '@/components/ui/ReceiptListCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useScrollInsets } from '@/hooks/useScrollInsets';
import { layout, space } from '@/lib/spacing';
import { getSupabaseErrorMessage } from '@/lib/supabase-errors';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { useColors } from '@/contexts/ThemeContext';

interface ReceiptWithItems {
  id: string;
  store_name: string;
  purchase_date: string;
  total_amount: number;
  pib: string | null;
  receipt_number: string | null;
  image_url: string | null;
  receipt_items: ReceiptItemPreview[];
}

type FilterKey = 'all' | 'active' | 'expiring' | 'expired';

export default function TimelineScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const colors = useColors();

  const { user } = useAuth();
  const scrollInsets = useScrollInsets({ tabBar: true });
  const [receipts, setReceipts] = useState<ReceiptWithItems[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const filters = useMemo(
    (): { key: FilterKey; label: string }[] => [
      { key: 'all', label: t('timeline.filterAll') },
      { key: 'active', label: t('timeline.filterActive') },
      { key: 'expiring', label: t('timeline.filterExpiring') },
      { key: 'expired', label: t('timeline.filterExpired') },
    ],
    [t],
  );

  const loadReceipts = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('receipts')
      .select(
        `id, store_name, purchase_date, total_amount, pib, receipt_number, image_url,
         receipt_items(id, name, category, price, warranty_expires_at)`,
      )
      .eq('user_id', user.id)
      .order('purchase_date', { ascending: false });

    const err = getSupabaseErrorMessage(error);
    if (err) {
      setLoadError(err);
      setLoading(false);
      return;
    }
    setLoadError(null);
    setReceipts((data ?? []) as ReceiptWithItems[]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadReceipts();
  }, [loadReceipts]);

  useFocusEffect(
    useCallback(() => {
      loadReceipts();
    }, [loadReceipts]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadReceipts();
    setRefreshing(false);
  };

  const getReceiptStatus = (items: ReceiptWithItems['receipt_items']) => {
    if (!items || items.length === 0) return 'active';
    const withWarranty = items.filter((i) => i.warranty_expires_at);
    if (withWarranty.length === 0) return 'active';
    const statuses = withWarranty.map((i) => getWarrantyStatus(i.warranty_expires_at!));
    if (statuses.includes('expiring')) return 'expiring';
    if (statuses.every((s) => s === 'expired')) return 'expired';
    return 'active';
  };

  const filteredByStatus = useMemo(() => {
    if (filter === 'all') return receipts;
    return receipts.filter((r) => getReceiptStatus(r.receipt_items) === filter);
  }, [receipts, filter]);

  const displayed = useMemo(
    () => filterReceiptsByQuery(filteredByStatus, searchQuery),
    [filteredByStatus, searchQuery],
  );

  const isSearching = searchQuery.trim().length > 0;

  const subtitle = useMemo(() => {
    if (isSearching) {
      const n = displayed.length;
      return n === 0
        ? t('timeline.subtitleNoResults')
        : t('timeline.subtitleResult', { count: n });
    }
    return t('timeline.subtitleReceipt', { count: receipts.length });
  }, [isSearching, displayed.length, receipts.length, t]);

  const emptyState = useMemo(() => {
    if (loadError && !isSearching && filter === 'all') {
      return {
        title: t('timeline.emptyLoadErrorTitle'),
        description: loadError,
        actionLabel: t('common.tryAgain'),
        onAction: () => {
          setLoading(true);
          loadReceipts();
        },
      };
    }
    if (isSearching) {
      return {
        title: t('timeline.emptyNoResultsTitle'),
        description: t('timeline.emptyNoResultsDesc', { query: searchQuery.trim() }),
        actionLabel: undefined as string | undefined,
        onAction: undefined,
      };
    }
    if (filter !== 'all') {
      return {
        title: t('timeline.emptyFilterTitle'),
        description: t('timeline.emptyFilterDesc'),
        actionLabel: undefined,
        onAction: undefined,
      };
    }
    return {
      title: t('timeline.emptyNoPurchasesTitle'),
      description: t('timeline.emptyNoPurchasesDesc'),
      actionLabel: t('timeline.emptyAddReceipt'),
      onAction: () => router.push('/(tabs)/scan'),
    };
  }, [isSearching, searchQuery, filter, loadError, loadReceipts, t]);

  return (
    <AppScreen>
      <View style={styles.flex}>
        <View style={styles.headerPad}>
          <ScreenHeader title={t('timeline.title')} subtitle={subtitle} />

          <SearchField
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={t('timeline.searchPlaceholder')}
          />

          <View style={styles.chips}>
            {filters.map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.chip, filter === f.key && styles.chipActive]}
                onPress={() => setFilter(f.key)}
                activeOpacity={0.85}
                accessibilityRole="button"
                accessibilityState={{ selected: filter === f.key }}
                accessibilityLabel={t('timeline.filter_a11y', { label: f.label })}
              >
                <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {isSearching && displayed.length > 0 ? (
            <Text style={styles.searchHint}>
              {t('timeline.searchHint', {
                shown: displayed.length,
                total: filteredByStatus.length,
                scope:
                  filter === 'all'
                    ? t('timeline.searchHintScopeAll')
                    : t('timeline.searchHintScopeFilter'),
              })}
            </Text>
          ) : null}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : null}

        <FlatList
          data={loading ? [] : displayed}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          renderItem={({ item }) => (
            <ReceiptListCard
              id={item.id}
              storeName={item.store_name}
              purchaseDate={item.purchase_date}
              totalAmount={item.total_amount}
              imageUrl={item.image_url}
              receiptItems={item.receipt_items}
              onPress={() => router.push(`/receipt/${item.id}`)}
            />
          )}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: scrollInsets.paddingBottom },
            displayed.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListEmptyComponent={
            <EmptyState
              title={emptyState.title}
              description={emptyState.description}
              actionLabel={emptyState.actionLabel}
              onAction={emptyState.onAction}
            />
          }
        />
      </View>
    </AppScreen>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  flex: { flex: 1 },
  headerPad: { paddingHorizontal: layout.gutter, paddingTop: space.xs },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.sm,
    marginBottom: space.sm,
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
  searchHint: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
    marginBottom: space.sm,
  },
  list: { paddingHorizontal: layout.gutter },
  listEmpty: { flexGrow: 1 },
  loader: { marginVertical: space.xxxl },
});
