import { View, Text, StyleSheet } from 'react-native';
import { fontFamily } from '@/lib/typography';
import {
  getWarrantyRemainingInfo,
  type WarrantyRemainingParts,
} from '@/lib/warranty';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { useColors } from '@/contexts/ThemeContext';

interface Props {
  warrantyExpiresAt: string;
  compact?: boolean;
}

function PartBlock({ value, unit }: { value: number; unit: string }) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.part}>
      <Text style={styles.partValue}>{value}</Text>
      <Text style={styles.partUnit}>{unit}</Text>
    </View>
  );
}

function PartsRow({ parts, compact }: { parts: WarrantyRemainingParts; compact?: boolean }) {
  const styles = useThemedStyles(createStyles);

  const units =
    parts.years > 0
      ? [
          { value: parts.years, unit: parts.years === 1 ? 'god' : 'god' },
          { value: parts.months, unit: 'mes' },
          { value: parts.days, unit: 'dan' },
        ]
      : parts.months > 0
        ? [
            { value: parts.months, unit: parts.months === 1 ? 'mes' : 'mes' },
            { value: parts.days, unit: 'dan' },
          ]
        : [{ value: parts.days, unit: parts.days === 1 ? 'dan' : 'dana' }];

  return (
    <View style={[styles.partsRow, compact && styles.partsRowCompact]}>
      {units.map((p) => (
        <PartBlock key={p.unit + p.value} value={p.value} unit={p.unit} />
      ))}
    </View>
  );
}

export function WarrantyCountdown({ warrantyExpiresAt, compact }: Props) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();
  const info = getWarrantyRemainingInfo(warrantyExpiresAt);
  const statusColor =
    info.status === 'expired'
      ? colors.error
      : info.status === 'expiring'
        ? colors.warning
        : colors.success;

  return (
    <View style={styles.wrap}>
      <Text style={[styles.remaining, compact && styles.remainingCompact, { color: statusColor }]}>
        {info.remainingLabel}
      </Text>
      <PartsRow parts={info.parts} compact={compact} />
      <Text style={styles.expiry}>Ističe: {info.expiryLabel}</Text>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  wrap: { gap: 6 },
  remaining: {
    fontSize: 16,
    fontFamily: fontFamily.bold,
    lineHeight: 22,
  },
  remainingCompact: {
    fontSize: 14,
    lineHeight: 20,
  },
  partsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  partsRowCompact: {
    gap: 6,
  },
  part: {
    minWidth: 52,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
  },
  partValue: {
    fontSize: 20,
    fontFamily: fontFamily.extrabold,
    color: colors.primary,
  },
  partUnit: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
    marginTop: 2,
    textTransform: 'uppercase',
  },
  expiry: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },
});
