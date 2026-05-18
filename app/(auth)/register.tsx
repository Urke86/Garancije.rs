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

export default function RegisterScreen() {
  const { signUp, signInWithGoogle } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const canSubmit =
    email.trim().length > 0 &&
    password.length >= 6 &&
    password === confirmPassword;

  const handleRegister = async () => {
    if (!email.trim() || !password) {
      setError('Popunite sva polja');
      return;
    }
    if (password !== confirmPassword) {
      setError('Lozinke se ne poklapaju');
      return;
    }
    if (password.length < 6) {
      setError('Lozinka mora imati najmanje 6 karaktera');
      return;
    }
    setLoading(true);
    setError('');
    const { error: err } = await signUp(email.trim(), password);
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

  return (
    <AuthShell
      cardTitle="Kreirajte nalog"
      cardSubtitle="Besplatno čuvajte račune i garancije"
      showBack
    >
      <GoogleSignInButton onPress={handleGoogle} loading={googleLoading} label="Registruj se sa Google" />

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
          autoComplete="new-password"
          textContentType="newPassword"
          placeholder="Min. 6 karaktera"
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
          title="Registruj se"
          onPress={handleRegister}
          loading={loading}
          disabled={!canSubmit}
        />
      </View>

      <TouchableOpacity onPress={() => router.back()} style={styles.linkRow}>
        <Text style={styles.linkMuted}>Već imate nalog? </Text>
        <Text style={styles.link}>Prijavite se</Text>
      </TouchableOpacity>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
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
