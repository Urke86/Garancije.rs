import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { fontFamily } from '@/lib/typography';
import { CATEGORIES, getDefaultWarrantyMonths } from '@/lib/warranty';
import type { ReceiptItemInput } from '@/lib/receipt-persistence';
import { Card } from '@/components/ui/Card';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { useColors } from '@/contexts/ThemeContext';

export interface ReceiptFormState {
  store_name: string;
  purchase_date: string;
  total_amount: string;
  pib: string;
  receipt_number: string;
}

interface Props {
  form: ReceiptFormState;
  items: ReceiptItemInput[];
  onChangeForm: (patch: Partial<ReceiptFormState>) => void;
  onChangeItems: (items: ReceiptItemInput[]) => void;
  highlightItemIndex?: number;
}

export function ReceiptEditForm({
  form,
  items,
  onChangeForm,
  onChangeItems,
  highlightItemIndex,
}: Props) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();

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
        <Text style={styles.sectionTitle}>Podaci o kupovini</Text>
        <Field label="Prodavnica" value={form.store_name} onChangeText={(v) => onChangeForm({ store_name: v })} placeholder="Naziv prodavnice" />
        <Field label="Datum kupovine proizvoda (GGGG-MM-DD)" value={form.purchase_date} onChangeText={(v) => onChangeForm({ purchase_date: v })} placeholder="2025-10-04" />
        <View style={styles.row}>
          <View style={styles.half}>
            <Field label="Ukupan iznos (RSD)" value={form.total_amount} onChangeText={(v) => onChangeForm({ total_amount: v })} placeholder="0" keyboardType="numeric" />
          </View>
          <View style={styles.half}>
            <Field label="PIB prodavnice" value={form.pib} onChangeText={(v) => onChangeForm({ pib: v })} placeholder="PIB" />
          </View>
        </View>
        <Field label="Broj fiskalnog računa" value={form.receipt_number} onChangeText={(v) => onChangeForm({ receipt_number: v })} placeholder="Broj računa" />
      </Card>

      <View style={styles.productsHeader}>
        <Text style={styles.productsTitle}>Proizvodi i garancije</Text>
        <TouchableOpacity style={styles.addBtn} onPress={addItem}>
          <Plus size={18} color={colors.primary} />
          <Text style={styles.addText}>Dodaj proizvod</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <Card style={styles.emptyProducts}>
          <Text style={styles.emptyProductsText}>
            Dodajte bar jedan proizvod sa nazivom i trajanjem garancije.
          </Text>
        </Card>
      ) : null}

      {items.map((item, index) => (
        <Card
          key={item.id ?? `new-${index}`}
          style={[styles.itemCard, highlightItemIndex === index && styles.itemCardHighlight]}
        >
          <View style={styles.itemHeader}>
            <Text style={styles.itemNumber}>Proizvod {index + 1}</Text>
            {items.length > 1 ? (
              <TouchableOpacity onPress={() => removeItem(index)} hitSlop={8}>
                <Trash2 size={18} color={colors.error} />
              </TouchableOpacity>
            ) : null}
          </View>
          <Field label="Naziv proizvoda" value={item.name} onChangeText={(v) => updateItem(index, 'name', v)} placeholder="npr. Bojler novi" />
          <Text style={styles.chipsLabel}>Kategorija</Text>
          <View style={styles.chips}>
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.chip, item.category === cat.id && styles.chipActive]}
                onPress={() => updateItem(index, 'category', cat.id)}
              >
                <Text style={[styles.chipText, item.category === cat.id && styles.chipTextActive]}>
                  {cat.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.row}>
            <View style={styles.half}>
              <Field label="Cena (RSD)" value={item.price} onChangeText={(v) => updateItem(index, 'price', v)} placeholder="0" keyboardType="numeric" />
            </View>
            <View style={styles.half}>
              <Field label="Garancija (meseci)" value={item.warranty_months} onChangeText={(v) => updateItem(index, 'warranty_months', v)} placeholder="24" keyboardType="numeric" />
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
}: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric';
}) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();

  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textMuted}
        keyboardType={keyboardType}
      />
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
  fieldLabel: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
    marginBottom: 6,
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
