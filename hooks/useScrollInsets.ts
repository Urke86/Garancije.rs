import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTabBarLayout } from '@/hooks/useTabBarLayout';
import { layout } from '@/lib/spacing';

/** Donji padding za ScrollView — tab bar ili safe area. */
export function useScrollInsets(options?: { tabBar?: boolean }) {
  const insets = useSafeAreaInsets();
  const { scrollBottomPadding } = useTabBarLayout();

  return {
    paddingHorizontal: layout.gutter,
    paddingBottom: options?.tabBar ? scrollBottomPadding : insets.bottom + layout.scrollBottom,
  };
}
