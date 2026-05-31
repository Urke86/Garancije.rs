import { Platform } from 'react-native';
import { isSupported, recognizeText } from 'expo-mlkit-ocr';

const OCR_TIMEOUT_MS = 45_000;

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(message)), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((error) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}

function mapNativeError(error: unknown): Error {
  if (error instanceof Error) {
    const code = (error as Error & { code?: string }).code;
    if (code === 'INVALID_URI') return new Error('Slika nije validna.');
    if (code === 'IMAGE_LOAD_FAILED') return new Error('Nije moguće učitati sliku za OCR.');
    if (code === 'RECOGNITION_FAILED') return new Error('Prepoznavanje teksta nije uspelo.');
    return error;
  }
  return new Error('Prepoznavanje teksta nije uspelo.');
}

export async function recognizeReceiptText(imageUri: string): Promise<{ rawText: string }> {
  if (Platform.OS === 'web') {
    throw new Error('OCR na uređaju nije dostupan u web pregledaču. Koristite Android aplikaciju.');
  }

  if (!imageUri?.trim()) {
    throw new Error('Slika nije validna.');
  }

  if (!isSupported()) {
    throw new Error('OCR nije podržan na ovom uređaju.');
  }

  try {
    const recognition = await withTimeout(
      recognizeText(imageUri),
      OCR_TIMEOUT_MS,
      'Prepoznavanje je predugo trajalo — pokušajte ponovo sa jasnijom slikom.',
    );

    const rawText = recognition.text?.trim() ?? '';
    if (!rawText) {
      throw new Error('Tekst na računu nije prepoznat. Probajte jasniju fotografiju.');
    }

    if (__DEV__) {
      console.log('[Garancije OCR]', rawText.slice(0, 500));
    }

    return { rawText };
  } catch (error) {
    throw mapNativeError(error);
  }
}
