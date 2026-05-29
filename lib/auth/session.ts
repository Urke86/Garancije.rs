import type { User } from '@supabase/supabase-js';

function hasGoogleIdentity(user: User): boolean {
  const provider = user.app_metadata?.provider as string | undefined;
  if (provider === 'google') return true;

  const providers = user.app_metadata?.providers as string[] | undefined;
  if (providers?.includes('google')) return true;

  return user.identities?.some((identity) => identity.provider === 'google') ?? false;
}

/** OAuth providers (e.g. Google) are treated as verified at sign-in. */
export function hasVerifiedEmail(user: User | null): boolean {
  if (!user) return false;
  if (hasGoogleIdentity(user)) return true;
  return Boolean(user.email_confirmed_at);
}
