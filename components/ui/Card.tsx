import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { getCardShadow } from './cardStyles';
import type { AppColors } from '@/lib/theme';

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  clip?: boolean;
}

export function Card({ children, style, padded = true, clip = false }: Props) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.card, clip && styles.clip, padded && styles.padded, style]}>
      {children}
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: colors.border,
      ...getCardShadow(colors),
    },
    clip: {
      overflow: 'hidden',
    },
    padded: {
      padding: 16,
    },
  });
