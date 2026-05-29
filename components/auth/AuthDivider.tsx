import { View, Text, StyleSheet } from 'react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
export function AuthDivider() {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.row}>
      <View style={styles.line} />
      <Text style={styles.text}>ili</Text>
      <View style={styles.line} />
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 20,
  },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  text: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Medium',
    color: colors.textMuted,
    textTransform: 'lowercase',
  },
});
