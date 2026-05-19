import { supabase } from '@/lib/supabase';

/** Izvlači putanju u bucketu iz sačuvane vrednosti (path ili stari public URL). */
export function getReceiptStoragePath(stored: string | null | undefined): string | null {
  if (!stored?.trim()) return null;
  const value = stored.trim();
  if (!value.includes('://')) return value;

  const match = value.match(/\/receipt-images\/(.+?)(?:\?|$)/);
  return match?.[1] ?? null;
}

/** Privatni bucket — učitava privremeni signed URL za prikaz slike. */
export async function resolveReceiptImageUri(
  stored: string | null | undefined,
): Promise<string | null> {
  const path = getReceiptStoragePath(stored);
  if (!path) return null;

  const { data, error } = await supabase.storage
    .from('receipt-images')
    .createSignedUrl(path, 60 * 60);

  if (error || !data?.signedUrl) return null;
  return data.signedUrl;
}
