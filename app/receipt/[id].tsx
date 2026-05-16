import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { colors } from '@/lib/colors';
import { getDaysUntilExpiry, getWarrantyStatus, CATEGORIES } from '@/lib/warranty';
import { ArrowLeft, ShieldCheck, TriangleAlert as AlertTriangle, Circle as XCircle, FileText, Trash2 } from 'lucide-react-native';

interface Receipt {
  id: string;
  store_name: string;
  purchase_date: string;
  total_amount: number;
  pib: string;
  receipt_number: string;
  image_url: string;
  receipt_items: {
    id: string;
    name: string;
    category: string;
    price: number;
    warranty_months: number;
    warranty_expires_at: string;
  }[];
}

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [showImage, setShowImage] = useState(false);

  useEffect(() => {
    if (!user || !id) return;
    supabase
      .from('receipts')
      .select('*, receipt_items(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setReceipt(data as Receipt);
      });
  }, [id, user]);

  const handleDelete = async () => {
    if (!receipt) return;
    await supabase.from('receipts').delete().eq('id', receipt.id);
    router.replace('/(tabs)/timeline');
  };

  const getCategoryLabel = (cat: string) => CATEGORIES.find((c) => c.id === cat)?.label || cat;

  const StatusBadge = ({ expiryDate }: { expiryDate: string }) => {
    const status = getWarrantyStatus(expiryDate);
    const days = getDaysUntilExpiry(expiryDate);
    const config = {
      active: { bg: colors.successLight, color: colors.success, icon: ShieldCheck, label: `${days} dana` },
      expiring: { bg: colors.warningLight, color: colors.warning, icon: AlertTriangle, label: `${days} dana` },
      expired: { bg: colors.errorLight, color: colors.error, icon: XCircle, label: 'Istekla' },
    }[status];
    const Icon = config.icon;
    return (
      <View style={[styles.badge, { backgroundColor: config.bg }]}>
        <Icon size={14} color={config.color} />
        <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
      </View>
    );
  };

  if (!receipt) {
    return (
      <View style={styles.loading}>
        <Text style={styles.loadingText}>Učitavam...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Trash2 size={20} color={colors.error} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.storeCard}>
        <Text style={styles.storeName}>{receipt.store_name}</Text>
        <Text style={styles.date}>
          {new Date(receipt.purchase_date).toLocaleDateString('sr-RS', { day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
        <Text style={styles.amount}>{Number(receipt.total_amount).toLocaleString('sr-RS')} RSD</Text>
      </View>

      {receipt.pib || receipt.receipt_number ? (
        <View style={styles.metaCard}>
          {receipt.pib ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>PIB</Text>
              <Text style={styles.metaValue}>{receipt.pib}</Text>
            </View>
          ) : null}
          {receipt.receipt_number ? (
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Broj računa</Text>
              <Text style={styles.metaValue}>{receipt.receipt_number}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {receipt.image_url ? (
        <TouchableOpacity style={styles.imageButton} onPress={() => setShowImage(!showImage)}>
          <FileText size={18} color={colors.primary} />
          <Text style={styles.imageButtonText}>{showImage ? 'Sakrij sliku računa' : 'Prikaži sliku računa'}</Text>
        </TouchableOpacity>
      ) : null}

      {showImage && receipt.image_url ? (
        <Image source={{ uri: receipt.image_url }} style={styles.receiptImage} resizeMode="contain" />
      ) : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Proizvodi ({receipt.receipt_items?.length || 0})</Text>
        {receipt.receipt_items?.map((item) => (
          <View key={item.id} style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={styles.itemName}>{item.name}</Text>
              <Text style={styles.itemPrice}>{Number(item.price).toLocaleString('sr-RS')} RSD</Text>
            </View>
            <View style={styles.itemMeta}>
              <View style={styles.categoryTag}>
                <Text style={styles.categoryTagText}>{getCategoryLabel(item.category)}</Text>
              </View>
              {item.warranty_expires_at && <StatusBadge expiryDate={item.warranty_expires_at} />}
            </View>
            {item.warranty_expires_at && (
              <Text style={styles.expiryDate}>
                Garancija do: {new Date(item.warranty_expires_at).toLocaleDateString('sr-RS')}
              </Text>
            )}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, fontFamily: 'Inter-Medium', color: colors.textSecondary },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  backButton: { padding: 4 },
  headerActions: { flexDirection: 'row', gap: 12 },
  deleteButton: { padding: 8, backgroundColor: colors.errorLight, borderRadius: 8 },
  storeCard: {
    backgroundColor: colors.surface, borderRadius: 16, padding: 20, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  storeName: { fontSize: 20, fontFamily: 'Inter-Bold', color: colors.text },
  date: { fontSize: 14, fontFamily: 'Inter-Regular', color: colors.textSecondary, marginTop: 4 },
  amount: { fontSize: 22, fontFamily: 'Inter-Bold', color: colors.primary, marginTop: 8 },
  metaCard: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 12,
    borderWidth: 1, borderColor: colors.border,
  },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  metaLabel: { fontSize: 13, fontFamily: 'Inter-Medium', color: colors.textSecondary },
  metaValue: { fontSize: 13, fontFamily: 'Inter-Medium', color: colors.text },
  imageButton: {
    flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12,
    backgroundColor: colors.primaryLight + '15', borderRadius: 10, marginBottom: 16,
  },
  imageButtonText: { fontSize: 14, fontFamily: 'Inter-Medium', color: colors.primary },
  receiptImage: { width: '100%', height: 400, borderRadius: 12, marginBottom: 16 },
  section: { marginTop: 8 },
  sectionTitle: { fontSize: 17, fontFamily: 'Inter-SemiBold', color: colors.text, marginBottom: 12 },
  itemCard: {
    backgroundColor: colors.surface, borderRadius: 12, padding: 16, marginBottom: 10,
    borderWidth: 1, borderColor: colors.border,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemName: { fontSize: 15, fontFamily: 'Inter-Medium', color: colors.text, flex: 1 },
  itemPrice: { fontSize: 14, fontFamily: 'Inter-SemiBold', color: colors.text },
  itemMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  categoryTag: { backgroundColor: colors.surfaceAlt, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  categoryTagText: { fontSize: 12, fontFamily: 'Inter-Medium', color: colors.textSecondary },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 12, fontFamily: 'Inter-SemiBold' },
  expiryDate: { fontSize: 12, fontFamily: 'Inter-Regular', color: colors.textMuted, marginTop: 8 },
});
