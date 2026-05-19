import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/colors';
import { fontFamily } from '@/lib/typography';
import {
  CATEGORIES,
  getDefaultWarrantyMonths,
  getWarrantyStatus,
  getWarrantyStatusLabel,
  formatSerbianDate,
} from '@/lib/warranty';
import { ArrowLeft, Pencil, X } from 'lucide-react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { Card } from '@/components/ui/Card';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { WarrantyStatusBadge } from '@/components/ui/WarrantyStatusBadge';
import { WarrantyDetailBlock } from '@/components/ui/WarrantyDetailBlock';
import { ReceiptPhotoHero } from '@/components/receipt/ReceiptPhotoHero';
import { updateReceiptItem } from '@/lib/receipt-persistence';

interface ItemDetail {
  id: string;
  name: string;
  category: string;
  price: number;
  warranty_months: number;
  warranty_expires_at: string | null;
  receipts: {
    id: string;
    store_name: string;
    purchase_date: string;
    total_amount: number;
    pib: string;
    receipt_number: string;
    image_url: string;
  };
}

export default function ReceiptItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [item, setItem] = useState<ItemDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [category, setCategory] = useState('other');
  const [price, setPrice] = useState('');
  const [warrantyMonths, setWarrantyMonths] = useState('24');

  const loadItem = useCallback(async () => {
    if (!user || !id) return;
    setLoading(true);
    const { data } = await supabase
      .from('receipt_items')
      .select(
        `id, name, category, price, warranty_months, warranty_expires_at,
         receipts(id, store_name, purchase_date, total_amount, pib, receipt_number, image_url)`,
      )
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (data) {
      const row = data as unknown as ItemDetail;
      setItem(row);
      setName(row.name);
      setCategory(row.category);
      setPrice(String(row.price ?? ''));
      setWarrantyMonths(String(row.warranty_months ?? 24));
    }
    setLoading(false);
  }, [id, user]);

  useEffect(() => {
    loadItem();
  }, [loadItem]);

  const handleSave = async () => {
    if (!user || !item) return;
    if (!name.trim()) {
      setError('Unesite naziv proizvoda');
      return;
    }
    setSaving(true);
    setError('');
    const { error: saveErr } = await updateReceiptItem(
      user.id,
      item.id,
      item.receipts.purchase_date,
      { name, category, price, warranty_months: warrantyMonths },
    );
    setSaving(false);
    if (saveErr) {
      setError(saveErr);
      return;
    }
    setEditing(false);
    await loadItem();
  };

  if (loading || !item) {
    return (
      <AppScreen>
        <View style={styles.centered}>
          {loading ? (
            <ActivityIndicator size="large" color={colors.primary} />
          ) : (
            <Text style={styles.missing}>Stavka nije pronađena.</Text>
          )}
        </View>
      </AppScreen>
    );
  }

  const receipt = item.receipts;
  const categoryLabel = CATEGORIES.find((c) => c.id === item.category)?.label ?? item.category;

  return (
    <AppScreen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View style={styles.topBarCenter}>
            <Text style={styles.screenTitle}>Detalji proizvoda</Text>
            <Text style={styles.screenSubtitle} numberOfLines={1}>
              {item.name}
            </Text>
          </View>
          {!editing ? (
            <TouchableOpacity onPress={() => setEditing(true)} style={styles.iconBtn}>
              <Pencil size={20} color={colors.primary} />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              onPress={() => {
                setEditing(false);
                loadItem();
              }}
              style={styles.iconBtn}
            >
              <X size={22} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.heroHeader}>
          {editing ? (
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={setName}
              placeholder="Naziv proizvoda"
              placeholderTextColor={colors.textMuted}
            />
          ) : (
            <Text style={styles.productName}>{item.name}</Text>
          )}
          {item.warranty_expires_at && !editing ? (
            <WarrantyStatusBadge warrantyExpiresAt={item.warranty_expires_at} />
          ) : null}
        </View>

        <ReceiptPhotoHero imageStored={receipt.image_url} productName={item.name} />

        {editing ? (
          <>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Card style={styles.editCard}>
              <Text style={styles.editSectionTitle}>Uredi proizvod</Text>
              <Text style={styles.fieldLabel}>Kategorija</Text>
              <View style={styles.chips}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.chip, category === cat.id && styles.chipActive]}
                    onPress={() => {
                      setCategory(cat.id);
                      setWarrantyMonths(String(getDefaultWarrantyMonths(cat.id)));
                    }}
                  >
                    <Text style={[styles.chipText, category === cat.id && styles.chipTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={styles.row}>
                <View style={styles.half}>
                  <Text style={styles.fieldLabel}>Cena (RSD)</Text>
                  <TextInput
                    style={styles.input}
                    value={price}
                    onChangeText={setPrice}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
                <View style={styles.half}>
                  <Text style={styles.fieldLabel}>Garancija (meseci)</Text>
                  <TextInput
                    style={styles.input}
                    value={warrantyMonths}
                    onChangeText={setWarrantyMonths}
                    keyboardType="numeric"
                    placeholder="24"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </View>
            </Card>
            <PrimaryButton
              title={saving ? 'Čuvam...' : 'Sačuvaj proizvod'}
              onPress={handleSave}
              loading={saving}
              style={styles.saveBtn}
            />
            <TouchableOpacity
              style={styles.receiptEditLink}
              onPress={() => router.push(`/receipt/${receipt.id}?edit=1`)}
            >
              <Text style={styles.receiptEditLinkText}>Uredi ceo račun i ostale proizvode</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            {item.warranty_expires_at ? (
              <Card style={styles.warrantyCard}>
                <WarrantyDetailBlock
                  purchaseDate={receipt.purchase_date}
                  warrantyExpiresAt={item.warranty_expires_at}
                />
              </Card>
            ) : (
              <Card style={styles.warningCard}>
                <Text style={styles.warningText}>Garancija nije uneta za ovu stavku.</Text>
              </Card>
            )}

            <Card style={styles.detailsCard}>
              <Text style={styles.detailsTitle}>Svi podaci</Text>
              <DetailRow label="Prodavnica" value={receipt.store_name || '—'} />
              <DetailRow label="Kategorija proizvoda" value={categoryLabel} />
              <DetailRow
                label="Datum kupovine proizvoda"
                value={formatSerbianDate(receipt.purchase_date)}
              />
              {item.warranty_expires_at ? (
                <>
                  <DetailRow
                    label="Datum isteka garancije"
                    value={formatSerbianDate(item.warranty_expires_at)}
                    emphasize
                  />
                  <DetailRow
                    label="Status garancije"
                    value={getWarrantyStatusLabel(getWarrantyStatus(item.warranty_expires_at))}
                  />
                  <DetailRow label="Trajanje garancije" value={`${item.warranty_months} meseci`} muted />
                </>
              ) : null}
              <DetailRow
                label="Cena proizvoda"
                value={`${Number(item.price).toLocaleString('sr-RS')} RSD`}
                muted
              />
              <DetailRow
                label="Ukupan iznos računa"
                value={`${Number(receipt.total_amount).toLocaleString('sr-RS')} RSD`}
                muted
              />
              {receipt.pib ? <DetailRow label="PIB prodavnice" value={receipt.pib} muted /> : null}
              {receipt.receipt_number ? (
                <DetailRow label="Broj fiskalnog računa" value={receipt.receipt_number} muted />
              ) : null}
            </Card>

            <TouchableOpacity
              style={styles.receiptLink}
              onPress={() => router.push(`/receipt/${receipt.id}`)}
            >
              <Text style={styles.receiptLinkText}>Otvori ceo račun</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </AppScreen>
  );
}

function DetailRow({
  label,
  value,
  muted,
  emphasize,
}: {
  label: string;
  value: string;
  muted?: boolean;
  emphasize?: boolean;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text
        style={[
          styles.detailValue,
          muted && styles.detailValueMuted,
          emphasize && styles.detailValueEmphasize,
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 48 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  missing: { fontSize: 16, fontFamily: fontFamily.medium, color: colors.textSecondary },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 12,
    gap: 8,
  },
  topBarCenter: { flex: 1, minWidth: 0 },
  iconBtn: { padding: 8 },
  screenTitle: {
    fontSize: 13,
    fontFamily: fontFamily.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  screenSubtitle: {
    fontSize: 17,
    fontFamily: fontFamily.bold,
    color: colors.text,
    marginTop: 2,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  productName: {
    flex: 1,
    fontSize: 26,
    fontFamily: fontFamily.bold,
    color: colors.text,
    lineHeight: 32,
  },
  nameInput: {
    flex: 1,
    fontSize: 22,
    fontFamily: fontFamily.bold,
    color: colors.text,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  warrantyCard: { marginBottom: 16 },
  warningCard: {
    marginBottom: 16,
    backgroundColor: colors.warningLight,
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  warningText: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: colors.warning,
  },
  detailsCard: { marginBottom: 12 },
  detailsTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.text,
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  detailLabel: {
    width: '46%',
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
    lineHeight: 17,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.semibold,
    color: colors.text,
    textAlign: 'right',
    lineHeight: 20,
  },
  detailValueMuted: {
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    fontSize: 13,
  },
  detailValueEmphasize: {
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  editCard: { marginBottom: 12 },
  editSectionTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.text,
    marginBottom: 12,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
    marginBottom: 8,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 11, fontFamily: fontFamily.medium, color: colors.textSecondary },
  chipTextActive: { color: colors.textInverse },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: fontFamily.regular,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    backgroundColor: colors.errorLight,
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  saveBtn: { marginBottom: 12 },
  receiptEditLink: { alignItems: 'center', paddingVertical: 12 },
  receiptEditLinkText: {
    fontSize: 14,
    fontFamily: fontFamily.semibold,
    color: colors.accent,
  },
  receiptLink: { alignItems: 'center', paddingVertical: 16 },
  receiptLinkText: {
    fontSize: 15,
    fontFamily: fontFamily.semibold,
    color: colors.accent,
  },
});
