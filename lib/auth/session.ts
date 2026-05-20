import type { User } from '@supabase/supabase-js';

/** OAuth providers (e.g. Google) are treated as verified at sign-in. */
export function hasVerifiedEmail(user: User | null): boolean {
  if (!user) return false;
  const provider = user.app_metadata?.provider as string | undefined;
  if (provider === 'google') return true;
  return Boolean(user.email_confirmed_at);
}
