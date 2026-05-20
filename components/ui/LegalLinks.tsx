import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FileText, Shield, Mail } from 'lucide-react-native';
import { colors } from '@/lib/colors';
import { fontFamily } from '@/lib/typography';
import { openPrivacyContact, openPrivacyPolicy, openTerms } from '@/lib/legal-links';

type Variant = 'profile' | 'consent';

interface Props {
  variant?: Variant;
  /** Tekst pre linkova; podrazumevano poruka za registraciju. */
  consentIntro?: string;
}

const DEFAULT_CONSENT_INTRO = 'Registracijom prihvatate';

export function LegalLinks({ variant = 'profile', consentIntro = DEFAULT_CONSENT_INTRO }: Props) {
  if (variant === 'consent') {
    return (
      <Text style={styles.consent}>
        {consentIntro}{' '}
        <Text style={styles.consentLink} onPress={openPrivacyPolicy}>
          Politiku privatnosti
        </Text>{' '}
        i{' '}
        <Text style={styles.consentLink} onPress={openTerms}>
          Uslove korišćenja
        </Text>
        .
      </Text>
    );
  }

  return (
    <View style={styles.list}>
      <LegalRow icon={Shield} label="Politika privatnosti" onPress={openPrivacyPolicy} />
      <LegalRow icon={FileText} label="Uslovi korišćenja" onPress={openTerms} />
      <LegalRow icon={Mail} label="Kontakt za privatnost" onPress={openPrivacyContact} isLast />
    </View>
  );
}

function LegalRow({
  icon: Icon,
  label,
  onPress,
  isLast,
}: {
  icon: typeof Shield;
  label: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <TouchableOpacity
      style={[styles.row, isLast && styles.rowLast]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="link"
      accessibilityLabel={label}
    >
      <Icon size={18} color={colors.primary} />
      <Text style={styles.rowLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
  rowLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: colors.primary,
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
