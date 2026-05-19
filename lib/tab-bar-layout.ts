import { Platform } from 'react-native';
import type { EdgeInsets } from 'react-native-safe-area-context';

/** Visina reda sa ikonama i labelama (bez safe area). */
export const TAB_BAR_CONTENT_HEIGHT = 52;
export const TAB_BAR_TOP_PADDING = 8;
/** FAB Skeniraj izlazi iznad tab bara. */
export const TAB_BAR_FAB_OVERFLOW = 28;

/**
 * Donji inset za tab bar. Na Androidu sa 3-button navigacijom safe area često
 * vraća 0 i tabovi se preklapaju sa sistemskim dugmićima — rezervišemo prostor.
 */
export function getTabBarBottomInset(bottom: number): number {
  if (Platform.OS === 'web') return 0;
  if (Platform.OS === 'ios') return Math.max(bottom, 20);
  if (bottom >= 24) return bottom;
  return bottom > 0 ? bottom : 48;
}

export function getTabBarHeight(insets: EdgeInsets): number {
  const bottom = getTabBarBottomInset(insets.bottom);
  return TAB_BAR_CONTENT_HEIGHT + TAB_BAR_TOP_PADDING + bottom;
}

export function getScrollBottomPadding(insets: EdgeInsets): number {
  return getTabBarHeight(insets) + TAB_BAR_FAB_OVERFLOW + 12;
}
