import type { User } from '@supabase/supabase-js';

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Dobro jutro';
  if (hour < 18) return 'Dobar dan';
  return 'Dobro veče';
}

export function getGreetingName(user: User | null | undefined): string {
  if (!user) return '';
  const meta = user.user_metadata as { full_name?: string } | undefined;
  if (meta?.full_name?.trim()) {
    return meta.full_name.trim().split(/\s+/)[0];
  }
  if (user.email) {
    const local = user.email.split('@')[0];
    return local.charAt(0).toUpperCase() + local.slice(1);
  }
  return '';
}

export function getUserInitials(user: User | null | undefined): string {
  const name = getGreetingName(user);
  if (name.length >= 2) return name.slice(0, 2).toUpperCase();
  if (name.length === 1) return name.toUpperCase();
  return '?';
}
