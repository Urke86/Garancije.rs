import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TriangleAlert as AlertTriangle, ChevronRight } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { fontFamily } from '@/lib/typography';
import { Card } from './Card';
import { WarrantyStatusBadge } from './WarrantyStatusBadge';
import { WarrantyDetailBlock } from './WarrantyDetailBlock';

interface Props {
  name: string;
  purchaseDate: string;
  storeName?: string;
  warrantyExpiresAt: string;
  onPress: () => void;
}

export function ExpiringItemCard({
  name,
  purchaseDate,
  storeName,
  warrantyExpiresAt,
  onPress,
}: Props) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.88}>
      <Card style={styles.card}>
        <View style={styles.titleRow}>
          <View style={styles.iconWrap}>
            <AlertTriangle size={18} color={colors.warning} />
          </View>
          <View style={styles.titleBlock}>
            <Text style={styles.name} numberOfLines={2}>
              {name}
            </Text>
            {storeName ? (
              <Text style={styles.store} numberOfLines={1}>
                Prodavnica: {storeName}
              </Text>
            ) : null}
          </View>
          <WarrantyStatusBadge warrantyExpiresAt={warrantyExpiresAt} size="sm" />
        </View>
        <WarrantyDetailBlock
          purchaseDate={purchaseDate}
          warrantyExpiresAt={warrantyExpiresAt}
          showCountdownParts={false}
        />
        <View style={styles.footer}>
          <Text style={styles.footerText}>Prikaži sve detalje</Text>
          <ChevronRight size={16} color={colors.accent} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    borderColor: 'rgba(217, 119, 6, 0.28)',
    gap: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
  },
  name: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    color: colors.text,
    lineHeight: 21,
  },
  store: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    marginTop: 4,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingTop: 4,
  },
  footerText: {
    fontSize: 13,
    fontFamily: fontFamily.semibold,
    color: colors.accent,
  },
});
