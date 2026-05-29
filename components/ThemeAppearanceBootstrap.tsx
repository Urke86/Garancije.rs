import { useEffect } from 'react';
import { Platform } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import { useTheme } from '@/contexts/ThemeContext';

export function ThemeAppearanceBootstrap() {
  const { colors, isDark } = useTheme();

  useEffect(() => {
    if (Platform.OS === 'web') return;
    void SystemUI.setBackgroundColorAsync(colors.background);
  }, [colors.background]);

  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}
