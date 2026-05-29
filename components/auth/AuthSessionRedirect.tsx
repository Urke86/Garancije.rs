import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { hasVerifiedEmail } from '@/lib/auth/session';

/** Ako je korisnik već ulogovan, ne prikazuj login ekran. */
export function AuthSessionRedirect() {
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && user && hasVerifiedEmail(user)) {
      router.replace('/(tabs)');
    }
  }, [user, loading]);

  return null;
}
