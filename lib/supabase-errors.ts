/** Returns the first non-empty Supabase/PostgREST error message. */
export function getSupabaseErrorMessage(
  ...errors: Array<{ message?: string } | null | undefined>
): string | null {
  for (const e of errors) {
    if (e?.message) return e.message;
  }
  return null;
}
