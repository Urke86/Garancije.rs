import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as QueryParams from 'expo-auth-session/build/QueryParams';
import { supabase } from '@/lib/supabase';

const RESET_PATH = 'auth/reset-password';

export function getPasswordResetRedirectUri(): string {
  const override = process.env.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT?.trim();
  if (override) return override;

  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.origin}/${RESET_PATH}`;
  }

  return AuthSession.makeRedirectUri({ path: RESET_PATH });
}

function parseParamsFromUrl(url: string): Record<string, string> {
  const { params, errorCode } = QueryParams.getQueryParams(url);
  const out: Record<string, string> = { ...params };

  if (errorCode) {
    out.error = errorCode;
  }

  const hashIndex = url.indexOf('#');
  if (hashIndex !== -1) {
    const hash = url.slice(hashIndex + 1);
    for (const [key, value] of new URLSearchParams(hash)) {
      if (!out[key]) out[key] = value;
    }
  }

  return out;
}

export function isPasswordRecoveryUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.includes('reset-password') ||
    lower.includes('type=recovery') ||
    lower.includes('type%3drecovery') ||
    lower.includes('token_hash=')
  );
}

function hasAuthParamsInUrl(url: string): boolean {
  return (
    url.includes('code=') ||
    url.includes('access_token=') ||
    url.includes('token_hash=') ||
    url.includes('error=') ||
    url.includes('type=recovery') ||
    url.includes('type%3drecovery')
  );
}

function cleanRecoveryUrl(): void {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    window.history.replaceState({}, '', `/${RESET_PATH}`);
  }
}

/** Mapira Supabase poruke na srpski gde ima smisla. */
export function translateRecoveryError(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes('invalid') && lower.includes('expired')) {
    return 'Link za reset lozinke nije važeći ili je istekao. Zatražite novi link sa ekrana za prijavu.';
  }
  if (lower.includes('code verifier')) {
    return 'Otvorite link u istom pregledaču gde ste zatražili reset, ili zatražite novi link.';
  }
  return message;
}

async function waitForSession(timeoutMs = 4000): Promise<boolean> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return false;
}

/** Uspostavi sesiju iz recovery linka. */
export async function completeRecoveryFromUrl(url: string): Promise<string | null> {
  const params = parseParamsFromUrl(url);

  if (params.error) {
    const desc = params.error_description ?? params.error;
    return translateRecoveryError(desc);
  }

  // Noviji Supabase email link: ?token_hash=...&type=recovery
  const tokenHash = params.token_hash;
  if (tokenHash && params.type === 'recovery') {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: 'recovery',
    });
    return error ? translateRecoveryError(error.message) : null;
  }

  // PKCE: ?code=... — samo ako detectSessionInUrl još nije završio
  const { data: { session: existing } } = await supabase.auth.getSession();
  if (existing) return null;

  const code = params.code;
  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      // detectSessionInUrl možda već potrošio code — proveri sesiju pre greške
      const recovered = await waitForSession(1500);
      if (recovered) return null;
      return translateRecoveryError(error.message);
    }
    return null;
  }

  const accessToken = params.access_token;
  const refreshToken = params.refresh_token;
  if (accessToken && refreshToken) {
    const { error } = await supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    return error ? translateRecoveryError(error.message) : null;
  }

  return null;
}

export async function establishRecoverySession(initialUrl?: string | null): Promise<string | null> {
  const href =
    initialUrl ??
    (Platform.OS === 'web' && typeof window !== 'undefined' ? window.location.href : null);

  // Web: detectSessionInUrl na supabase klijentu može završiti pre našeg koda
  if (Platform.OS === 'web') {
    await new Promise((resolve) => setTimeout(resolve, 50));
    if (await waitForSession(500)) {
      if (href && hasAuthParamsInUrl(href)) cleanRecoveryUrl();
      return null;
    }
  }

  if (href && hasAuthParamsInUrl(href)) {
    const error = await completeRecoveryFromUrl(href);
    if (error) return error;
    cleanRecoveryUrl();
  }

  if (await waitForSession(2000)) {
    return null;
  }

  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  if (sessionError) return translateRecoveryError(sessionError.message);
  if (!session) {
    return 'Link za reset lozinke nije važeći ili je istekao. Zatražite novi link sa ekrana za prijavu.';
  }

  return null;
}
