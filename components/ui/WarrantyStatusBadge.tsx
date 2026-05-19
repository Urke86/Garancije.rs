import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/lib/colors';
import { fontFamily } from '@/lib/typography';
import { getWarrantyStatus, getWarrantyStatusLabel } from '@/lib/warranty';

interface Props {
  warrantyExpiresAt: string;
  size?: 'sm' | 'md';
}

export function WarrantyStatusBadge({ warrantyExpiresAt, size = 'md' }: Props) {
  const status = getWarrantyStatus(warrantyExpiresAt);
  const label = getWarrantyStatusLabel(status);
  const palette = {
    active: { bg: colors.successLight, text: colors.success, border: 'rgba(5, 150, 105, 0.25)' },
    expiring: { bg: colors.warningLight, text: colors.warning, border: 'rgba(217, 119, 6, 0.3)' },
    expired: { bg: colors.errorLight, text: colors.error, border: 'rgba(220, 38, 38, 0.25)' },
  }[status];

  return (
    <View
      style={[
        styles.badge,
        size === 'sm' && styles.badgeSm,
        { backgroundColor: palette.bg, borderColor: palette.border },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: palette.text }]} />
      <Text style={[styles.text, size === 'sm' && styles.textSm, { color: palette.text }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },
  badgeSm: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    letterSpacing: 0.2,
  },
  textSm: {
    fontSize: 11,
  },
});
