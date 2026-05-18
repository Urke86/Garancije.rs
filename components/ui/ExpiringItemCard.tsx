import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TriangleAlert as AlertTriangle } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { fontFamily } from '@/lib/typography';
import { getDaysUntilExpiry } from '@/lib/warranty';
import { Card } from './Card';

interface Props {
  name: string;
  storeName?: string;
  warrantyExpiresAt: string;
  onPress: () => void;
}

const MAX_DAYS = 30;

export function ExpiringItemCard({ name, storeName, warrantyExpiresAt, onPress }: Props) {
  const days = getDaysUntilExpiry(warrantyExpiresAt);
  const progress = Math.max(0, Math.min(1, days / MAX_DAYS));

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <AlertTriangle size={18} color={colors.warning} />
          </View>
          <View style={styles.content}>
            <Text style={styles.name} numberOfLines={1}>{name}</Text>
            {storeName ? (
              <Text style={styles.store} numberOfLines={1}>{storeName}</Text>
            ) : null}
          </View>
          <Text style={styles.days}>{days} d.</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress * 100}%` }]} />
        </View>
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 10,
    borderColor: 'rgba(217, 119, 6, 0.25)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.warningLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: { flex: 1 },
  name: {
    fontSize: 15,
    fontFamily: fontFamily.semibold,
    color: colors.text,
  },
  store: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  days: {
    fontSize: 14,
    fontFamily: fontFamily.bold,
    color: colors.warning,
  },
  track: {
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.surfaceAlt,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: colors.warning,
  },
});
