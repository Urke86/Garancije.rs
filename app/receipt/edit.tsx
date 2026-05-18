import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/colors';
import { CATEGORIES, getDefaultWarrantyMonths, calculateWarrantyExpiry } from '@/lib/warranty';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react-native';

interface ItemForm {
  name: string;
  category: string;
  price: string;
  warranty_months: string;
}

export default function EditReceiptScreen() {
  const { user } = useAuth();
  const params = useLocalSearchParams<{ image_url: string; ocr_data: string }>();
  const ocrData = params.ocr_data ? JSON.parse(params.ocr_data) : {};

  const [storeName, setStoreName] = useState(ocrData.store_name || '');
  const [purchaseDate, setPurchaseDate] = useState(ocrData.purchase_date || new Date().toISOString().split('T')[0]);
  const [totalAmount, setTotalAmount] = useState(ocrData.total_amount?.toString() || '');
  const [pib, setPib] = useState(ocrData.pib || '');
  const [receiptNumber, setReceiptNumber] = useState(ocrData.receipt_number || '');
  const [items, setItems] = useState<ItemForm[]>(
    ocrData.items?.length > 0
      ? ocrData.items.map((i: any) => ({
          name: i.name || '',
          category: i.category || 'other',
          price: i.price?.toString() || '',
          warranty_months: getDefaultWarrantyMonths(i.category || 'other').toString(),
        }))
      : [{ name: '', category: 'other', price: '', warranty_months: '24' }]
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const addItem = () => {
    setItems([...items, { name: '', category: 'other', price: '', warranty_months: '24' }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ItemForm, value: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    if (field === 'category') {
      updated[index].warranty_months = getDefaultWarrantyMonths(value).toString();
    }
    setItems(updated);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!storeName.trim()) {
      setError('Unesite naziv prodavnice');
      return;
    }
    setSaving(true);
    setError('');

    const { data: receipt, error: receiptErr } = await supabase
      .from('receipts')
      .insert({
        user_id: user.id,
        store_name: storeName.trim(),
        purchase_date: purchaseDate,
        total_amount: parseFloat(totalAmount) || 0,
        pib: pib.trim(),
        receipt_number: receiptNumber.trim(),
        image_url: params.image_url || '',
        raw_ocr_text: params.ocr_data || '',
      })
      .select('id')
      .maybeSingle();

    if (receiptErr || !receipt) {
      setError('Greška pri čuvanju računa');
      setSaving(false);
      return;
    }

    const validItems = items.filter((i) => i.name.trim());
    if (validItems.length > 0) {
      const itemsToInsert = validItems.map((i) => ({
        receipt_id: receipt.id,
        user_id: user.id,
        name: i.name.trim(),
        category: i.category,
        price: parseFloat(i.price) || 0,
        warranty_months: parseInt(i.warranty_months) || 24,
        warranty_expires_at: calculateWarrantyExpiry(purchaseDate, parseInt(i.warranty_months) || 24),
      }));

      const { data: insertedItems, error: itemsErr } = await supabase
        .from('receipt_items')
        .insert(itemsToInsert)
        .select('id, warranty_expires_at, name');

      if (!itemsErr && insertedItems) {
        const reminders = insertedItems
          .filter((i) => i.warranty_expires_at)
          .map((i) => {
            const expiryDate = new Date(i.warranty_expires_at!);
            const remindDate = new Date(expiryDate);
            remindDate.setDate(remindDate.getDate() - 30);
            return {
              user_id: user.id,
              receipt_item_id: i.id,
              remind_at: remindDate.toISOString(),
              type: 'warranty_expiring',
              message: `Garancija za "${i.name}" ističe za 30 dana`,
            };
          });

        if (reminders.length > 0) {
          await supabase.from('reminders').insert(reminders);
        }
      }
    }

    setSaving(false);
    router.replace('/(tabs)/timeline');
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Podaci sa računa</Text>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Osnovni podaci</Text>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Prodavnica</Text>
          <TextInput style={styles.input} value={storeName} onChangeText={setStoreName} placeholder="Naziv prodavnice" placeholderTextColor={colors.textMuted} />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Datum kupovine (GGGG-MM-DD)</Text>
          <TextInput style={styles.input} value={purchaseDate} onChangeText={setPurchaseDate} placeholder="2024-01-15" placeholderTextColor={colors.textMuted} />
        </View>
        <View style={styles.row}>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>Ukupan iznos (RSD)</Text>
            <TextInput style={styles.input} value={totalAmount} onChangeText={setTotalAmount} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textMuted} />
          </View>
          <View style={[styles.fieldGroup, { flex: 1 }]}>
            <Text style={styles.label}>PIB</Text>
            <TextInput style={styles.input} value={pib} onChangeText={setPib} placeholder="PIB" placeholderTextColor={colors.textMuted} />
          </View>
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Broj računa</Text>
          <TextInput style={styles.input} value={receiptNumber} onChangeText={setReceiptNumber} placeholder="Broj fiskalnog računa" placeholderTextColor={colors.textMuted} />
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Proizvodi</Text>
          <TouchableOpacity style={styles.addButton} onPress={addItem}>
            <Plus size={18} color={colors.primary} />
            <Text style={styles.addText}>Dodaj</Text>
          </TouchableOpacity>
        </View>

        {items.map((item, index) => (
          <View key={index} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemNumber}>Stavka {index + 1}</Text>
              {items.length > 1 && (
                <TouchableOpacity onPress={() => removeItem(index)}>
                  <Trash2 size={18} color={colors.error} />
                </TouchableOpacity>
              )}
            </View>
            <TextInput
              style={styles.input}
              value={item.name}
              onChangeText={(v) => updateItem(index, 'name', v)}
              placeholder="Naziv proizvoda"
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.categoryRow}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.categoryChip, item.category === cat.id && styles.categoryChipActive]}
                  onPress={() => updateItem(index, 'category', cat.id)}
                >
                  <Text style={[styles.categoryChipText, item.category === cat.id && styles.categoryChipTextActive]}>
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.row}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Cena (RSD)</Text>
                <TextInput style={styles.input} value={item.price} onChangeText={(v) => updateItem(index, 'price', v)} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textMuted} />
              </View>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.label}>Garancija (meseci)</Text>
                <TextInput style={styles.input} value={item.warranty_months} onChangeText={(v) => updateItem(index, 'warranty_months', v)} keyboardType="numeric" placeholder="24" placeholderTextColor={colors.textMuted} />
              </View>
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={[styles.saveButton, saving && styles.saveButtonDisabled]} onPress={handleSave} disabled={saving}>
        <Save size={20} color={colors.textInverse} />
        <Text style={styles.saveButtonText}>{saving ? 'Čuvam...' : 'Sačuvaj račun'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: 24, gap: 12 },
  backButton: { padding: 4 },
  title: { fontSize: 22, fontFamily: 'PlusJakartaSans-Bold', color: colors.text },
  error: {
    color: colors.error, fontSize: 14, fontFamily: 'PlusJakartaSans-Regular',
    backgroundColor: colors.errorLight, padding: 12, borderRadius: 8, marginBottom: 16,
  },
  section: { marginBottom: 24 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontFamily: 'PlusJakartaSans-SemiBold', color: colors.text, marginBottom: 12 },
  fieldGroup: { marginBottom: 12 },
  label: { fontSize: 13, fontFamily: 'PlusJakartaSans-Medium', color: colors.textSecondary, marginBottom: 6 },
  input: {
    backgroundColor: colors.surface, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontFamily: 'PlusJakartaSans-Regular', color: colors.text, borderWidth: 1, borderColor: colors.border,
  },
  row: { flexDirection: 'row', gap: 12 },
  addButton: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addText: { fontSize: 14, fontFamily: 'PlusJakartaSans-Medium', color: colors.primary },
  itemCard: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  itemNumber: { fontSize: 13, fontFamily: 'PlusJakartaSans-SemiBold', color: colors.textSecondary },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginVertical: 12 },
  categoryChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border,
  },
  categoryChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  categoryChipText: { fontSize: 12, fontFamily: 'PlusJakartaSans-Medium', color: colors.textSecondary },
  categoryChipTextActive: { color: colors.textInverse },
  saveButton: {
    backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: colors.textInverse, fontSize: 16, fontFamily: 'PlusJakartaSans-SemiBold' },
});
