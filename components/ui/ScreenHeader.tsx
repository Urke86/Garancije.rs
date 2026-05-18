import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '@/lib/colors';
import { fontFamily } from '@/lib/typography';

interface Props {
  title: string;
  subtitle?: string;
  greeting?: string;
  onAvatarPress?: () => void;
  avatarLabel?: string;
}

export function ScreenHeader({ title, subtitle, greeting, onAvatarPress, avatarLabel }: Props) {
  return (
    <View style={styles.row}>
      <View style={styles.textCol}>
        {greeting ? <Text style={styles.greeting}>{greeting}</Text> : null}
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {avatarLabel && onAvatarPress ? (
        <TouchableOpacity style={styles.avatar} onPress={onAvatarPress} activeOpacity={0.8}>
          <Text style={styles.avatarText}>{avatarLabel}</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  textCol: { flex: 1 },
  greeting: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: colors.accent,
    marginBottom: 4,
  },
  title: {
    fontSize: 26,
    fontFamily: fontFamily.extrabold,
    color: colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    marginTop: 4,
    lineHeight: 22,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 184, 217, 0.25)',
  },
  avatarText: {
    fontSize: 15,
    fontFamily: fontFamily.bold,
    color: colors.primary,
  },
});
