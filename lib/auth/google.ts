import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from '@/lib/supabase';

WebBrowser.maybeCompleteAuthSession();

const CALLBACK_PATH = 'auth/callback';

export function getGoogleRedirectUri(): string {
  const override = process.env.EXPO_PUBLIC_OAUTH_REDIRECT_URI?.trim();
  if (override) return override;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/auth/callback`;
  }

  return AuthSession.makeRedirectUri({ path: CALLBACK_PATH });
}

function parseOAuthParams(url: string): Record<string, string> {
  const { params } = QueryParams.getQueryParams(url);
  const out: Record<string, string> = { ...params };
  if (!out.code && !out.error) {
    const codeM = /[?&#]code=([^&#]+)/.exec(url);
    if (codeM) out.code = decodeURIComponent(codeM[1]);
    const errM = /[?&#]error=([^&#]+)/.exec(url);
    if (errM) out.error = decodeURIComponent(errM[1]);
    const descM = /[?&#]error_description=([^&#]+)/.exec(url);
    if (descM) out.error_description = decodeURIComponent(descM[1].replace(/\+/g, ' '));
  }
  return out;
}

async function completeOAuthFromUrl(callbackUrl: string): Promise<string | null> {
  const params = parseOAuthParams(callbackUrl);
  if (params.error) {
    return typeof params.error_description === 'string'
      ? params.error_description
      : params.error;
  }

  const code = params.code;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    return error?.message ?? null;
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    return error?.message ?? null;
  }

  return 'Google prijava nije vratila sesiju. Proverite Redirect URL u Supabase.';
}

export async function signInWithGoogle(): Promise<{ error: string | null }> {
  const redirectTo = getGoogleRedirectUri();

  if (__DEV__) {
    console.log('[Google OAuth] redirectTo:', redirectTo);
  }

  if (Platform.OS === 'web') {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    return { error: error?.message ?? null };
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo, skipBrowserRedirect: true },
  });

  if (error) return { error: error.message };
  if (!data?.url) return { error: 'Google URL nije dostupan.' };

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !('url' in result) || !result.url) {
    return {
      error:
        result.type === 'cancel'
          ? 'Google prijava je otkazana.'
          : `Prijava nije uspela. U Supabase dodajte Redirect URL: ${redirectTo}`,
    };
  }

  return { error: await completeOAuthFromUrl(result.url) };
}

function getOAuthErrorFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const err = search.get('error') || hash.get('error');
  if (!err) return null;
  return search.get('error_description') || hash.get('error_description') || err;
}

/** Web callback: rely on detectSessionInUrl + PKCE verifier in localStorage. */
export async function handleWebOAuthCallback(): Promise<{ error: string | null }> {
  if (Platform.OS !== 'web' || typeof window === 'undefined') {
    return { error: null };
  }

  const urlError = getOAuthErrorFromUrl();
  if (urlError) return { error: urlError };

  const hasCode =
    window.location.search.includes('code=') || window.location.hash.includes('code=');

  if (!hasCode) {
    return { error: null };
  }

  // detectSessionInUrl runs on auth init; give it a tick to finish exchange
  await new Promise((r) => setTimeout(r, 0));

  const { data: { session }, error } = await supabase.auth.getSession();
  if (error) return { error: error.message };
  if (session) {
    window.history.replaceState({}, '', '/auth/callback');
    return { error: null };
  }

  // Fallback: exchange with code only (verifier must be in localStorage)
  const search = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const code = search.get('code') || hash.get('code');
  if (!code) {
    return { error: 'Nedostaje autorizacioni kod.' };
  }

  const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
  if (exchangeError) return { error: exchangeError.message };

  window.history.replaceState({}, '', '/auth/callback');
  return { error: null };
}
