import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Platform, Linking } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/lib/colors';
import { fontFamily } from '@/lib/typography';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { establishRecoverySession, translateRecoveryError } from '@/lib/auth/password-reset';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordScreen() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const markReady = () => {
      if (cancelled) return;
      setSessionReady(true);
      setError('');
      setInitializing(false);
    };

    const markFailed = (message: string) => {
      if (cancelled) return;
      setError(message);
      setInitializing(false);
    };

    const init = async () => {
      const launchUrl =
        Platform.OS === 'web'
          ? typeof window !== 'undefined'
            ? window.location.href
            : null
          : await Linking.getInitialURL();

      const initError = await establishRecoverySession(launchUrl);
      if (cancelled) return;

      if (initError) {
        markFailed(initError);
      } else {
        markReady();
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return;
      if (event === 'PASSWORD_RECOVERY' && session) {
        markReady();
      }
    });

    void init();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const canSubmit =
    sessionReady &&
    !initializing &&
    password.length >= 6 &&
    password === confirmPassword;

  const handleSubmit = async () => {
    if (password.length < 6) {
      setError('Lozinka mora imati najmanje 6 karaktera');
      return;
    }
    if (password !== confirmPassword) {
      setError('Lozinke se ne poklapaju');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const { error: updateError } = await updatePassword(password);
    setLoading(false);

    if (updateError) {
      setError(translateRecoveryError(updateError));
      return;
    }

    if (Platform.OS !== 'web') {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setSuccess('Lozinka je uspešno promenjena. Preusmeravamo vas...');
    setTimeout(() => router.replace('/(tabs)'), 1200);
  };

  if (initializing) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Proveravamo link za reset...</Text>
      </View>
    );
  }

  if (!sessionReady && error && !password) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Reset lozinke nije moguć</Text>
        <Text style={styles.errorBody}>{error}</Text>
        <AuthPrimaryButton
          title="Nazad na prijavu"
          onPress={() => router.replace('/(auth)')}
          style={styles.backBtn}
        />
      </View>
    );
  }

  return (
    <AuthShell
      cardTitle="Nova lozinka"
      cardSubtitle="Unesite i potvrdite novu lozinku za nalog"
    >
      <AuthErrorBanner message={error} />

      {success ? (
        <View style={styles.successBanner}>
          <Text style={styles.successText}>{success}</Text>
        </View>
      ) : null}

      <View style={styles.form}>
        <AuthInput
          label="Nova lozinka"
          value={password}
          onChangeText={setPassword}
          secureToggle
          autoComplete="new-password"
          textContentType="newPassword"
          placeholder="Najmanje 6 karaktera"
        />
        <AuthInput
          label="Potvrdite lozinku"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureToggle
          autoComplete="new-password"
          textContentType="newPassword"
          placeholder="Ponovite lozinku"
        />

        <AuthPrimaryButton
          title="Sačuvaj novu lozinku"
          onPress={handleSubmit}
          loading={loading}
          disabled={!canSubmit}
        />
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    backgroundColor: colors.background,
    padding: 24,
  },
  loadingText: {
    fontSize: 15,
    fontFamily: fontFamily.medium,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 20,
    fontFamily: fontFamily.bold,
    color: colors.text,
    textAlign: 'center',
  },
  errorBody: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 320,
  },
  backBtn: { alignSelf: 'stretch', marginTop: 8, minWidth: 220 },
  form: { gap: 14 },
  successBanner: {
    backgroundColor: colors.accentGreenLight,
    borderRadius: 12,
    padding: 12,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(126, 217, 87, 0.35)',
  },
  successText: {
    fontSize: 14,
    fontFamily: fontFamily.medium,
    color: colors.text,
    lineHeight: 20,
  },
});
