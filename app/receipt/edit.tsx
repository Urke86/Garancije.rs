import { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { fontFamily } from '@/lib/typography';
import { layout, space } from '@/lib/spacing';
import { getDefaultWarrantyMonths } from '@/lib/warranty';
import { ArrowLeft, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react-native';
import { AppScreen } from '@/components/ui/AppScreen';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ReceiptPhotoHero } from '@/components/receipt/ReceiptPhotoHero';
import { ReceiptEditForm, type ReceiptFormState } from '@/components/receipt/ReceiptEditForm';
import { saveNewReceipt, type ReceiptItemInput } from '@/lib/receipt-persistence';
import {
  emptyOcrResult,
  hasRecognizedFields,
  invokeReceiptOcr,
  type OcrReceiptResult,
} from '@/lib/ocr-receipt';
import { clearPendingOcr, loadPendingOcr } from '@/lib/ocr-pending';
import { loadReceiptImageBase64 } from '@/lib/receipt-image-base64';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { useColors } from '@/contexts/ThemeContext';

function mapOcrToForm(ocrData: OcrReceiptResult): {
  form: ReceiptFormState;
  items: ReceiptItemInput[];
} {
  return {
    form: {
      store_name: ocrData.store_name || '',
      purchase_date: ocrData.purchase_date || new Date().toISOString().split('T')[0],
      total_amount: ocrData.total_amount?.toString() || '',
      pib: ocrData.pib || '',
      receipt_number: ocrData.receipt_number || '',
    },
    items:
      ocrData.items?.length > 0
        ? ocrData.items.map((i) => ({
            name: i.name || '',
            category: i.category || 'other',
            price: i.price?.toString() || '',
            warranty_months: getDefaultWarrantyMonths(i.category || 'other').toString(),
          }))
        : [{ name: '', category: 'other', price: '', warranty_months: '24' }],
  };
}

export default function EditReceiptScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();

  const { user } = useAuth();
  const params = useLocalSearchParams<{
    image_url: string;
    ocr_key?: string;
    ocr_data?: string;
    ocr_warning?: string;
  }>();

  const [ocrData, setOcrData] = useState<OcrReceiptResult>(emptyOcrResult());
  const [ocrWarning, setOcrWarning] = useState('');
  const [loadingOcr, setLoadingOcr] = useState(Boolean(params.ocr_key));
  const [retryingOcr, setRetryingOcr] = useState(false);
  const [showRawText, setShowRawText] = useState(false);

  const [form, setForm] = useState<ReceiptFormState>({
    store_name: '',
    purchase_date: new Date().toISOString().split('T')[0],
    total_amount: '',
    pib: '',
    receipt_number: '',
  });
  const [items, setItems] = useState<ReceiptItemInput[]>([
    { name: '', category: 'other', price: '', warranty_months: '24' },
  ]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const applyOcrResult = useCallback((result: OcrReceiptResult, warning: string | null) => {
    setOcrData(result);
    setOcrWarning(warning?.trim() || '');
    const mapped = mapOcrToForm(result);
    setForm(mapped.form);
    setItems(mapped.items);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function hydrateOcr() {
      if (params.ocr_key) {
        const pending = await loadPendingOcr(params.ocr_key);
        if (cancelled) return;
        if (pending) {
          applyOcrResult(pending.result, pending.warning);
        } else {
          setOcrWarning('OCR podaci nisu pronađeni — unesite ručno ili ponovite prepoznavanje.');
        }
        setLoadingOcr(false);
        return;
      }

      if (params.ocr_data) {
        try {
          const parsed = JSON.parse(params.ocr_data) as OcrReceiptResult;
          applyOcrResult(parsed, params.ocr_warning ?? null);
        } catch {
          setOcrWarning('OCR podaci nisu validni — unesite podatke ručno.');
        }
      } else if (params.ocr_warning) {
        setOcrWarning(params.ocr_warning);
      }
      setLoadingOcr(false);
    }

    hydrateOcr();
    return () => {
      cancelled = true;
    };
  }, [params.ocr_key, params.ocr_data, params.ocr_warning, applyOcrResult]);

  useEffect(() => {
    return () => {
      if (params.ocr_key) {
        clearPendingOcr(params.ocr_key).catch(() => undefined);
      }
    };
  }, [params.ocr_key]);

  const recognized = hasRecognizedFields(ocrData);
  const previewName = items.find((i) => i.name.trim())?.name || form.store_name || 'Novi račun';

  const handleRetryOcr = async () => {
    if (!params.image_url || retryingOcr) return;
    setRetryingOcr(true);
    setError('');

    try {
      const base64 = await loadReceiptImageBase64(params.image_url);
      if (!base64) {
        setError('Nije moguće učitati sliku za ponovni OCR.');
        return;
      }

      const { data, error: ocrError } = await invokeReceiptOcr(base64);
      const result = data ?? emptyOcrResult();
      const warning =
        ocrError ||
        (!hasRecognizedFields(result)
          ? 'Podaci nisu prepoznati — proverite sliku ili unesite ručno.'
          : null);

      applyOcrResult(result, warning);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Nepoznata greška';
      setError('OCR greška: ' + message);
    } finally {
      setRetryingOcr(false);
    }
  };

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
        raw_ocr_text: ocrData.raw_text || '',
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
          <View style={styles.headerText}>
            <Text style={styles.screenTitle}>Novi račun</Text>
            <Text style={styles.screenSubtitle}>
              {loadingOcr
                ? 'Učitavam OCR podatke...'
                : recognized
                  ? 'OCR je prepoznao podatke — proverite pre čuvanja'
                  : 'Unesite podatke sa računa'}
            </Text>
          </View>
        </View>

        {params.image_url ? (
          <ReceiptPhotoHero imageStored={params.image_url} productName={previewName} />
        ) : null}

        {params.image_url ? (
          <TouchableOpacity
            style={styles.retryOcrBtn}
            onPress={handleRetryOcr}
            disabled={retryingOcr || loadingOcr}
            accessibilityRole="button"
            accessibilityLabel="Ponovi prepoznavanje računa"
          >
            {retryingOcr ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <RefreshCw size={18} color={colors.primary} />
            )}
            <Text style={styles.retryOcrText}>
              {retryingOcr ? 'Prepoznajem ponovo...' : 'Ponovi prepoznavanje'}
            </Text>
          </TouchableOpacity>
        ) : null}

        {loadingOcr ? (
          <View style={styles.infoBanner}>
            <ActivityIndicator size="small" color={colors.primary} />
            <Text style={styles.infoText}>Učitavam prepoznate podatke...</Text>
          </View>
        ) : ocrWarning ? (
          <View style={styles.warningBanner}>
            <Text style={styles.warningText}>{ocrWarning}</Text>
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
              Podaci sa računa nisu automatski prepoznati. Unesite prodavnicu, datum i stavke ručno
              ili dodirnite „Ponovi prepoznavanje”.
            </Text>
          </View>
        )}

        {ocrData.raw_text ? (
          <View style={styles.rawTextSection}>
            <TouchableOpacity
              style={styles.rawTextToggle}
              onPress={() => setShowRawText((v) => !v)}
              accessibilityRole="button"
              accessibilityLabel="Prikaži prepoznat tekst"
            >
              <Text style={styles.rawTextTitle}>Prepoznat tekst</Text>
              {showRawText ? (
                <ChevronUp size={18} color={colors.textMuted} />
              ) : (
                <ChevronDown size={18} color={colors.textMuted} />
              )}
            </TouchableOpacity>
            {showRawText ? (
              <Text style={styles.rawTextBody} selectable>
                {ocrData.raw_text}
              </Text>
            ) : null}
          </View>
        ) : null}

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

const createStyles = (colors: AppColors) => StyleSheet.create({
  scroll: { flex: 1 },
  content: { paddingHorizontal: layout.gutter, paddingBottom: layout.scrollBottom + space.lg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingTop: space.sm,
    paddingBottom: space.lg,
  },
  backBtn: { padding: space.xs },
  headerText: { flex: 1 },
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
  retryOcrBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    paddingVertical: space.sm + 2,
    marginBottom: space.md,
    borderRadius: layout.radius - 6,
    borderWidth: 1,
    borderColor: 'rgba(6, 43, 95, 0.15)',
    backgroundColor: colors.surface,
  },
  retryOcrText: {
    fontSize: 14,
    fontFamily: fontFamily.semibold,
    color: colors.primary,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm + 2,
    backgroundColor: colors.accentLight,
    borderRadius: layout.radius - 4,
    padding: space.md,
    marginBottom: space.md,
    borderWidth: 1,
    borderColor: 'rgba(0, 184, 217, 0.25)',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    lineHeight: 19,
  },
  warningBanner: {
    backgroundColor: colors.errorLight,
    borderRadius: layout.radius - 4,
    padding: space.md,
    marginBottom: space.md,
    borderWidth: 1,
    borderColor: 'rgba(220, 38, 38, 0.2)',
  },
  warningText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.error,
    lineHeight: 19,
  },
  rawTextSection: {
    marginBottom: space.md,
    borderRadius: layout.radius - 4,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    overflow: 'hidden',
  },
  rawTextToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  rawTextTitle: {
    fontSize: 13,
    fontFamily: fontFamily.semibold,
    color: colors.textSecondary,
  },
  rawTextBody: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    lineHeight: 16,
    paddingHorizontal: 12,
    paddingBottom: 12,
    maxHeight: 200,
  },
  error: {
    color: colors.error,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    backgroundColor: colors.errorLight,
    padding: space.md,
    borderRadius: layout.radius - 6,
    marginBottom: space.md,
  },
  saveBtn: { marginTop: space.sm },
});
