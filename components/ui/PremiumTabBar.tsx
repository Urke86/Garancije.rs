import { View, Text, Pressable, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import * as Haptics from 'expo-haptics';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { House, Receipt, UserRound } from 'lucide-react-native';
import { fontFamily } from '@/lib/typography';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';
import { TabBarIcon } from '@/components/ui/TabBarIcon';
import { ScanTabButton } from '@/components/ui/ScanTabButton';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useTheme } from '@/contexts/ThemeContext';
import type { AppColors } from '@/lib/theme';

const TAB_ICONS: Record<string, typeof House> = {
  index: House,
  timeline: Receipt,
  profile: UserRound,
};

export function PremiumTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const styles = useThemedStyles(createStyles);
  const { isDark } = useTheme();

  const { bottomInset, height, topPadding } = useTabBarLayout();

  const onTabPress = (routeName: string, routeKey: string, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: routeKey,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      navigation.navigate(routeName);
    }
  };

  return (
    <View style={[styles.container, { height, paddingBottom: bottomInset, paddingTop: topPadding }]}>
      <View style={StyleSheet.absoluteFill}>
        {Platform.OS === 'ios' ? (
          <BlurView intensity={72} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        ) : null}
        <View style={[StyleSheet.absoluteFill, styles.glassOverlay]} />
      </View>

      <View style={styles.row}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const label = options.title ?? route.name;
          const badge = options.tabBarBadge;

          if (route.name === 'scan') {
            return (
              <View key={route.key} style={styles.scanSlot}>
                <ScanTabButton
                  onPress={() => onTabPress(route.name, route.key, isFocused)}
                  accessibilityState={{ selected: isFocused }}
                  bottomInset={bottomInset}
                  children={null}
                />
              </View>
            );
          }

          const Icon = TAB_ICONS[route.name] ?? House;

          return (
            <Pressable
              key={route.key}
              onPress={() => onTabPress(route.name, route.key, isFocused)}
              style={styles.tab}
              accessibilityRole="button"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={
                typeof options.tabBarAccessibilityLabel === 'string'
                  ? options.tabBarAccessibilityLabel
                  : label
              }
            >
              <View style={styles.iconStack}>
                <TabBarIcon focused={isFocused} Icon={Icon} />
                {badge != null ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>
                      {typeof badge === 'number' && badge > 9 ? '9+' : String(badge)}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text style={[styles.label, isFocused && styles.labelActive]} numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    borderTopWidth: 1,
    borderTopColor: colors.tabBarBorder,
    overflow: 'visible',
    ...Platform.select({
      web: { boxShadow: '0 -4px 24px rgba(6, 43, 95, 0.06)' } as object,
      default: {
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.06,
        shadowRadius: 24,
        elevation: 16,
      },
    }),
  },
  glassOverlay: {
    backgroundColor: colors.tabBarGlass,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 2,
    minHeight: 52,
  },
  scanSlot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  iconStack: {
    position: 'relative',
    alignItems: 'center',
  },
  label: {
    fontSize: 11,
    fontFamily: fontFamily.medium,
    color: colors.tabInactive,
    marginTop: 2,
  },
  labelActive: {
    color: colors.tabActive,
    fontFamily: fontFamily.semibold,
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: colors.surface,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    color: colors.textInverse,
  },
});
