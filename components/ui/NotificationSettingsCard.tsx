import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Switch, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Bell } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/lib/colors';
import { fontFamily } from '@/lib/typography';
import { Card } from '@/components/ui/Card';
import {
  getNotificationPreferences,
  upsertNotificationPreferences,
  OFFSET_OPTIONS,
} from '@/lib/notification-preferences';
import { registerForPushNotifications } from '@/lib/notifications';

export function NotificationSettingsCard() {
  const { user } = useAuth();
  const [enabled, setEnabled] = useState(true);
  const [offsets, setOffsets] = useState<number[]>([30, 14, 7, 1]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const prefs = await getNotificationPreferences(user.id);
    setEnabled(prefs.enabled);
    setOffsets(prefs.offsets_days);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async (nextEnabled: boolean, nextOffsets: number[]) => {
    if (!user) return;
    setSaving(true);
    await upsertNotificationPreferences(user.id, {
      enabled: nextEnabled,
      offsets_days: nextOffsets,
    });
    if (nextEnabled) {
      await registerForPushNotifications(user.id);
    }
    setSaving(false);
  };

  const toggleEnabled = async (value: boolean) => {
    setEnabled(value);
    await save(value, offsets);
  };

  const toggleOffset = async (days: number) => {
    const next = offsets.includes(days)
      ? offsets.filter((d) => d !== days)
      : [...offsets, days].sort((a, b) => b - a);
    if (next.length === 0) return;
    setOffsets(next);
    await save(enabled, next);
  };

  if (loading) {
    return (
      <Card style={styles.card}>
        <ActivityIndicator color={colors.primary} />
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <Bell size={18} color={colors.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Podsetnici garancije</Text>
          <Text style={styles.subtitle}>Push obaveštenja pre isteka garancije</Text>
        </View>
        <Switch
          value={enabled}
          onValueChange={toggleEnabled}
          trackColor={{ false: colors.border, true: colors.accentLight }}
          thumbColor={enabled ? colors.primary : colors.disabled}
          disabled={saving}
        />
      </View>

      {enabled ? (
        <View style={styles.offsets}>
          <Text style={styles.offsetsLabel}>Kada da vas podsetimo?</Text>
          <View style={styles.chips}>
            {OFFSET_OPTIONS.map((opt) => {
              const active = offsets.includes(opt.days);
              return (
                <TouchableOpacity
                  key={opt.days}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => toggleOffset(opt.days)}
                  disabled={saving}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: 28 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: { flex: 1 },
  title: {
    fontSize: 15,
    fontFamily: fontFamily.semibold,
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    marginTop: 2,
  },
  offsets: { marginTop: 16 },
  offsetsLabel: {
    fontSize: 13,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
    marginBottom: 10,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
  },
  chipTextActive: {
    color: colors.textInverse,
  },
});
