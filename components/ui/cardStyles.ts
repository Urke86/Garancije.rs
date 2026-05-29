import { Platform } from 'react-native';
import type { AppColors } from '@/lib/theme';

export function getCardShadow(colors: AppColors) {
  return Platform.select({
    web: { boxShadow: `0 8px 24px ${colors.cardShadowColor}` } as object,
    default: {
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: colors.cardShadowColor.includes('0.35') ? 0.25 : 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
  });
}
