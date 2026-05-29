import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { normalizeBase64Image } from '@/lib/ocr-receipt';
import { getReceiptStoragePath, resolveReceiptImageUri } from '@/lib/receipt-image';

/** Učitava sliku računa iz Storage-a kao base64 (za ponovni OCR). */
export async function loadReceiptImageBase64(
  storedPath: string | null | undefined,
): Promise<string | null> {
  const path = getReceiptStoragePath(storedPath);
  if (!path) return null;

  const signedUrl = await resolveReceiptImageUri(path);
  if (!signedUrl) return null;

  if (Platform.OS === 'web') {
    const res = await fetch(signedUrl);
    const blob = await res.blob();
    const buffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return normalizeBase64Image(btoa(binary));
  }

  const cachePath = `${FileSystem.cacheDirectory}ocr-${Date.now()}.jpg`;
  const download = await FileSystem.downloadAsync(signedUrl, cachePath);
  if (download.status !== 200) return null;

  const base64 = await FileSystem.readAsStringAsync(download.uri, {
    encoding: 'base64',
  });
  try {
    await FileSystem.deleteAsync(download.uri, { idempotent: true });
  } catch {
    /* ignore */
  }
  return normalizeBase64Image(base64);
}
