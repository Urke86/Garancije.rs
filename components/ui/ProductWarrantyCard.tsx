import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { fontFamily } from '@/lib/typography';
import { CATEGORIES } from '@/lib/warranty';
import { Card } from './Card';
import { WarrantyStatusBadge } from './WarrantyStatusBadge';
import { WarrantyDetailBlock } from './WarrantyDetailBlock';

interface Props {
  name: string;
  purchaseDate: string;
  category?: string;
  price?: number;
  warrantyExpiresAt?: string | null;
  storeName?: string;
  onPress: () => void;
}

export function ProductWarrantyCard({
  name,
  purchaseDate,
  category,
  price,
  warrantyExpiresAt,
  storeName,
  onPress,
}: Props) {
  const categoryLabel = CATEGORIES.find((c) => c.id === category)?.label;

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
      <Card style={styles.card}>
        <View style={styles.titleRow}>
          <View style={styles.titleBlock}>
            <Text style={styles.name} numberOfLines={2}>
              {name}
            </Text>
            {storeName ? (
              <Text style={styles.store} numberOfLines={1}>
                Prodavnica: {storeName}
              </Text>
            ) : null}
            {categoryLabel ? <Text style={styles.category}>{categoryLabel}</Text> : null}
          </View>
          <View style={styles.titleRight}>
            {warrantyExpiresAt ? (
              <WarrantyStatusBadge warrantyExpiresAt={warrantyExpiresAt} size="sm" />
            ) : null}
            <ChevronRight size={20} color={colors.textMuted} style={styles.chevron} />
          </View>
        </View>

        {warrantyExpiresAt ? (
          <WarrantyDetailBlock
            purchaseDate={purchaseDate}
            warrantyExpiresAt={warrantyExpiresAt}
          />
        ) : (
          <View style={styles.missingWarranty}>
            <Text style={styles.missingTitle}>Garancija nije uneta</Text>
            <Text style={styles.missingBody}>
              Dodirnite da dopunite datum isteka garancije za ovaj proizvod.
            </Text>
          </View>
        )}

        {price != null && price > 0 ? (
          <Text style={styles.price}>Cena stavke: {Number(price).toLocaleString('sr-RS')} RSD</Text>
        ) : null}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    gap: 14,
    borderColor: colors.border,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  chevron: {
    marginTop: 2,
  },
  name: {
    fontSize: 18,
    fontFamily: fontFamily.bold,
    color: colors.text,
    lineHeight: 24,
    paddingRight: 4,
  },
  store: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    marginTop: 6,
    lineHeight: 16,
  },
  category: {
    fontSize: 11,
    fontFamily: fontFamily.semibold,
    color: colors.accent,
    marginTop: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  missingWarranty: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: 'rgba(217, 119, 6, 0.2)',
  },
  missingTitle: {
    fontSize: 14,
    fontFamily: fontFamily.semibold,
    color: colors.warning,
  },
  missingBody: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  price: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'right',
  },
});
