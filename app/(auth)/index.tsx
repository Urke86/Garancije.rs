import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, Platform } from 'react-native';
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

export default function LoginScreen() {
  const { signIn, signInWithGoogle, resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

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
      Alert.alert(
        'Reset lozinke',
        'Unesite email adresu u polje iznad, pa ponovo dodirnite „Zaboravili ste lozinku?“',
      );
      return;
    }
    Alert.alert('Reset lozinke', `Poslati link na ${email.trim()}?`, [
      { text: 'Otkaži', style: 'cancel' },
      {
        text: 'Pošalji',
        onPress: async () => {
          const { error: err } = await resetPassword(email);
          if (err) {
            Alert.alert('Greška', err);
          } else {
            Alert.alert('Poslato', 'Proverite email za link za reset lozinke.');
          }
        },
      },
    ]);
  };

  return (
    <AuthShell cardTitle="Dobrodošli nazad" cardSubtitle="Prijavite se na svoj nalog">
      <GoogleSignInButton onPress={handleGoogle} loading={googleLoading} />

      <AuthDivider />

      <AuthErrorBanner message={error} />

      <View style={styles.form}>
        <AuthInput
          label="Email"
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

        <TouchableOpacity onPress={handleForgotPassword} style={styles.forgotWrap}>
          <Text style={styles.forgot}>Zaboravili ste lozinku?</Text>
        </TouchableOpacity>

        <AuthPrimaryButton
          title="Prijavi se"
          onPress={handleLogin}
          loading={loading}
          disabled={!canSubmit}
        />
      </View>

      <TouchableOpacity onPress={() => router.push('/(auth)/register')} style={styles.linkRow}>
        <Text style={styles.linkMuted}>Nemate nalog? </Text>
        <Text style={styles.link}>Registrujte se</Text>
      </TouchableOpacity>
    </AuthShell>
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
