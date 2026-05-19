import { TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Camera } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';

interface Props extends BottomTabBarButtonProps {
  bottomInset?: number;
}

export function ScanTabButton({ onPress, accessibilityState, bottomInset = 0 }: Props) {
  const focused = accessibilityState?.selected;
  const lift = bottomInset > 0 ? -20 : -18;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.wrap, { top: lift }]}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      accessibilityLabel="Skeniraj račun"
    >
      <LinearGradient
        colors={[colors.primary, colors.accent]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.fab, focused && styles.fabFocused]}
      >
        <Camera size={26} color={colors.textInverse} strokeWidth={2.2} />
      </LinearGradient>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fab: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: colors.surface,
    ...Platform.select({
      web: { boxShadow: '0 8px 20px rgba(6, 43, 95, 0.25)' } as object,
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.28,
        shadowRadius: 10,
        elevation: 8,
      },
    }),
  },
  fabFocused: {
    transform: [{ scale: 1.05 }],
  },
});
