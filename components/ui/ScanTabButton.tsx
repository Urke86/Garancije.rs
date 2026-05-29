import { useEffect } from 'react';
import { TouchableOpacity, View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Receipt, Plus } from 'lucide-react-native';
import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { useColors } from '@/contexts/ThemeContext';

interface Props extends BottomTabBarButtonProps {
  bottomInset?: number;
}

const FAB_SIZE = 64;

export function ScanTabButton({ onPress, accessibilityState, bottomInset = 0 }: Props) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();

  const focused = accessibilityState?.selected;
  const lift = bottomInset > 0 ? -22 : -20;
  const scale = useSharedValue(1);
  const pulse = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.06 : 1, { damping: 12, stiffness: 200 });
  }, [focused, scale]);

  useEffect(() => {
    if (focused) {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.08, { duration: 1400 }),
        withTiming(1, { duration: 1400 }),
      ),
      -1,
      false,
    );
  }, [focused, pulse]);

  const fabStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulse.value }],
  }));

  const handlePress: BottomTabBarButtonProps['onPress'] = (event) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress?.(event);
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.92}
      style={[styles.wrap, { top: lift }]}
      accessibilityRole="button"
      accessibilityState={accessibilityState}
      accessibilityLabel="Dodaj račun"
      accessibilityHint="Skenirajte ili izaberite fiskalni račun"
    >
      <Animated.View style={fabStyle}>
        {!focused ? <View style={styles.halo} pointerEvents="none" /> : null}
        <LinearGradient
          colors={[...colors.tabActiveGradient]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.fab, focused && styles.fabFocused]}
        >
          <View style={styles.iconCluster}>
            <Receipt
              size={28}
              color={colors.textInverse}
              strokeWidth={2.2}
              fill="rgba(255,255,255,0.22)"
            />
            <View style={styles.plusBadge}>
              <Plus size={15} color={colors.primary} strokeWidth={3} />
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  wrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  halo: {
    position: 'absolute',
    width: FAB_SIZE + 20,
    height: FAB_SIZE + 20,
    borderRadius: (FAB_SIZE + 20) / 2,
    backgroundColor: 'rgba(0, 194, 203, 0.2)',
    top: -10,
    left: -10,
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: FAB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.95)',
    ...Platform.select({
      web: { boxShadow: '0 10px 28px rgba(0, 119, 200, 0.35)' } as object,
      default: {
        shadowColor: '#0077C8',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
        elevation: 12,
      },
    }),
  },
  fabFocused: {
    borderColor: '#FFFFFF',
  },
  iconCluster: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
  },
  plusBadge: {
    position: 'absolute',
    bottom: 2,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.textInverse,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(6, 43, 95, 0.08)',
  },
});
