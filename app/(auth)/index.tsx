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
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { AppColors } from '@/lib/theme';

type ResetDialog = 'closed' | 'need_email' | 'confirm' | 'success' | 'error';

export default function LoginScreen() {
  const { t } = useTranslation();
  const styles = useThemedStyles(createStyles);

  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [resetDialog, setResetDialog] = useState<ResetDialog>('closed');
  const [resetSending, setResetSending] = useState(false);
  const [resetMessage, setResetMessage] = useState('');

  const canSubmit = email.trim().length > 0 && password.length >= 6;

  const handleLogin = async () => {
    if (!canSubmit) {
      setError(t('auth.loginError'));
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await signIn(email.trim(), password);
    if (err) {
      setError(err);
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

  const handleForgotPassword = () => {
    if (!email.trim()) {
      setResetDialog('need_email');
      return;
    }
    setResetDialog('confirm');
  };

  const sendResetEmail = async () => {
    setResetSending(true);
    const { error: err } = await resetPassword(email);
    setResetSending(false);

    if (err) {
      setResetMessage(err);
      setResetDialog('error');
      return;
    }

    setResetDialog('success');
  };

  return (
    <>
    <AuthShell cardTitle={t('auth.welcomeBack')} cardSubtitle={t('auth.loginSubtitle')}>
      <GoogleSignInButton onPress={handleGoogle} loading={googleLoading} />

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
          autoComplete="password"
          textContentType="password"
          placeholder="••••••••"
        />

        <TouchableOpacity
          onPress={handleForgotPassword}
          style={styles.forgotWrap}
          accessibilityRole="button"
          accessibilityLabel={t('auth.forgotPassword_a11y')}
        >
          <Text style={styles.forgot}>{t('auth.forgotPassword')}</Text>
        </TouchableOpacity>

        <AuthPrimaryButton
          title={t('auth.signIn')}
          onPress={handleLogin}
          loading={loading}
          disabled={!canSubmit}
        />
      </View>

      <TouchableOpacity
        onPress={() => router.push('/(auth)/register')}
        style={styles.linkRow}
        accessibilityRole="button"
        accessibilityLabel={t('auth.register_a11y')}
      >
        <Text style={styles.linkMuted}>{t('auth.noAccount')} </Text>
        <Text style={styles.link}>{t('auth.register')}</Text>
      </TouchableOpacity>

      <LegalLinks variant="consent" consentIntro={t('legal.consentIntroLogin')} />
    </AuthShell>

    <ConfirmModal
      visible={resetDialog === 'need_email'}
      title={t('auth.resetTitle')}
      message={t('auth.resetNeedEmail')}
      confirmLabel={t('common.ok')}
      alertOnly
      onConfirm={() => setResetDialog('closed')}
      onCancel={() => setResetDialog('closed')}
    />

    <ConfirmModal
      visible={resetDialog === 'confirm'}
      title={t('auth.resetTitle')}
      message={t('auth.resetConfirm', { email: email.trim() })}
      confirmLabel={t('common.send')}
      cancelLabel={t('common.cancel')}
      loading={resetSending}
      onConfirm={sendResetEmail}
      onCancel={() => setResetDialog('closed')}
    />

    <ConfirmModal
      visible={resetDialog === 'success'}
      title={t('auth.resetSentTitle')}
      message={t('auth.resetSentMessage')}
      confirmLabel={t('common.ok')}
      alertOnly
      onConfirm={() => setResetDialog('closed')}
      onCancel={() => setResetDialog('closed')}
    />

    <ConfirmModal
      visible={resetDialog === 'error'}
      title={t('common.error')}
      message={resetMessage}
      confirmLabel={t('common.ok')}
      alertOnly
      onConfirm={() => setResetDialog('closed')}
      onCancel={() => setResetDialog('closed')}
    />
    </>
  );
}

const createStyles = (colors: AppColors) => StyleSheet.create({
  form: { gap: 14 },
  forgotWrap: { alignSelf: 'flex-end', marginTop: -4, marginBottom: 4 },
  forgot: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-Medium',
    color: colors.accent,
  },
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
