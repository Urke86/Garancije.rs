import { View, Text, StyleSheet } from 'react-native';
import { colors } from '@/lib/colors';
import { fontFamily } from '@/lib/typography';
import { Card } from './Card';
import { StatPill } from './StatPill';

interface Props {
  total: number;
  active: number;
  expiring: number;
  expired: number;
}

export function WarrantySummaryCard({ total, active, expiring, expired }: Props) {
  const context =
    total === 0
      ? 'Skenirajte prvi račun da započnete praćenje garancija.'
      : expiring > 0
        ? `${expiring} garancij${expiring === 1 ? 'a' : 'e'} uskoro ističe — proverite na vreme.`
        : expired > 0 && active === 0
          ? 'Sve aktivne garancije su istekle. Dodajte novi račun.'
          : 'Sve garancije su pod kontrolom.';

  return (
    <Card style={styles.card}>
      <Text style={styles.bigNumber}>{total}</Text>
      <Text style={styles.bigLabel}>
        {total === 1 ? 'stavka pod garancijom' : total > 1 ? 'stavki pod garancijom' : 'nema sačuvanih garancija'}
      </Text>
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

const styles = StyleSheet.create({
  card: { marginBottom: 20 },
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
    gap: 8,
    marginTop: 16,
  },
});
