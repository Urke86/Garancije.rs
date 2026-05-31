import AsyncStorage from '@react-native-async-storage/async-storage';
import type { OcrReceiptResult, OcrDetectableField } from '@/lib/ocr-receipt';

const PREFIX = 'pending-ocr:';

export type PendingOcrPayload = {
  result: OcrReceiptResult;
  warning: string | null;
  detectedFields: OcrDetectableField[];
};

export async function savePendingOcr(payload: PendingOcrPayload): Promise<string> {
  const key = `${PREFIX}${Date.now()}`;
  await AsyncStorage.setItem(key, JSON.stringify(payload));
  return key;
}

export async function loadPendingOcr(key: string): Promise<PendingOcrPayload | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingOcrPayload;
  } catch {
    return null;
  }
}

export async function clearPendingOcr(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}
