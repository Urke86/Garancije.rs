import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import type { ReactNode } from 'react';
import { fontFamily } from '@/lib/typography';
import { layout, space } from '@/lib/spacing';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';

interface Props {
  title: string;
  children: ReactNode;
  /** Prva sekcija odmah ispod headera — bez dodatnog top margina */
  first?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function ScreenSection({ title, children, first, style }: Props) {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={[styles.section, first && styles.sectionFirst, style]}>
      <Text style={styles.title}>{title}</Text>
      {children}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  section: {
    marginTop: layout.section,
    gap: space.md,
  },
  sectionFirst: {
    marginTop: 0,
  },
  title: {
    fontSize: 15,
    fontFamily: fontFamily.semibold,
    color: colors.text,
    letterSpacing: -0.2,
  },
});
