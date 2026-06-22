import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { fontFamily } from '@/lib/typography';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('notFound.title')}</Text>
      <Text style={styles.description}>{t('notFound.description')}</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace('/')}
        accessibilityRole="button"
        accessibilityLabel={t('notFound.goHome')}
      >
        <Text style={styles.buttonText}>{t('notFound.goHome')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 24 },
  title: { fontSize: 18, fontFamily: fontFamily.medium, color: colors.text, marginBottom: 8 },
  description: { fontSize: 14, fontFamily: fontFamily.regular, color: colors.textMuted, textAlign: 'center', marginBottom: 16 },
  button: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  buttonText: { color: colors.textInverse, fontSize: 15, fontFamily: fontFamily.medium },
});
