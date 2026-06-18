import { Platform } from 'react-native';
import { supabase } from '@/lib/supabase';
import { prepareImageForOcr } from '@/lib/ocr-image-preprocess';

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/** Otpremi lokalnu sliku računa u Storage; vraća putanju u bucketu. */
export async function uploadReceiptImageFromUri(
  userId: string,
  localUri: string,
): Promise<{ path: string | null; error: string | null }> {
  if (!localUri.trim()) {
    return { path: null, error: 'Nedostaje slika računa' };
  }

  try {
    let bytes: Uint8Array;

    if (Platform.OS === 'web') {
      const res = await fetch(localUri);
      const buffer = await res.arrayBuffer();
      bytes = new Uint8Array(buffer);
    } else {
      const prepared = await prepareImageForOcr(localUri);
      bytes = decodeBase64(prepared.base64);
    }

    const fileName = `${userId}/${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('receipt-images')
      .upload(fileName, bytes, { contentType: 'image/jpeg' });

    if (uploadError) {
      return { path: null, error: 'Greška pri otpremanju slike: ' + uploadError.message };
    }

    return { path: fileName, error: null };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Nepoznata greška';
    return { path: null, error: 'Greška pri otpremanju slike: ' + message };
  }
}

export function isLocalImageUri(value: string | null | undefined): boolean {
  if (!value?.trim()) return false;
  return value.startsWith('file://') || value.startsWith('content://') || value.startsWith('blob:');
}
