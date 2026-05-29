import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import { fontFamily } from '@/lib/typography';
import { Card } from '@/components/ui/Card';
import { layout, space } from '@/lib/spacing';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { useColors } from '@/contexts/ThemeContext';

interface Props {
  icon: LucideIcon;
  title: string;
  subtitle?: string;
  badge?: number;
  onPress: () => void;
  iconColor?: string;
  iconBackground?: string;
  accessibilityLabel?: string;
}

export function NavRow({
  icon: Icon,
  title,
  subtitle,
  badge,
  onPress,
  iconColor,
  iconBackground,
  accessibilityLabel,
}: Props) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();
  const resolvedIconColor = iconColor ?? colors.primary;
  const resolvedIconBackground = iconBackground ?? colors.accentLight;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? title}
    >
      <Card style={styles.card}>
        <View style={[styles.iconWrap, { backgroundColor: resolvedIconBackground }]}>
          <Icon size={20} color={resolvedIconColor} />
        </View>
        <View style={styles.textCol}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {badge != null && badge > 0 ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
          </View>
        ) : null}
        <ChevronRight size={20} color={colors.textMuted} />
      </Card>
    </TouchableOpacity>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingVertical: space.lg,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: layout.radius - 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, minWidth: 0 },
  title: {
    fontSize: 15,
    fontFamily: fontFamily.semibold,
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    marginTop: space.xs,
    lineHeight: 18,
  },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  badgeText: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    color: colors.textInverse,
  },
});
