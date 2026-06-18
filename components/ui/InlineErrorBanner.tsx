import { Text, StyleSheet } from 'react-native';
import { fontFamily } from '@/lib/typography';
import { space } from '@/lib/spacing';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';

interface Props {
  message: string;
}

export function InlineErrorBanner({ message }: Props) {
  const styles = useThemedStyles(createStyles);
  if (!message) return null;

  return (
    <Text style={styles.banner} accessibilityRole="alert">
      {message}
    </Text>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    banner: {
      backgroundColor: colors.errorLight,
      borderRadius: 12,
      padding: space.md,
      marginBottom: space.md,
      borderWidth: 1,
      borderColor: colors.borderErrorSoft,
      color: colors.error,
      fontSize: 14,
      fontFamily: fontFamily.medium,
      lineHeight: 20,
    },
  });
