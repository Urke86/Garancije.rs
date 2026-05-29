import { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { handleWebOAuthCallback } from '@/lib/auth/google';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';
import { useColors } from '@/contexts/ThemeContext';
export default function AuthCallbackScreen() {
  const styles = useThemedStyles(createStyles);
  const colors = useColors();

  const [message, setMessage] = useState('Završavamo prijavu...');

  useEffect(() => {
    let cancelled = false;

    const finish = async () => {
      if (Platform.OS === 'web') {
        const { error } = await handleWebOAuthCallback();
        if (cancelled) return;
        if (error) {
          setMessage(error);
          setTimeout(() => router.replace('/(auth)'), 3000);
          return;
        }
      }

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;

      if (sessionError) {
        setMessage(sessionError.message);
        setTimeout(() => router.replace('/(auth)'), 3000);
        return;
      }

      if (session) {
        router.replace('/(tabs)');
      } else {
        setMessage('Prijava nije uspela. Pokušajte ponovo.');
        setTimeout(() => router.replace('/(auth)'), 2500);
      }
    };

    finish();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'SIGNED_IN' && session) {
        router.replace('/(tabs)');
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.background,
    padding: 24,
  },
  text: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Medium',
    color: colors.textSecondary,
    textAlign: 'center',
    maxWidth: 320,
  },
});
