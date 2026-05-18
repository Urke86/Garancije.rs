import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/lib/colors';
import { fontFamily } from '@/lib/typography';

interface Props {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function SectionHeader({ title, actionLabel, onAction }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.title}>{title}</Text>
      {actionLabel && onAction ? (
        <TouchableOpacity onPress={onAction} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Text style={styles.action}>{actionLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  title: {
    fontSize: 17,
    fontFamily: fontFamily.semibold,
    color: colors.text,
  },
  action: {
    fontSize: 14,
    fontFamily: fontFamily.semibold,
    color: colors.accent,
  },
});
