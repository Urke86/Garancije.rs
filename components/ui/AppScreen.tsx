import { ReactNode } from 'react';
import { View, StyleSheet, type ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '@/lib/colors';

interface Props {
  children: ReactNode;
  style?: ViewStyle;
  noPadding?: boolean;
}

export function AppScreen({ children, style, noPadding }: Props) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.root, style]}>
      <LinearGradient
        colors={['rgba(0, 184, 217, 0.06)', colors.background, colors.background]}
        locations={[0, 0.35, 1]}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.blob, styles.blobTop]} />
      <View style={[styles.blob, styles.blobBottom]} />
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1 },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    opacity: 0.3,
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
    opacity: 0.15,
  },
});
