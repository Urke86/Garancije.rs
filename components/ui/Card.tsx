import { View, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { colors } from '@/lib/colors';
import { cardShadow } from './cardStyles';

interface Props {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
  /** Skraćuje sadržaj na zaobljene ivice (npr. ugradjeni feature blok). */
  clip?: boolean;
}

export function Card({ children, style, padded = true, clip = false }: Props) {
  return (
    <View style={[styles.card, clip && styles.clip, padded && styles.padded, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...cardShadow,
  },
  clip: {
    overflow: 'hidden',
  },
  padded: {
    padding: 16,
  },
});
