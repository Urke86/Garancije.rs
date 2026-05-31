export type {
  OcrConfidence,
  OcrDetectableField,
  OcrReceiptItem,
  OcrReceiptResult,
  RunReceiptOcrOutput,
} from '@/lib/ocr/types';

export {
  emptyOcrResult,
  hasRecognizedFields,
  runReceiptOcrFromUri,
} from '@/lib/ocr/receipt-parser';

export { mapOcrToForm } from '@/lib/ocr/map-ocr-to-form';

/** @deprecated Cloud OCR removed — kept for image preprocessing helpers only. */
export function normalizeBase64Image(input: string): string {
  const trimmed = input.trim();
  const comma = trimmed.indexOf(',');
  if (trimmed.startsWith('data:') && comma !== -1) {
    return trimmed.slice(comma + 1);
  }
  return trimmed;
}
