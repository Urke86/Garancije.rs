import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, ActivityIndicator } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/colors';
import { getWarrantyStatus } from '@/lib/warranty';
import { getTimeGreeting, getGreetingName, getUserInitials } from '@/lib/greeting';
import { Camera } from 'lucide-react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { ScreenHeader } from '@/components/ui/ScreenHeader';
import { WarrantySummaryCard } from '@/components/ui/WarrantySummaryCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { ExpiringItemCard } from '@/components/ui/ExpiringItemCard';
import { ReceiptListCard } from '@/components/ui/ReceiptListCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';

interface WarrantyItem {
  id: string;
  name: string;
  warranty_expires_at: string;
  receipt_id: string;
  category: string;
  receipts: { store_name: string; purchase_date: string };
}

interface RecentReceipt {
  id: string;
  store_name: string;
  purchase_date: string;
  total_amount: number;
  image_url: string | null;
  receipt_items: {
    id: string;
    name: string;
    category?: string;
    price?: number;
    warranty_expires_at: string | null;
  }[];
}

export default function HomeScreen() {
  const { user } = useAuth();
  const { scrollBottomPadding } = useTabBarLayout();
  const [items, setItems] = useState<WarrantyItem[]>([]);
  const [recentReceipts, setRecentReceipts] = useState<RecentReceipt[]>([]);
  const [receiptCount, setReceiptCount] = useState(0);
  const [stats, setStats] = useState({ total: 0, active: 0, expiring: 0, expired: 0 });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user) return;
    const [itemsRes, receiptsRes, countRes] = await Promise.all([
      supabase
        .from('receipt_items')
        .select('id, name, warranty_expires_at, receipt_id, category, receipts(store_name, purchase_date)')
        .eq('user_id', user.id)
        .not('warranty_expires_at', 'is', null)
        .order('warranty_expires_at', { ascending: true }),
      supabase
        .from('receipts')
        .select(
          'id, store_name, purchase_date, total_amount, image_url, receipt_items(id, name, category, price, warranty_expires_at)',
        )
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false })
        .limit(3),
      supabase
        .from('receipts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id),
    ]);

    setReceiptCount(countRes.count ?? 0);

    if (itemsRes.data) {
      const data = itemsRes.data as unknown as WarrantyItem[];
      setItems(data);
      const active = data.filter((i) => getWarrantyStatus(i.warranty_expires_at) === 'active').length;
      const expiring = data.filter((i) => getWarrantyStatus(i.warranty_expires_at) === 'expiring').length;
      const expired = data.filter((i) => getWarrantyStatus(i.warranty_expires_at) === 'expired').length;
      setStats({ total: data.length, active, expiring, expired });
    }

    if (receiptsRes.data) {
      setRecentReceipts(receiptsRes.data as RecentReceipt[]);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const expiringItems = items.filter((i) => getWarrantyStatus(i.warranty_expires_at) === 'expiring');
  const name = getGreetingName(user);
  const greetingLine = name ? `${getTimeGreeting()}, ${name}` : getTimeGreeting();

  return (
    <AppScreen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: scrollBottomPadding }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        <ScreenHeader
          greeting={greetingLine}
          title="Vaš garancijski novčanik"
          subtitle="Sve garancije na jednom mestu"
          avatarLabel={getUserInitials(user)}
          onAvatarPress={() => router.push('/(tabs)/profile')}
        />

        {loading ? (
          <ActivityIndicator size="large" color={colors.primary} style={styles.loader} />
        ) : (
          <>
            <WarrantySummaryCard
              receiptCount={receiptCount}
              total={stats.total}
              active={stats.active}
              expiring={stats.expiring}
              expired={stats.expired}
            />

            {receiptCount === 0 ? (
              <EmptyState
                showBrand
                title="Nemate sačuvanih računa"
                description="Dodajte prvi fiskalni račun — aplikacija će automatski prepoznati prodavnicu, stavke i datume garancije."
                actionLabel="Dodaj prvi račun"
                onAction={() => router.push('/(tabs)/scan')}
              />
            ) : (
              <>
                <PrimaryButton
                  title="Dodaj novi račun"
                  onPress={() => router.push('/(tabs)/scan')}
                  icon={<Camera size={22} color={colors.textInverse} />}
                  style={styles.scanCta}
                />

                {expiringItems.length > 0 ? (
                  <View style={styles.section}>
                    <SectionHeader title="Uskoro ističe" />
                    {expiringItems.map((item) => (
                      <ExpiringItemCard
                        key={item.id}
                        name={item.name}
                        purchaseDate={item.receipts?.purchase_date ?? ''}
                        storeName={item.receipts?.store_name}
                        warrantyExpiresAt={item.warranty_expires_at}
                        onPress={() => router.push(`/receipt/item/${item.id}`)}
                      />
                    ))}
                  </View>
                ) : null}

                {recentReceipts.length > 0 ? (
                  <View style={styles.section}>
                    <SectionHeader
                      title="Nedavni računi"
                      actionLabel="Vidi sve"
                      onAction={() => router.push('/(tabs)/timeline')}
                    />
                    {recentReceipts.map((r) => (
                      <ReceiptListCard
                        key={r.id}
                        id={r.id}
                        storeName={r.store_name}
                        purchaseDate={r.purchase_date}
                        totalAmount={r.total_amount}
                        imageUrl={r.image_url}
                        receiptItems={r.receipt_items}
                        onPress={() => router.push(`/receipt/${r.id}`)}
                      />
                    ))}
                  </View>
                ) : null}
              </>
            )}
          </>
        )}
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20 },
  loader: { marginVertical: 40 },
  scanCta: { marginBottom: 28 },
  section: { marginBottom: 8 },
});
