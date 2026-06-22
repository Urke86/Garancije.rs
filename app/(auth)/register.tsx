import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/contexts/AuthContext';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { LegalLinks } from '@/components/ui/LegalLinks';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';

export default function RegisterScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  const { signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [pendingEmail, setPendingEmail] = useState(false);

  const canSubmit =
    email.trim().length > 0 &&
    password.length >= 6 &&
    password === confirmPassword;

  const handleRegister = async () => {
    if (!email.trim() || !password) {
      setError(t('auth.fillAllFields'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('auth.passwordsMismatch'));
      return;
    }
    if (password.length < 6) {
      setError(t('auth.passwordMinLength'));
      return;
    }
    setLoading(true);
    setError('');
    const { error: err, needsEmailConfirmation } = await signUp(email.trim(), password);
    if (err) {
      setError(err);
    } else if (needsEmailConfirmation) {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      setPendingEmail(true);
    } else {
      if (Platform.OS !== 'web') {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.replace('/(tabs)');
    }
    setLoading(false);
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    const { error: err } = await signInWithGoogle();
    if (err) {
      setError(err);
    } else {
      router.replace('/(tabs)');
    }
    setGoogleLoading(false);
  };

  if (pendingEmail) {
    return (
      <AuthShell
        cardTitle={t('auth.checkEmail')}
        cardSubtitle={t('auth.checkEmailSubtitle')}
        showBack
      >
        <Text style={styles.pendingText}>
          {t('auth.checkEmailBody', { email: email.trim() })}
        </Text>
        <AuthPrimaryButton title={t('auth.goToLogin')} onPress={() => router.replace('/(auth)')} />
      </AuthShell>
    );
  }

  return (
    <AuthShell
      cardTitle={t('auth.createAccount')}
      cardSubtitle={t('auth.registerSubtitle')}
      showBack
    >
      <GoogleSignInButton onPress={handleGoogle} loading={googleLoading} label={t('auth.registerGoogle')} />

      <AuthDivider />

      <AuthErrorBanner message={error} />

      <View style={styles.form}>
        <AuthInput
          label={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          placeholder={t('auth.emailPlaceholder')}
        />
        <AuthInput
          label={t('auth.password')}
          value={password}
          onChangeText={setPassword}
          secureToggle
          autoComplete="new-password"
          textContentType="newPassword"
          placeholder={t('auth.passwordMinPlaceholder')}
        />
        <AuthInput
          label={t('auth.confirmPassword')}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureToggle
          autoComplete="new-password"
          textContentType="newPassword"
          placeholder={t('auth.repeatPassword')}
        />

        <AuthPrimaryButton
          title={t('auth.registerButton')}
          onPress={handleRegister}
          loading={loading}
          disabled={!canSubmit}
        />

        <LegalLinks variant="consent" />
      </View>

      <TouchableOpacity onPress={() => router.back()} style={styles.linkRow}>
        <Text style={styles.linkMuted}>{t('auth.haveAccount')} </Text>
        <Text style={styles.link}>{t('auth.signInLink')}</Text>
      </TouchableOpacity>
    </AuthShell>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  pendingText: {
    fontSize: 15,
    fontFamily: 'PlusJakartaSans-Regular',
    color: colors.textSecondary,
    lineHeight: 24,
    marginBottom: 24,
  },
  form: { gap: 14 },
  linkRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
    paddingBottom: 8,
  },
  linkMuted: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-Regular',
    color: colors.textSecondary,
  },
  link: {
    fontSize: 14,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: colors.accentGreen,
  },
});
