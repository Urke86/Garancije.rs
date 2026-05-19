import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/colors';
import { fontFamily } from '@/lib/typography';
import { formatSerbianDate } from '@/lib/warranty';
import { ArrowLeft, Trash2, Pencil, X } from 'lucide-react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ProductWarrantyCard } from '@/components/ui/ProductWarrantyCard';
import { ReceiptPhotoHero } from '@/components/receipt/ReceiptPhotoHero';
import { ReceiptEditForm, type ReceiptFormState } from '@/components/receipt/ReceiptEditForm';
import {
  updateReceipt,
  type ReceiptItemInput,
} from '@/lib/receipt-persistence';

interface ReceiptRecord {
  id: string;
  store_name: string;
  purchase_date: string;
  total_amount: number;
  pib: string;
  receipt_number: string;
  image_url: string;
  raw_ocr_text: string;
  receipt_items: {
    id: string;
    name: string;
    category: string;
    price: number;
    warranty_months: number;
    warranty_expires_at: string | null;
  }[];
}

export default function ReceiptDetailScreen() {
  const { id, edit } = useLocalSearchParams<{ id: string; edit?: string }>();
  const { user } = useAuth();
  const [receipt, setReceipt] = useState<ReceiptRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(edit === '1');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState<ReceiptFormState>({
    store_name: '',
    purchase_date: '',
    total_amount: '',
    pib: '',
    receipt_number: '',
  });
  const [items, setItems] = useState<ReceiptItemInput[]>([]);
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [initialItemIds, setInitialItemIds] = useState<string[]>([]);

  const loadReceipt = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    const { data } = await supabase
      .from('receipts')
      .select('*, receipt_items(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      const r = data as ReceiptRecord;
      setReceipt(r);
      setForm({
        store_name: r.store_name,
        purchase_date: r.purchase_date,
        total_amount: String(r.total_amount ?? ''),
        pib: r.pib ?? '',
        receipt_number: r.receipt_number ?? '',
      });
      const mapped = (r.receipt_items ?? []).map((i) => ({
        id: i.id,
        name: i.name,
        category: i.category,
        price: String(i.price ?? ''),
        warranty_months: String(i.warranty_months ?? 24),
      }));
      setItems(mapped.length > 0 ? mapped : [{ name: '', category: 'other', price: '', warranty_months: '24' }]);
      setInitialItemIds(mapped.map((i) => i.id!).filter(Boolean));
      setRemovedIds([]);
    }
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    loadReceipt();
  }, [loadReceipt]);

  useEffect(() => {
    if (edit === '1') setEditing(true);
  }, [edit]);

  const primaryName = useMemo(
    () => receipt?.receipt_items?.[0]?.name || receipt?.store_name || 'Račun',
    [receipt],
  );

  const handleDelete = () => {
    Alert.alert('Obriši račun', 'Ova akcija je nepovratna.', [
      { text: 'Otkaži', style: 'cancel' },
      {
        text: 'Obriši',
        style: 'destructive',
        onPress: async () => {
          if (!receipt) return;
          await supabase.from('receipts').delete().eq('id', receipt.id);
          router.replace('/(tabs)/timeline');
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!user || !receipt) return;
    if (!form.store_name.trim()) {
      setError('Unesite naziv prodavnice');
      return;
    }
    setSaving(true);
    setError('');

    const { error: saveErr } = await updateReceipt(
      user.id,
      receipt.id,
      {
        ...form,
        image_url: receipt.image_url,
        raw_ocr_text: receipt.raw_ocr_text,
      },
      items,
      removedIds,
    );

    setSaving(false);
    if (saveErr) {
      setError(saveErr);
      return;
    }
    setEditing(false);
    await loadReceipt();
  };

  const handleItemsChange = (next: ReceiptItemInput[]) => {
    const removed = initialItemIds.filter(
      (itemId) => !next.some((i) => i.id === itemId),
    );
    setRemovedIds(removed);
    setItems(next);
  };

  if (loading || !receipt) {
    return (
      <AppScreen>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </AppScreen>
    );
  }

  const hasSavedItems = (receipt.receipt_items?.length ?? 0) > 0;

  return (
    <AppScreen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.topBarCenter}>
            <Text style={styles.screenTitle}>Detalji računa</Text>
            <Text style={styles.screenSubtitle} numberOfLines={1}>
              {receipt.store_name || 'Kupovina'}
            </Text>
          </View>
          <View style={styles.topBarActions}>
            {!editing ? (
              <TouchableOpacity onPress={() => setEditing(true)} style={styles.iconBtn}>
                <Pencil size={20} color={colors.primary} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity onPress={() => { setEditing(false); loadReceipt(); }} style={styles.iconBtn}>
                <X size={22} color={colors.textMuted} />
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn}>
              <Trash2 size={18} color={colors.error} />
            </TouchableOpacity>
          </View>
        </View>

        <ReceiptPhotoHero imageStored={receipt.image_url} productName={primaryName} />

        {editing ? (
          <>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <ReceiptEditForm
              form={form}
              items={items}
              onChangeForm={(patch) => setForm((f) => ({ ...f, ...patch }))}
              onChangeItems={handleItemsChange}
            />
            <PrimaryButton
              title={saving ? 'Čuvam...' : 'Sačuvaj izmene'}
              onPress={handleSave}
              loading={saving}
              style={styles.saveBtn}
            />
          </>
        ) : (
          <>
            <Card style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Pregled kupovine</Text>
              <SummaryRow label="Prodavnica" value={receipt.store_name || '—'} />
              <SummaryRow label="Datum kupovine proizvoda" value={formatSerbianDate(receipt.purchase_date)} />
              <SummaryRow label="Ukupan iznos računa" value={`${Number(receipt.total_amount).toLocaleString('sr-RS')} RSD`} muted />
              {receipt.pib ? <SummaryRow label="PIB prodavnice" value={receipt.pib} muted /> : null}
              {receipt.receipt_number ? (
                <SummaryRow label="Broj fiskalnog računa" value={receipt.receipt_number} muted />
              ) : null}
            </Card>

            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Proizvodi i garancije</Text>
              {!hasSavedItems ? (
                <TouchableOpacity onPress={() => setEditing(true)}>
                  <Text style={styles.sectionAction}>Dopuni podatke</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {!hasSavedItems ? (
              <Card style={styles.emptyState}>
                <Text style={styles.emptyTitle}>Nema unetih proizvoda</Text>
                <Text style={styles.emptyBody}>
                  Dodajte proizvod, trajanje garancije i ostale podatke kako biste pratili rok isteka.
                </Text>
                <PrimaryButton title="Uredi račun" onPress={() => setEditing(true)} style={styles.emptyBtn} />
              </Card>
            ) : (
              receipt.receipt_items.map((item) => (
                <ProductWarrantyCard
                  key={item.id}
                  name={item.name}
                  purchaseDate={receipt.purchase_date}
                  category={item.category}
                  price={item.price}
                  warrantyExpiresAt={item.warranty_expires_at}
                  storeName={receipt.store_name}
                  onPress={() => router.push(`/receipt/item/${item.id}`)}
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </AppScreen>
  );
}

function SummaryRow({
  label,
  value,
  muted,
}: {
  label: string;
  value: string;
  muted?: boolean;
}) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={[styles.summaryValue, muted && styles.summaryValueMuted]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 48 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 16,
    gap: 8,
  },
  topBarCenter: { flex: 1, minWidth: 0 },
  topBarActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  iconBtn: { padding: 8 },
  deleteBtn: {
    padding: 8,
    backgroundColor: colors.errorLight,
    borderRadius: 10,
  },
  screenTitle: {
    fontSize: 13,
    fontFamily: fontFamily.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  screenSubtitle: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: colors.text,
    marginTop: 2,
  },
  summaryCard: { marginBottom: 20 },
  summaryTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.text,
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  summaryLabel: {
    width: '46%',
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
    lineHeight: 17,
  },
  summaryValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.semibold,
    color: colors.text,
    textAlign: 'right',
    lineHeight: 20,
  },
  summaryValueMuted: {
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    fontSize: 13,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  sectionAction: {
    fontSize: 14,
    fontFamily: fontFamily.semibold,
    color: colors.accent,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 24,
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  emptyBody: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 12,
  },
  emptyBtn: { alignSelf: 'stretch', marginTop: 8 },
  error: {
    color: colors.error,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    backgroundColor: colors.errorLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  saveBtn: { marginTop: 8 },
});
