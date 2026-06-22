import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Linking } from 'react-native';
import { Bell, ChevronRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { fontFamily } from '@/lib/typography';
import { getPushPermissionStatus, requestPushPermissions } from '@/lib/notifications';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { useColors } from '@/contexts/ThemeContext';

interface Props {
  onPermissionGranted?: () => void;
}

export function NotificationPermissionBanner({ onPermissionGranted }: Props) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const colors = useColors();

  const [status, setStatus] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [loading, setLoading] = useState(false);

  const check = useCallback(async () => {
    const s = await getPushPermissionStatus();
    setStatus(s);
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  if (Platform.OS === 'web' || status === 'granted') return null;

  const handleEnable = async () => {
    if (status === 'denied') {
      await Linking.openSettings();
      return;
    }
    setLoading(true);
    const result = await requestPushPermissions();
    setStatus(result);
    setLoading(false);
    if (result === 'granted') onPermissionGranted?.();
  };

  return (
    <TouchableOpacity
      style={styles.banner}
      onPress={handleEnable}
      activeOpacity={0.9}
      disabled={loading}
      accessibilityRole="button"
      accessibilityLabel={
        status === 'denied'
          ? t('notifications.bannerOpenSettings_a11y')
          : t('notifications.bannerEnable_a11y')
      }
    >
      <View style={styles.iconWrap}>
        <Bell size={20} color={colors.primary} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>{t('notifications.bannerTitle')}</Text>
        <Text style={styles.body}>
          {status === 'denied'
            ? t('notifications.bannerBodyDenied')
            : t('notifications.bannerBodyUndetermined')}
        </Text>
      </View>
      <ChevronRight size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.borderAccentSoft,
    padding: 14,
    marginBottom: 16,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1 },
  title: {
    fontSize: 14,
    fontFamily: fontFamily.semibold,
    color: colors.text,
    marginBottom: 2,
  },
  body: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    lineHeight: 18,
  },
});
