import { View, Text, StyleSheet } from 'react-native';
import { Camera, ShieldCheck, Bell } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { useColors } from '@/contexts/ThemeContext';

export function AuthBenefits() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const colors = useColors();

  const benefits = [
    { Icon: Camera, text: t('auth.benefitScan'), key: 'scan' },
    { Icon: ShieldCheck, text: t('auth.benefitTrack'), key: 'track' },
    { Icon: Bell, text: t('auth.benefitRemind'), key: 'remind' },
  ] as const;

  return (
    <View style={styles.list}>
      {benefits.map(({ Icon, text, key }) => (
        <View key={key} style={styles.row}>
          <View style={styles.iconWrap}>
            <Icon size={16} color={colors.accent} strokeWidth={2.2} />
          </View>
          <Text style={styles.text}>{text}</Text>
        </View>
      ))}
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  list: {
    gap: 10,
    marginTop: 20,
    alignSelf: 'stretch',
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    flex: 1,
    minWidth: 0,
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Medium',
    color: colors.text,
    lineHeight: 20,
  },
});
