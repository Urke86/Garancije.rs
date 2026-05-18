import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Receipt,
  ShieldCheck,
  TriangleAlert as AlertTriangle,
  Circle as XCircle,
} from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { fontFamily } from '@/lib/typography';
import { getWarrantyStatus, getDaysUntilExpiry } from '@/lib/warranty';
import { Card } from './Card';

export interface ReceiptItemPreview {
  id: string;
  name: string;
  warranty_expires_at?: string | null;
}

export interface ReceiptListCardProps {
  id: string;
  storeName: string;
  purchaseDate: string;
  totalAmount: number;
  receiptItems?: ReceiptItemPreview[];
  onPress: () => void;
}

function StatusIcon({ status }: { status: string }) {
  if (status === 'expiring') return <AlertTriangle size={16} color={colors.warning} />;
  if (status === 'expired') return <XCircle size={16} color={colors.error} />;
  return <ShieldCheck size={16} color={colors.success} />;
}

export function ReceiptListCard({
  storeName,
  purchaseDate,
  totalAmount,
  receiptItems,
  onPress,
}: ReceiptListCardProps) {
  const items = receiptItems ?? [];

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.85}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <View style={styles.icon}>
            <Receipt size={20} color={colors.primary} />
          </View>
          <View style={styles.info}>
            <Text style={styles.storeName} numberOfLines={1}>
              {storeName || 'Nepoznata prodavnica'}
            </Text>
            <Text style={styles.date}>
              {new Date(purchaseDate).toLocaleDateString('sr-RS')}
            </Text>
          </View>
          <Text style={styles.amount}>
            {Number(totalAmount).toLocaleString('sr-RS')} RSD
          </Text>
        </View>
        {items.length > 0 ? (
          <View style={styles.items}>
            {items.slice(0, 3).map((ri) => {
              const status = ri.warranty_expires_at
                ? getWarrantyStatus(ri.warranty_expires_at)
                : 'active';
              const days = ri.warranty_expires_at
                ? getDaysUntilExpiry(ri.warranty_expires_at)
                : 0;
              return (
                <View key={ri.id} style={styles.itemRow}>
                  <StatusIcon status={status} />
                  <Text style={styles.itemName} numberOfLines={1}>
                    {ri.name}
                  </Text>
                  {ri.warranty_expires_at ? (
                    <Text
                      style={[
                        styles.itemExpiry,
                        status === 'expired' && { color: colors.error },
                      ]}
                    >
                      {days > 0 ? `${days} dana` : 'Istekla'}
                    </Text>
                  ) : null}
                </View>
              );
            })}
            {items.length > 3 ? (
              <Text style={styles.more}>+{items.length - 3} stavki</Text>
            ) : null}
          </View>
        ) : null}
      </Card>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 12 },
  header: { flexDirection: 'row', alignItems: 'center' },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  info: { flex: 1 },
  storeName: {
    fontSize: 15,
    fontFamily: fontFamily.semibold,
    color: colors.text,
  },
  date: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  amount: {
    fontSize: 15,
    fontFamily: fontFamily.semibold,
    color: colors.text,
  },
  items: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    gap: 8,
  },
  itemRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  itemName: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
  },
  itemExpiry: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
  },
  more: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: colors.textMuted,
    marginTop: 4,
  },
});
