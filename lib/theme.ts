export type ThemeMode = 'light' | 'dark';

export type AppColors = {
  primary: string;
  primaryLight: string;
  primaryDark: string;
  accent: string;
  accentGreen: string;
  wordmarkGradientStart: string;
  wordmarkGradientEnd: string;
  accentLight: string;
  accentGreenLight: string;
  secondary: string;
  secondaryLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  error: string;
  errorLight: string;
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  borderLight: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  disabled: string;
  tabInactive: string;
  tabActive: string;
  tabBarGlass: string;
  tabBarBorder: string;
  tabActiveGradient: readonly [string, string, string];
  screenGradientTop: string;
  blobTopOpacity: number;
  blobBottomOpacity: number;
  cardShadowColor: string;
  authGradientTop: string;
  authGradientMid: string;
  authGradientBottom: string;
};

export const lightColors: AppColors = {
  primary: '#062B5F',
  primaryLight: '#0A3D7A',
  primaryDark: '#041E42',
  accent: '#00B8D9',
  accentGreen: '#7ED957',
  wordmarkGradientStart: '#00C2CB',
  wordmarkGradientEnd: '#7ED957',
  accentLight: 'rgba(0, 184, 217, 0.2)',
  accentGreenLight: 'rgba(126, 217, 87, 0.25)',
  secondary: '#00B8D9',
  secondaryLight: '#33C9E2',
  success: '#059669',
  successLight: '#E6F9EF',
  warning: '#D97706',
  warningLight: '#FEF3C7',
  error: '#DC2626',
  errorLight: '#FEE2E2',
  background: '#F7FAFC',
  surface: '#FFFFFF',
  surfaceAlt: '#EDF2F7',
  border: '#E2E8F0',
  borderLight: '#F1F5F9',
  text: '#062B5F',
  textSecondary: '#6B7A90',
  textMuted: '#6B7A90',
  textInverse: '#FFFFFF',
  disabled: '#94A3B8',
  tabInactive: '#7A8CA5',
  tabActive: '#062B5F',
  tabBarGlass: 'rgba(255, 255, 255, 0.92)',
  tabBarBorder: 'rgba(255, 255, 255, 0.5)',
  tabActiveGradient: ['#0077C8', '#00C2CB', '#7ED957'],
  screenGradientTop: 'rgba(0, 184, 217, 0.06)',
  blobTopOpacity: 0.3,
  blobBottomOpacity: 0.15,
  cardShadowColor: 'rgba(6, 43, 95, 0.08)',
  authGradientTop: 'rgba(0, 184, 217, 0.12)',
  authGradientMid: '#F7FAFC',
  authGradientBottom: '#FFFFFF',
};

export const darkColors: AppColors = {
  primary: '#7DD3FC',
  primaryLight: '#BAE6FD',
  primaryDark: '#38BDF8',
  accent: '#22D3EE',
  accentGreen: '#86EFAC',
  wordmarkGradientStart: '#22D3EE',
  wordmarkGradientEnd: '#86EFAC',
  accentLight: 'rgba(34, 211, 238, 0.18)',
  accentGreenLight: 'rgba(134, 239, 172, 0.18)',
  secondary: '#22D3EE',
  secondaryLight: '#67E8F9',
  success: '#34D399',
  successLight: 'rgba(52, 211, 153, 0.16)',
  warning: '#FBBF24',
  warningLight: 'rgba(251, 191, 36, 0.16)',
  error: '#F87171',
  errorLight: 'rgba(248, 113, 113, 0.16)',
  background: '#0B1220',
  surface: '#152238',
  surfaceAlt: '#1E2F4A',
  border: '#2A3F5F',
  borderLight: '#1E3050',
  text: '#F1F5F9',
  textSecondary: '#94A3B8',
  textMuted: '#64748B',
  textInverse: '#0B1220',
  disabled: '#475569',
  tabInactive: '#64748B',
  tabActive: '#7DD3FC',
  tabBarGlass: 'rgba(11, 18, 32, 0.94)',
  tabBarBorder: 'rgba(255, 255, 255, 0.08)',
  tabActiveGradient: ['#0077C8', '#22D3EE', '#86EFAC'],
  screenGradientTop: 'rgba(34, 211, 238, 0.1)',
  blobTopOpacity: 0.22,
  blobBottomOpacity: 0.1,
  cardShadowColor: 'rgba(0, 0, 0, 0.35)',
  authGradientTop: 'rgba(34, 211, 238, 0.14)',
  authGradientMid: '#0B1220',
  authGradientBottom: '#152238',
};

export function getColorsForMode(mode: ThemeMode): AppColors {
  return mode === 'dark' ? darkColors : lightColors;
}
