import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ArrowLeft } from 'lucide-react-native';
import { router } from 'expo-router';
import { fontFamily } from '@/lib/typography';
import { layout, space } from '@/lib/spacing';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { useColors } from '@/contexts/ThemeContext';

interface Props {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

export function StackScreenHeader({ title, subtitle, onBack }: Props) {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/(tabs)/profile');
  };

  return (
    <View style={styles.row}>
      <TouchableOpacity
        onPress={handleBack}
        style={styles.backBtn}
        accessibilityRole="button"
        accessibilityLabel="Nazad"
      >
        <ArrowLeft size={24} color={colors.text} />
      </TouchableOpacity>
      <View style={styles.textCol}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: space.md,
    marginBottom: layout.headerGap,
  },
  backBtn: {
    padding: space.xs,
    marginTop: 2,
  },
  textCol: { flex: 1, paddingTop: 2 },
  title: {
    fontSize: 24,
    fontFamily: fontFamily.extrabold,
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    marginTop: space.xs,
    lineHeight: 20,
  },
});
