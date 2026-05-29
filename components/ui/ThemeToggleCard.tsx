import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Moon, Sun } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { fontFamily } from '@/lib/typography';
import { layout, space } from '@/lib/spacing';
import { Card } from '@/components/ui/Card';

export function ThemeToggleCard() {
  const { mode, setMode } = useTheme();
  const styles = useThemedStyles(createStyles);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          {mode === 'dark' ? (
            <Moon size={20} color={styles.headerIconColor.color} />
          ) : (
            <Sun size={20} color={styles.headerIconColor.color} />
          )}
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Izgled aplikacije</Text>
          <Text style={styles.subtitle}>Svetla ili tamna tema — izbor se pamti za vaš nalog</Text>
        </View>
      </View>

      <View style={styles.segmented}>
        <ThemeOption
          label="Svetla"
          icon={Sun}
          active={mode === 'light'}
          onPress={() => setMode('light')}
          styles={styles}
        />
        <ThemeOption
          label="Tamna"
          icon={Moon}
          active={mode === 'dark'}
          onPress={() => setMode('dark')}
          styles={styles}
        />
      </View>
    </Card>
  );
}

function ThemeOption({
  label,
  icon: Icon,
  active,
  onPress,
  styles,
}: {
  label: string;
  icon: typeof Sun;
  active: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <TouchableOpacity
      style={[styles.option, active && styles.optionActive]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={`${label} tema`}
    >
      <Icon size={18} color={active ? styles.optionIconActive.color : styles.optionIcon.color} />
      <Text style={[styles.optionLabel, active && styles.optionLabelActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    card: { gap: space.lg },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: space.md,
    },
    iconWrap: {
      width: 40,
      height: 40,
      borderRadius: layout.radius - 4,
      backgroundColor: colors.accentLight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    headerIconColor: { color: colors.primary },
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
      marginTop: space.xs,
      lineHeight: 17,
    },
    segmented: {
      flexDirection: 'row',
      gap: space.sm,
      backgroundColor: colors.surfaceAlt,
      borderRadius: layout.radius - 2,
      padding: space.xs,
      borderWidth: 1,
      borderColor: colors.border,
    },
    option: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: space.sm,
      paddingVertical: space.md,
      borderRadius: layout.radius - 4,
    },
    optionActive: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    optionIcon: { color: colors.textMuted },
    optionIconActive: { color: colors.primary },
    optionLabel: {
      fontSize: 14,
      fontFamily: fontFamily.medium,
      color: colors.textMuted,
    },
    optionLabelActive: {
      color: colors.text,
      fontFamily: fontFamily.semibold,
    },
  });
