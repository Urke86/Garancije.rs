import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Receipt, ChevronRight } from 'lucide-react-native';
import { router } from 'expo-router';
import { fontFamily } from '@/lib/typography';
import { layout, space } from '@/lib/spacing';
import { formatSerbianDate } from '@/lib/warranty';
import { Card } from './Card';
import { useReceiptImageUri } from '@/hooks/useReceiptImageUri';
import { ProductWarrantyCard } from './ProductWarrantyCard';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { useColors } from '@/contexts/ThemeContext';

export interface ReceiptItemPreview {
  id: string;
  name: string;
  category?: string;
  price?: number;
  warranty_expires_at?: string | null;
}

export interface ReceiptListCardProps {
  id: string;
  storeName: string;
  purchaseDate: string;
  totalAmount: number;
  imageUrl?: string | null;
  receiptItems?: ReceiptItemPreview[];
  onPress?: () => void;
}

export function ReceiptListCard({
  id,
  storeName,
  purchaseDate,
  totalAmount,
  imageUrl,
  receiptItems,
  onPress,
}: ReceiptListCardProps) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();

  const items = receiptItems ?? [];
  const { uri: thumbUri, loading: thumbLoading } = useReceiptImageUri(imageUrl);

  const openReceipt = () => {
    if (onPress) {
      onPress();
      return;
    }
    const path =
      items.length === 0
        ? `/receipt/${id}?edit=1`
        : `/receipt/${id}`;
    router.push(path as `/receipt/${string}`);
  };

  return (
    <Card style={styles.card} padded={false}>
      <TouchableOpacity onPress={openReceipt} activeOpacity={0.85} style={styles.merchantRow}>
        <View style={styles.thumbWrap}>
          {thumbLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : thumbUri ? (
            <Image source={{ uri: thumbUri }} style={styles.thumb} resizeMode="cover" />
          ) : (
            <Receipt size={22} color={colors.primary} />
          )}
        </View>
        <View style={styles.merchantInfo}>
          <Text style={styles.merchantLabel}>Prodavnica</Text>
          <Text style={styles.merchantName} numberOfLines={1}>
            {storeName || 'Nepoznata prodavnica'}
          </Text>
          <Text style={styles.merchantMeta}>
            {items.length} {items.length === 1 ? 'proizvod' : 'proizvoda'} · ukupno{' '}
            {Number(totalAmount).toLocaleString('sr-RS')} RSD
          </Text>
        </View>
        <ChevronRight size={20} color={colors.textMuted} />
      </TouchableOpacity>

      <View style={styles.divider} />

      {items.length > 0 ? (
        <View style={styles.items}>
          {items.map((ri) => (
            <ProductWarrantyCard
              key={ri.id}
              name={ri.name}
              purchaseDate={purchaseDate}
              category={ri.category}
              price={ri.price}
              warrantyExpiresAt={ri.warranty_expires_at}
              storeName={storeName}
              onPress={() => router.push(`/receipt/item/${ri.id}`)}
            />
          ))}
        </View>
      ) : (
        <TouchableOpacity onPress={openReceipt} activeOpacity={0.85}>
          <View style={styles.fallback}>
            <Text style={styles.fallbackTitle}>{storeName || 'Račun bez stavki'}</Text>
            <View style={styles.fallbackRow}>
              <Text style={styles.fallbackLabel}>Datum kupovine proizvoda</Text>
              <Text style={styles.fallbackValue}>{formatSerbianDate(purchaseDate)}</Text>
            </View>
            <Text style={styles.fallbackHint}>
              Nema unetih proizvoda. Dodirnite da uredite račun i dopunite stavke.
            </Text>
          </View>
        </TouchableOpacity>
      )}
    </Card>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  card: {
    marginBottom: layout.stack,
    padding: 0,
    overflow: 'hidden',
  },
  merchantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: layout.inset,
    gap: space.md,
  },
  thumbWrap: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  thumb: {
    width: 52,
    height: 52,
  },
  merchantInfo: {
    flex: 1,
    minWidth: 0,
  },
  merchantLabel: {
    fontSize: 11,
    fontFamily: fontFamily.semibold,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  merchantName: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.text,
    marginTop: 2,
  },
  merchantMeta: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    marginTop: 4,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderLight,
    marginHorizontal: layout.inset,
  },
  items: {
    padding: space.md,
    paddingTop: space.sm,
    gap: 0,
  },
  fallback: {
    padding: layout.inset,
    gap: space.sm + 2,
  },
  fallbackTitle: {
    fontSize: 17,
    fontFamily: fontFamily.bold,
    color: colors.text,
  },
  fallbackRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  fallbackLabel: {
    width: '46%',
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
    lineHeight: 17,
  },
  fallbackValue: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.semibold,
    color: colors.text,
    textAlign: 'right',
    lineHeight: 20,
  },
  fallbackHint: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.accent,
    lineHeight: 18,
  },
});
