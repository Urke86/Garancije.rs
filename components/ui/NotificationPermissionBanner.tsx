import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Bell, ChevronRight } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { fontFamily } from '@/lib/typography';
import { getPushPermissionStatus, requestPushPermissions } from '@/lib/notifications';

interface Props {
  onPermissionGranted?: () => void;
}

export function NotificationPermissionBanner({ onPermissionGranted }: Props) {
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
    >
      <View style={styles.iconWrap}>
        <Bell size={20} color={colors.primary} />
      </View>
      <View style={styles.textCol}>
        <Text style={styles.title}>Uključite obaveštenja</Text>
        <Text style={styles.body}>
          {status === 'denied'
            ? 'Obaveštenja su isključena u podešavanjima telefona. Omogućite ih da ne propustite garanciju.'
            : 'Primajte push podsetnike pre isteka garancije — na vreme za reklamaciju.'}
        </Text>
      </View>
      <ChevronRight size={20} color={colors.textMuted} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 184, 217, 0.25)',
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
