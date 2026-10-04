import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { fontFamily } from '@/lib/typography';
import { space } from '@/lib/spacing';
import { getCategories, getDefaultWarrantyMonths } from '@/lib/warranty';
import type { ReceiptItemInput } from '@/lib/receipt-persistence';
import { Card } from '@/components/ui/Card';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { useColors } from '@/contexts/ThemeContext';

import type { OcrDetectableField } from '@/lib/ocr-receipt';
import type { ReceiptFormField } from '@/lib/validation/receipt-form';

export interface ReceiptFormState {
  store_name: string;
  purchase_date: string;
  total_amount: string;
  currency: string;
  pib: string;
  receipt_number: string;
}

interface Props {
  form: ReceiptFormState;
  items: ReceiptItemInput[];
  onChangeForm: (patch: Partial<ReceiptFormState>) => void;
  onChangeItems: (items: ReceiptItemInput[]) => void;
  highlightItemIndex?: number;
  autoDetectedFields?: OcrDetectableField[];
  fieldErrors?: Partial<Record<ReceiptFormField, string>>;
}

export function ReceiptEditForm({
  form,
  items,
  onChangeForm,
  onChangeItems,
  highlightItemIndex,
  autoDetectedFields = [],
  fieldErrors = {},
}: Props) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const colors = useColors();
  const detected = new Set(autoDetectedFields);

  const addItem = () => {
    onChangeItems([
      ...items,
      { name: '', category: 'other', price: '', warranty_months: '24' },
    ]);
  };

  const removeItem = (index: number) => {
    onChangeItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ReceiptItemInput, value: string) => {
    const next = [...items];
    next[index] = { ...next[index], [field]: value };
    if (field === 'category') {
      next[index].warranty_months = getDefaultWarrantyMonths(value).toString();
    }
    onChangeItems(next);
  };

  return (
    <View style={styles.wrap}>
      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>{t('receipt.formPurchaseDataTitle')}</Text>
        <Field
          label={t('receipt.fieldStore')}
          value={form.store_name}
          onChangeText={(v) => onChangeForm({ store_name: v })}
          placeholder={t('receipt.formStorePlaceholder')}
          autoDetected={detected.has('store_name')}
          error={fieldErrors.store_name}
        />
        <Field
          label={t('receipt.formDateLabel')}
          value={form.purchase_date}
          onChangeText={(v) => onChangeForm({ purchase_date: v })}
          placeholder="2025-10-04"
          autoDetected={detected.has('purchase_date')}
          error={fieldErrors.purchase_date}
        />
        <View style={styles.row}>
          <View style={styles.half}>
            <Field
              label={t('receipt.formTotalAmount')}
              value={form.total_amount}
              onChangeText={(v) => onChangeForm({ total_amount: v })}
              placeholder="0"
              keyboardType="numeric"
              autoDetected={detected.has('total_amount')}
              error={fieldErrors.total_amount}
            />
          </View>
          <View style={styles.half}>
            <Field
              label={t('receipt.formCurrency')}
              value={form.currency}
              onChangeText={(v) => onChangeForm({ currency: v.toUpperCase() })}
              placeholder="RSD"
              autoDetected={detected.has('currency')}
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.half}>
            <Field
              label={t('receipt.fieldPib')}
              value={form.pib}
              onChangeText={(v) => onChangeForm({ pib: v })}
              placeholder={t('receipt.formPibPlaceholder')}
              autoDetected={detected.has('pib')}
            />
          </View>
          <View style={styles.half}>
            <Field
              label={t('receipt.fieldReceiptNumber')}
              value={form.receipt_number}
              onChangeText={(v) => onChangeForm({ receipt_number: v })}
              placeholder={t('receipt.formReceiptNumberPlaceholder')}
              autoDetected={detected.has('receipt_number')}
            />
          </View>
        </View>
      </Card>

      <View style={styles.productsHeader}>
        <Text style={styles.productsTitle}>{t('receipt.productsSectionTitle')}</Text>
        <TouchableOpacity style={styles.addBtn} onPress={addItem}>
          <Plus size={18} color={colors.primary} />
          <Text style={styles.addText}>{t('receipt.formAddProduct')}</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <Card style={styles.emptyProducts}>
          <Text style={styles.emptyProductsText}>{t('receipt.formEmptyProducts')}</Text>
        </Card>
      ) : null}

      {fieldErrors.items ? (
        <Text style={styles.itemsError}>{fieldErrors.items}</Text>
      ) : null}

      {items.map((item, index) => (
        <Card
          key={item.id ?? `new-${index}`}
          style={[styles.itemCard, highlightItemIndex === index && styles.itemCardHighlight]}
        >
          <View style={styles.itemHeader}>
            <Text style={styles.itemNumber}>{t('receipt.formProductN', { n: index + 1 })}</Text>
            {items.length > 1 ? (
              <TouchableOpacity onPress={() => removeItem(index)} hitSlop={8}>
                <Trash2 size={18} color={colors.error} />
              </TouchableOpacity>
            ) : null}
          </View>
          <Field
            label={t('receipt.itemNamePlaceholder')}
            value={item.name}
            onChangeText={(v) => updateItem(index, 'name', v)}
            placeholder={t('receipt.formProductNamePlaceholder')}
            autoDetected={detected.has('product_name') && index === 0}
            error={fieldErrors[`item_${index}_name`]}
          />
          <Text style={styles.chipsLabel}>{t('receipt.fieldCategory')}</Text>
          <View style={styles.chips}>
            {getCategories().map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, item.category === cat.id && styles.chipActive]}
                onPress={() => updateItem(index, 'category', cat.id)}
                accessibilityRole="button"
                accessibilityState={{ selected: item.category === cat.id }}
                accessibilityLabel={t('receipt.formCategory_a11y', { label: cat.label })}
              >
                <Text style={[styles.chipText, item.category === cat.id && styles.chipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.row}>
            <View style={styles.half}>
              <Field
                label={t('receipt.formPrice')}
                value={item.price}
                onChangeText={(v) => updateItem(index, 'price', v)}
                placeholder="0"
                keyboardType="numeric"
                autoDetected={detected.has('product_name') && index === 0}
                error={fieldErrors[`item_${index}_price`]}
              />
            </View>
            <View style={styles.half}>
              <Field
                label={t('receipt.fieldWarrantyMonths')}
                value={item.warranty_months}
                onChangeText={(v) => updateItem(index, 'warranty_months', v)}
                placeholder="24"
                keyboardType="numeric"
              />
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType,
  autoDetected,
  error,
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
  autoDetected?: boolean;
  error?: string;
}) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const colors = useColors();

  return (
    <View style={styles.field}>
      <View style={styles.fieldLabelRow}>
        <Text style={styles.fieldLabel}>{label}</Text>
        {autoDetected ? (
          <View style={styles.detectedBadge}>
            <Text style={styles.detectedBadgeText}>{t('common.recognized')}</Text>
          </View>
        ) : null}
      </View>
      <TextInput
        style={[styles.input, autoDetected && styles.inputDetected, error && styles.inputError]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  wrap: { gap: 12 },
  section: { gap: 4 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.text,
    marginBottom: 8,
  },
  productsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    marginBottom: 4,
  },
  productsTitle: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addText: { fontSize: 14, fontFamily: fontFamily.semibold, color: colors.primary },
  emptyProducts: { padding: 16 },
  emptyProductsText: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    lineHeight: 20,
  },
  itemCard: { marginBottom: 4 },
  itemCardHighlight: {
    borderColor: colors.accent,
    borderWidth: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  itemNumber: {
    fontSize: 13,
    fontFamily: fontFamily.semibold,
    color: colors.textSecondary,
  },
  field: { marginBottom: 12 },
  fieldLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  fieldLabel: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
  },
  detectedBadge: {
    backgroundColor: colors.accentLight,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: colors.borderAccentSoft,
  },
  detectedBadgeText: {
    fontSize: 10,
    fontFamily: fontFamily.semibold,
    color: colors.primary,
  },
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
  },
  inputDetected: {
    borderColor: colors.accent,
    backgroundColor: colors.surfaceDetected,
  },
  inputError: {
    borderColor: colors.error,
  },
  fieldError: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.error,
    marginTop: space.xs,
  },
  itemsError: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: colors.error,
    marginBottom: space.sm,
  },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  chipsLabel: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
    marginBottom: 8,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
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
});
