import { Stack } from 'expo-router';
import { AuthSessionRedirect } from '@/components/auth/AuthSessionRedirect';

export default function AuthLayout() {
  return (
    <>
      <AuthSessionRedirect />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="register" />
      </Stack>
    </>
  );
}
