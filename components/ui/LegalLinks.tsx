import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { FileText, Shield, Mail, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { fontFamily } from '@/lib/typography';
import { openPrivacyContact, openPrivacyPolicy, openTerms } from '@/lib/legal-links';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { useColors } from '@/contexts/ThemeContext';

type Variant = 'profile' | 'consent';

interface Props {
  variant?: Variant;
  consentIntro?: string;
  onDeleteAccount?: () => void;
  deleting?: boolean;
}

export function LegalLinks({
  variant = 'profile',
  consentIntro,
  onDeleteAccount,
  deleting = false,
}: Props) {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);
  const intro = consentIntro ?? t('legal.consentIntroDefault');

  if (variant === 'consent') {
    return (
      <Text style={styles.consent}>
        {intro}{' '}
        <Text style={styles.consentLink} onPress={openPrivacyPolicy}>
          {t('legal.privacyPolicy')}
        </Text>{' '}
        {t('legal.consentJoiner')}{' '}
        <Text style={styles.consentLink} onPress={openTerms}>
          {t('legal.termsOfUse')}
        </Text>
        .
      </Text>
    );
  }

  return (
    <View style={styles.list}>
      <LegalRow icon={Shield} label={t('legal.privacyPolicy')} onPress={openPrivacyPolicy} />
      <LegalRow icon={FileText} label={t('legal.termsOfUse')} onPress={openTerms} />
      <LegalRow icon={Mail} label={t('legal.privacyContact')} onPress={openPrivacyContact} isLast={!onDeleteAccount} />
      {onDeleteAccount ? (
        <LegalRow
          icon={Trash2}
          label={deleting ? t('legal.deletingAccount') : t('legal.deleteAccount')}
          onPress={onDeleteAccount}
          destructive
          disabled={deleting}
          isLast
        />
      ) : null}
    </View>
  );
}

function LegalRow({
  icon: Icon,
  label,
  onPress,
  isLast,
  destructive,
  disabled,
}: {
  icon: typeof Shield;
  label: string;
  onPress: () => void;
  isLast?: boolean;
  destructive?: boolean;
  disabled?: boolean;
}) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();
  const tint = destructive ? colors.error : colors.primary;

  return (
    <TouchableOpacity
      style={[styles.row, isLast && styles.rowLast, disabled && styles.rowDisabled]}
      onPress={onPress}
      activeOpacity={0.85}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      {disabled ? (
        <ActivityIndicator size="small" color={tint} />
      ) : (
        <Icon size={18} color={tint} />
      )}
      <Text style={[styles.rowLabel, destructive && styles.rowLabelDestructive]}>{label}</Text>
    </TouchableOpacity>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  list: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    marginTop: 12,
    paddingTop: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  rowLast: {
    borderBottomWidth: 0,
  },
  rowDisabled: {
    opacity: 0.7,
  },
  rowLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: colors.primary,
  },
  rowLabelDestructive: {
    color: colors.error,
  },
  consent: {
    marginTop: 16,
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 4,
  },
  consentLink: {
    fontFamily: fontFamily.semibold,
    color: colors.accent,
    textDecorationLine: 'underline',
  },
});
