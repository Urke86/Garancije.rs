import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/lib/colors';
import { fontFamily } from '@/lib/typography';
import { getDefaultWarrantyMonths } from '@/lib/warranty';
import { ArrowLeft } from 'lucide-react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ReceiptPhotoHero } from '@/components/receipt/ReceiptPhotoHero';
import { ReceiptEditForm, type ReceiptFormState } from '@/components/receipt/ReceiptEditForm';
import { saveNewReceipt, type ReceiptItemInput } from '@/lib/receipt-persistence';
import { hasRecognizedFields, type OcrReceiptResult } from '@/lib/ocr-receipt';

export default function EditReceiptScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{
    image_url: string;
    ocr_data?: string;
    ocr_warning?: string;
  }>();
  const ocrData: OcrReceiptResult = params.ocr_data
    ? JSON.parse(params.ocr_data)
    : {
        store_name: '',
        purchase_date: new Date().toISOString().split('T')[0],
        total_amount: '',
        pib: '',
        receipt_number: '',
        items: [],
        raw_text: '',
      };
  const ocrWarning = params.ocr_warning?.trim() || '';
  const recognized = hasRecognizedFields(ocrData);

  const [form, setForm] = useState<ReceiptFormState>({
    store_name: ocrData.store_name || '',
    purchase_date: ocrData.purchase_date || new Date().toISOString().split('T')[0],
    total_amount: ocrData.total_amount?.toString() || '',
    pib: ocrData.pib || '',
    receipt_number: ocrData.receipt_number || '',
  });
  const [items, setItems] = useState<ReceiptItemInput[]>(
    ocrData.items?.length > 0
      ? ocrData.items.map((i: { name?: string; category?: string; price?: number }) => ({
          name: i.name || '',
          category: i.category || 'other',
          price: i.price?.toString() || '',
          warranty_months: getDefaultWarrantyMonths(i.category || 'other').toString(),
        }))
      : [{ name: '', category: 'other', price: '', warranty_months: '24' }],
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const previewName = items.find((i) => i.name.trim())?.name || form.store_name || 'Novi račun';

  const handleSave = async () => {
    if (!user) return;
    if (!form.store_name.trim()) {
      setError('Unesite naziv prodavnice');
      return;
    }
    setSaving(true);
    setError('');

    const { receiptId, error: saveErr } = await saveNewReceipt(
      user.id,
      {
        ...form,
        image_url: params.image_url || '',
        raw_ocr_text: ocrData.raw_text || params.ocr_data || '',
      },
      items,
    );

    setSaving(false);
    if (saveErr || !receiptId) {
      setError(saveErr || 'Greška pri čuvanju');
      return;
    }
    router.replace(`/receipt/${receiptId}`);
  };

  return (
    <AppScreen>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <ArrowLeft size={24} color={colors.text} />
          </TouchableOpacity>
          <View>
            <Text style={styles.screenTitle}>Novi račun</Text>
            <Text style={styles.screenSubtitle}>
              {recognized
                ? 'OCR je prepoznao podatke — proverite pre čuvanja'
                : 'Unesite podatke sa računa'}
            </Text>
          </View>
        </View>

        {params.image_url ? (
          <ReceiptPhotoHero imageStored={params.image_url} productName={previewName} />
        ) : null}

        {ocrWarning ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              OCR nije uspeo u potpunosti ({ocrWarning}). Dopunite podatke ručno.
            </Text>
          </View>
        ) : recognized ? (
          <View style={styles.infoBanner}>
            <Text style={styles.infoText}>
              Automatski prepoznati podaci mogu biti netačni — proverite prodavnicu, iznos i datum.
            </Text>
          </View>
        ) : (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>
              Podaci sa računa nisu automatski prepoznati. Unesite prodavnicu, datum i stavke ručno.
            </Text>
          </View>
        )}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <ReceiptEditForm
          form={form}
          items={items}
          onChangeForm={(patch) => setForm((f) => ({ ...f, ...patch }))}
          onChangeItems={setItems}
        />

        <PrimaryButton
          title={saving ? 'Čuvam...' : 'Sačuvaj račun'}
          onPress={handleSave}
          loading={saving}
          style={styles.saveBtn}
        />
      </ScrollView>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: 20, paddingBottom: 48 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingTop: 8,
    paddingBottom: 16,
  },
  backBtn: { padding: 4 },
  screenTitle: {
    fontSize: 22,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  screenSubtitle: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  infoBanner: {
    backgroundColor: colors.accentLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 184, 217, 0.25)',
  },
  infoText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  warningBanner: {
    backgroundColor: colors.errorLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  warningText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.error,
    lineHeight: 19,
  },
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
