import { Platform } from 'react-native';
import { colors } from '@/lib/colors';

export const cardShadow = Platform.select({
  web: { boxShadow: '0 8px 24px rgba(6, 43, 95, 0.08)' } as object,
  default: {
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
});
