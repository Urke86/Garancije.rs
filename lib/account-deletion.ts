import { supabase } from '@/lib/supabase';

export async function deleteAccount(): Promise<{ error: string | null }> {
  const { data, error } = await supabase.functions.invoke('delete-account', {
    method: 'POST',
    body: {},
  });

  if (error) {
    return { error: error.message ?? 'Brisanje naloga nije uspelo.' };
  }

  const payload = data as { error?: string; success?: boolean } | null;
  if (payload?.error) {
    return { error: payload.error };
  }

  if (!payload?.success) {
    return { error: 'Brisanje naloga nije uspelo.' };
  }

  return { error: null };
}
