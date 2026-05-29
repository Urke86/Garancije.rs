import { View, Text, StyleSheet } from 'react-native';
import { fontFamily } from '@/lib/typography';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { useColors } from '@/contexts/ThemeContext';
interface Props {
  status: 'active' | 'expiring' | 'expired';
  count?: number;
  compact?: boolean;
}

export function StatPill({ status, count, compact }: Props) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();
  const config = {
    active: { label: 'Aktivne', bg: colors.successLight, fg: colors.success },
    expiring: { label: 'Ističu', bg: colors.warningLight, fg: colors.warning },
    expired: { label: 'Istekle', bg: colors.errorLight, fg: colors.error },
  } as const;

  const c = config[status];
  return (
    <View style={[styles.pill, { backgroundColor: c.bg }, compact && styles.compact]}>
      {count !== undefined ? (
        <Text style={[styles.count, { color: c.fg }]}>{count}</Text>
      ) : null}
      <Text style={[styles.label, { color: c.fg }]}>{c.label}</Text>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  pill: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
    gap: 2,
  },
  compact: {
    flex: 0,
    flexGrow: 1,
    minWidth: 72,
  },
  count: {
    fontSize: 20,
    fontFamily: fontFamily.bold,
  },
  label: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
  },
});
