import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getTabBarBottomInset,
  getTabBarHeight,
  getScrollBottomPadding,
  TAB_BAR_CONTENT_HEIGHT,
  TAB_BAR_TOP_PADDING,
} from '@/lib/tab-bar-layout';

export function useTabBarLayout() {
  const insets = useSafeAreaInsets();
  const bottomInset = getTabBarBottomInset(insets.bottom);
  const height = getTabBarHeight(insets);
  const scrollBottomPadding = getScrollBottomPadding(insets);

  return {
    bottomInset,
    height,
    scrollBottomPadding,
    contentHeight: TAB_BAR_CONTENT_HEIGHT,
    topPadding: TAB_BAR_TOP_PADDING,
  };
}
