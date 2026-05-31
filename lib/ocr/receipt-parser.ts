import type {
  OcrDetectableField,
  OcrReceiptResult,
  ParseReceiptOutput,
  RunReceiptOcrOutput,
} from '@/lib/ocr/types';
import { parseSerbianReceipt } from '@/lib/ocr/parse-serbian-receipt';
import { recognizeReceiptText } from '@/lib/ocr/ocr-service';

export function buildOcrWarning(
  detectedFields: OcrDetectableField[],
  partial: boolean,
  error: string | null,
): string | null {
  if (error) return error;
  if (detectedFields.length === 0) {
    return 'Tekst na računu nije prepoznat. Proverite osvetljenje i pokušajte ponovo, ili unesite podatke ručno.';
  }
  if (partial) {
    return 'Delimično prepoznato — proverite prodavnicu, datum, iznos i stavke pre čuvanja.';
  }
  return null;
}

export async function runReceiptOcrFromUri(imageUri: string): Promise<RunReceiptOcrOutput> {
  try {
    const { rawText } = await recognizeReceiptText(imageUri);
    const parsed: ParseReceiptOutput = parseSerbianReceipt(rawText);
    const error = buildOcrWarning(parsed.detectedFields, parsed.partial, null);

    return {
      data: parsed.result,
      error,
      detectedFields: parsed.detectedFields,
      partial: parsed.partial,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'OCR nije uspeo';
    return {
      data: emptyOcrResult(),
      error: message,
      detectedFields: [],
      partial: false,
    };
  }
}

export function emptyOcrResult(): OcrReceiptResult {
  return {
    store_name: '',
    purchase_date: new Date().toISOString().split('T')[0],
    total_amount: '',
    currency: 'RSD',
    pib: '',
    receipt_number: '',
    items: [],
    raw_text: '',
  };
}

export function hasRecognizedFields(result: OcrReceiptResult): boolean {
  return Boolean(
    result.store_name ||
      result.pib ||
      result.receipt_number ||
      result.total_amount ||
      result.items.length > 0,
  );
}
