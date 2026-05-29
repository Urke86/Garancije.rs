import { ReactNode, useMemo } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColors } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
}

export function AppScreen({ children, style, noPadding }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const styles = useThemedStyles(createStyles);

  const gradientColors = useMemo(
    () => [colors.screenGradientTop, colors.background, colors.background] as const,
    [colors],
  );

  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.blob, styles.blobTop, { opacity: colors.blobTopOpacity }]} />
      <View style={[styles.blob, styles.blobBottom, { opacity: colors.blobBottomOpacity }]} />
      <View
        style={[
          styles.content,
          !noPadding && { paddingTop: Math.max(insets.top, 12) + 8 },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.background },
    content: { flex: 1 },
    blob: {
      position: 'absolute',
      borderRadius: 999,
    },
    blobTop: {
      width: 200,
      height: 200,
      backgroundColor: colors.accent,
      top: -80,
      right: -60,
    },
    blobBottom: {
      width: 140,
      height: 140,
      backgroundColor: colors.accentGreen,
      bottom: 100,
      left: -70,
    },
  });
