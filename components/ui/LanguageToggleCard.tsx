import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Languages } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/contexts/LocaleContext';
import type { AppLocale } from '@/lib/locale-storage';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { fontFamily } from '@/lib/typography';
import { layout, space } from '@/lib/spacing';
import { Card } from '@/components/ui/Card';

const OPTIONS: { locale: AppLocale; labelKey: 'common.languageSr' | 'common.languageEn' }[] = [
  { locale: 'sr', labelKey: 'common.languageSr' },
  { locale: 'en', labelKey: 'common.languageEn' },
];

export function LanguageToggleCard() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const styles = useThemedStyles(createStyles);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <View style={styles.iconWrap}>
          <Languages size={20} color={styles.headerIconColor.color} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{t('common.language')}</Text>
          <Text style={styles.subtitle}>{t('common.languageSubtitle')}</Text>
        </View>
      </View>

      <View style={styles.segmented}>
        {OPTIONS.map(({ locale: optionLocale, labelKey }) => (
          <LanguageOption
            key={optionLocale}
            label={t(labelKey)}
            active={locale === optionLocale}
            onPress={() => setLocale(optionLocale)}
            styles={styles}
          />
        ))}
      </View>
    </Card>
  );
}

export function LanguageSwitcherCompact() {
  const { t } = useTranslation();
  const { locale, setLocale } = useLocale();
  const styles = useThemedStyles(createCompactStyles);

  return (
    <View style={styles.row}>
      {OPTIONS.map(({ locale: optionLocale, labelKey }) => {
        const label = t(labelKey);
        const active = locale === optionLocale;
        return (
          <TouchableOpacity
            key={optionLocale}
            style={[styles.chip, active && styles.chipActive]}
            onPress={() => setLocale(optionLocale)}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            accessibilityLabel={t('common.language_a11y', { label })}
          >
            <Text style={[styles.chipLabel, active && styles.chipLabelActive]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function LanguageOption({
  label,
  active,
  onPress,
  styles,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  const { t } = useTranslation();

  return (
    <TouchableOpacity
      style={[styles.option, active && styles.optionActive]}
      onPress={onPress}
      activeOpacity={0.85}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={t('common.language_a11y', { label })}
    >
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
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: space.md,
      borderRadius: layout.radius - 4,
    },
    optionActive: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
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

const createCompactStyles = (colors: AppColors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignSelf: 'flex-end',
      gap: space.xs,
      marginBottom: space.sm,
    },
    chip: {
      paddingHorizontal: space.md,
      paddingVertical: space.xs + 2,
      borderRadius: layout.radius - 4,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipActive: {
      borderColor: colors.primary,
      backgroundColor: colors.accentLight,
    },
    chipLabel: {
      fontSize: 13,
      fontFamily: fontFamily.medium,
      color: colors.textMuted,
    },
    chipLabelActive: {
      color: colors.primary,
      fontFamily: fontFamily.semibold,
    },
  });
