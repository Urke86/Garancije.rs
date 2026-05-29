import { Image } from 'react-native';
import * as ImageManipulator from 'expo-image-manipulator';
import { normalizeBase64Image } from '@/lib/ocr-receipt';

const MAX_DIMENSION = 2048;

function getImageSize(uri: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (err) => reject(err),
    );
  });
}

/** Smanjuje i kompresuje sliku pre OCR-a; ispravlja EXIF orientaciju. */
export async function prepareImageForOcr(
  uri: string,
  existingBase64?: string | null,
): Promise<{ uri: string; base64: string }> {
  let actions: ImageManipulator.Action[] = [];

  try {
    const { width, height } = await getImageSize(uri);
    const maxDim = Math.max(width, height);
    if (maxDim > MAX_DIMENSION) {
      const scale = MAX_DIMENSION / maxDim;
      actions = [
        {
          resize: {
            width: Math.round(width * scale),
            height: Math.round(height * scale),
          },
        },
      ];
    }
  } catch {
    actions = [{ resize: { width: MAX_DIMENSION } }];
  }

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: 0.85,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });

  const base64 = normalizeBase64Image(result.base64 ?? existingBase64 ?? '');
  if (!base64) {
    throw new Error('Nije moguće pripremiti sliku za OCR');
  }

  return { uri: result.uri, base64 };
}
