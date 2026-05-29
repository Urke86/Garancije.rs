import { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import type { LucideIcon } from 'lucide-react-native';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { useColors } from '@/contexts/ThemeContext';
const ICON_SIZE = 26;
const PILL_SIZE = 44;

interface Props {
  focused: boolean;
  Icon: LucideIcon;
  color?: string;
}

export function TabBarIcon({ focused, Icon, color }: Props) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();

  const scale = useSharedValue(focused ? 1 : 0.92);

  useEffect(() => {
    scale.value = withSpring(focused ? 1 : 0.92, { damping: 14, stiffness: 220 });
  }, [focused, scale]);

  const animatedWrap = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const inactiveColor = color ?? colors.tabInactive;
  const activeColor = colors.tabActive;

  return (
    <Animated.View style={[styles.wrap, animatedWrap]}>
      {focused ? (
        <View style={styles.pillOuter}>
          <LinearGradient
            colors={[...colors.tabActiveGradient]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.pillGradientRing}
          >
            <View style={styles.pillInner}>
              <Icon
                size={ICON_SIZE}
                color={activeColor}
                strokeWidth={2.25}
                fill={colors.accentLight}
              />
            </View>
          </LinearGradient>
          {Platform.OS !== 'web' ? <View style={styles.glow} pointerEvents="none" /> : null}
        </View>
      ) : (
        <View style={styles.iconPlain}>
          <Icon size={ICON_SIZE} color={inactiveColor} strokeWidth={2} />
        </View>
      )}
    </Animated.View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  wrap: {
    alignItems: 'center',
    justifyContent: 'center',
    height: PILL_SIZE,
  },
  pillOuter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillGradientRing: {
    width: PILL_SIZE,
    height: PILL_SIZE,
    borderRadius: PILL_SIZE / 2,
    padding: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillInner: {
    width: PILL_SIZE - 4,
    height: PILL_SIZE - 4,
    borderRadius: (PILL_SIZE - 4) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      web: { boxShadow: '0 4px 14px rgba(0, 119, 200, 0.18)' } as object,
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.12,
        shadowRadius: 8,
        elevation: 4,
      },
    }),
  },
  glow: {
    position: 'absolute',
    width: PILL_SIZE + 8,
    height: PILL_SIZE + 8,
    borderRadius: (PILL_SIZE + 8) / 2,
    backgroundColor: 'rgba(0, 194, 203, 0.14)',
    zIndex: -1,
  },
  iconPlain: {
    width: PILL_SIZE,
    height: PILL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
