import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { router, Slot } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { hasVerifiedEmail } from '@/lib/auth/session';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { useColors } from '@/contexts/ThemeContext';

/** Zaštita receipt stack-a — samo verifikovani korisnici. */
export function ReceiptAuthGuard() {
  const { user, loading } = useAuth();
  const styles = useThemedStyles(createStyles);
  const colors = useColors();

  useEffect(() => {
    if (!loading && (!user || !hasVerifiedEmail(user))) {
      router.replace('/(auth)');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!user || !hasVerifiedEmail(user)) {
    return null;
  }

  return <Slot />;
}

const createStyles = (colors: AppColors) =>
  StyleSheet.create({
    centered: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
  });
