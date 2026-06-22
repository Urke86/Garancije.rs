import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { fontFamily } from '@/lib/typography';
import { layout, space } from '@/lib/spacing';
import { Card } from './Card';
import { StatPill } from './StatPill';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';

interface Props {
  receiptCount: number;
  total: number;
  active: number;
  expiring: number;
  expired: number;
}

export function WarrantySummaryCard({
  receiptCount,
  total,
  active,
  expiring,
  expired,
}: Props) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  const showReceiptsOnly = receiptCount > 0 && total === 0;
  const displayNumber = showReceiptsOnly ? receiptCount : total;

  const context = showReceiptsOnly
    ? t('home.summaryContextReceiptSaved')
    : receiptCount === 0
      ? t('home.summaryContextAddFirst')
      : expiring > 0
        ? t('home.summaryContextExpiring', { count: expiring })
        : expired > 0 && active === 0
          ? t('home.summaryContextAllExpired')
          : t('home.summaryContextAllGood');

  const bigLabel = showReceiptsOnly
    ? t('home.summarySavedReceipt', { count: receiptCount })
    : total === 0
      ? t('home.summaryNoWarranties')
      : t('home.summaryWarrantyItem', { count: total });

  return (
    <Card style={styles.card}>
      <Text style={styles.bigNumber}>{displayNumber}</Text>
      <Text style={styles.bigLabel}>{bigLabel}</Text>
      <Text style={styles.context}>{context}</Text>
      {total > 0 ? (
        <View style={styles.pills}>
          <StatPill status="active" count={active} compact />
          <StatPill status="expiring" count={expiring} compact />
          <StatPill status="expired" count={expired} compact />
        </View>
      ) : null}
    </Card>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  card: { marginBottom: layout.headerGap - 4 },
  bigNumber: {
    fontSize: 44,
    fontFamily: fontFamily.extrabold,
    color: colors.primary,
    letterSpacing: -1,
  },
  bigLabel: {
    fontSize: 15,
    fontFamily: fontFamily.medium,
    color: colors.text,
    marginTop: 2,
  },
  context: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    marginTop: 8,
    lineHeight: 20,
  },
  pills: {
    flexDirection: 'row',
    gap: space.sm,
    marginTop: space.lg,
  },
});
