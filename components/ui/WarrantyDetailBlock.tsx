import { View, Text, StyleSheet } from 'react-native';
import { fontFamily } from '@/lib/typography';
import {
  formatSerbianDate,
  getWarrantyRemainingInfo,
} from '@/lib/warranty';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { useColors } from '@/contexts/ThemeContext';

interface Props {
  purchaseDate: string;
  warrantyExpiresAt: string;
  showCountdownParts?: boolean;
}

function LabeledRow({ label, value, emphasize }: { label: string; value: string; emphasize?: boolean }) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, emphasize && styles.valueEmphasize]} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

export function WarrantyDetailBlock({
  purchaseDate,
  warrantyExpiresAt,
  showCountdownParts = true,
}: Props) {
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
      <LabeledRow
        label="Datum kupovine proizvoda"
        value={formatSerbianDate(purchaseDate)}
      />
      <LabeledRow
        label="Datum isteka garancije"
        value={info.expiryLabel}
        emphasize
      />

      <View style={[styles.daysHero, { borderColor: `${statusColor}33`, backgroundColor: `${statusColor}12` }]}>
        <Text style={[styles.daysNumber, { color: statusColor }]}>
          {info.expired ? '—' : info.daysRemaining}
        </Text>
        <Text style={styles.daysCaption}>
          {info.expired ? info.daysLabel : info.daysLabel}
        </Text>
      </View>

      {showCountdownParts && !info.expired ? (
        <Text style={styles.remainingFine}>{info.remainingLabel}</Text>
      ) : null}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  wrap: {
    gap: 10,
    paddingTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  label: {
    width: '46%',
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
    lineHeight: 17,
  },
  value: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.semibold,
    color: colors.text,
    lineHeight: 20,
    textAlign: 'right',
  },
  valueEmphasize: {
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
  daysHero: {
    marginTop: 4,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  daysNumber: {
    fontSize: 36,
    fontFamily: fontFamily.extrabold,
    letterSpacing: -1,
    lineHeight: 40,
  },
  daysCaption: {
    marginTop: 4,
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  remainingFine: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
