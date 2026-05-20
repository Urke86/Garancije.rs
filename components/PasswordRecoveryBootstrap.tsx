import { useEffect } from 'react';
import { Linking, Platform } from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { completeRecoveryFromUrl, isPasswordRecoveryUrl } from '@/lib/auth/password-reset';

export function PasswordRecoveryBootstrap() {
  useEffect(() => {
    let active = true;

    const goToReset = () => {
      if (!active) return;
      router.replace('/auth/reset-password');
    };

    const handleUrl = async (url: string) => {
      if (!isPasswordRecoveryUrl(url)) return;
      const error = await completeRecoveryFromUrl(url);
      if (!active) return;
      if (!error) goToReset();
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        goToReset();
      }
    });

    if (Platform.OS !== 'web') {
      Linking.getInitialURL().then((url) => {
        if (url) void handleUrl(url);
      });

      const linkSub = Linking.addEventListener('url', ({ url }) => {
        void handleUrl(url);
      });

      return () => {
        active = false;
        subscription.unsubscribe();
        linkSub.remove();
      };
    }

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return null;
}
