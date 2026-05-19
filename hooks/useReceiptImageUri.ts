import { useEffect, useState } from 'react';
import { resolveReceiptImageUri } from '@/lib/receipt-image';

export function useReceiptImageUri(stored: string | null | undefined) {
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(Boolean(stored?.trim()));

  useEffect(() => {
    let cancelled = false;

    if (!stored?.trim()) {
      setUri(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    resolveReceiptImageUri(stored).then((resolved) => {
      if (!cancelled) {
        setUri(resolved);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [stored]);

  return { uri, loading };
}
