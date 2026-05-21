import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAuth } from '@/contexts/AuthContext';
import { colors } from '@/lib/colors';
import { AuthShell } from '@/components/auth/AuthShell';
import { AuthInput } from '@/components/auth/AuthInput';
import { AuthPrimaryButton } from '@/components/auth/AuthPrimaryButton';
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton';
import { AuthDivider } from '@/components/auth/AuthDivider';
import { AuthErrorBanner } from '@/components/auth/AuthErrorBanner';
import { LegalLinks } from '@/components/ui/LegalLinks';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

type ResetDialog = 'closed' | 'need_email' | 'confirm' | 'success' | 'error';

export default function LoginScreen() {
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
      setError('Unesite email i lozinku (min. 6 karaktera)');
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
    if (err) setError(err);
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
    <AuthShell cardTitle="Dobrodošli nazad" cardSubtitle="Prijavite se na svoj nalog">
      <GoogleSignInButton onPress={handleGoogle} loading={googleLoading} />

      <AuthDivider />

      <AuthErrorBanner message={error} />

      <View style={styles.form}>
        <AuthInput
          label="E-pošta"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
          textContentType="emailAddress"
          placeholder="vas@email.com"
        />
        <AuthInput
          label="Lozinka"
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
          accessibilityLabel="Zaboravili ste lozinku"
        >
          <Text style={styles.forgot}>Zaboravili ste lozinku?</Text>
        </TouchableOpacity>

        <AuthPrimaryButton
          title="Prijavi se"
          onPress={handleLogin}
          loading={loading}
          disabled={!canSubmit}
        />
      </View>

      <TouchableOpacity
        onPress={() => router.push('/(auth)/register')}
        style={styles.linkRow}
        accessibilityRole="button"
        accessibilityLabel="Registrujte se"
      >
        <Text style={styles.linkMuted}>Nemate nalog? </Text>
        <Text style={styles.link}>Registrujte se</Text>
      </TouchableOpacity>

      <LegalLinks variant="consent" consentIntro="Korišćenjem aplikacije prihvatate" />
    </AuthShell>

    <ConfirmModal
      visible={resetDialog === 'need_email'}
      title="Reset lozinke"
      message="Unesite adresu e-pošte u polje iznad, pa ponovo dodirnite „Zaboravili ste lozinku?“"
      confirmLabel="U redu"
      alertOnly
      onConfirm={() => setResetDialog('closed')}
      onCancel={() => setResetDialog('closed')}
    />

    <ConfirmModal
      visible={resetDialog === 'confirm'}
      title="Reset lozinke"
      message={`Poslati link za reset lozinke na ${email.trim()}?`}
      confirmLabel="Pošalji"
      cancelLabel="Otkaži"
      loading={resetSending}
      onConfirm={sendResetEmail}
      onCancel={() => setResetDialog('closed')}
    />

    <ConfirmModal
      visible={resetDialog === 'success'}
      title="Poslato"
      message="Proverite email za link za reset lozinke. Link vodi na ekran za unos nove lozinke."
      confirmLabel="U redu"
      alertOnly
      onConfirm={() => setResetDialog('closed')}
      onCancel={() => setResetDialog('closed')}
    />

    <ConfirmModal
      visible={resetDialog === 'error'}
      title="Greška"
      message={resetMessage}
      confirmLabel="U redu"
      alertOnly
      onConfirm={() => setResetDialog('closed')}
      onCancel={() => setResetDialog('closed')}
    />
    </>
  );
}

const styles = StyleSheet.create({
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
