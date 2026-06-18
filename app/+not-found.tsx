import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { fontFamily } from '@/lib/typography';

export default function NotFoundScreen() {
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Stranica nije pronađena</Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.replace('/')}
        accessibilityRole="button"
        accessibilityLabel="Nazad na početnu"
      >
        <Text style={styles.buttonText}>Nazad na početnu</Text>
      </TouchableOpacity>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background, padding: 24 },
  title: { fontSize: 18, fontFamily: fontFamily.medium, color: colors.text, marginBottom: 16 },
  button: { backgroundColor: colors.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 12 },
  buttonText: { color: colors.textInverse, fontSize: 15, fontFamily: fontFamily.medium },
});
