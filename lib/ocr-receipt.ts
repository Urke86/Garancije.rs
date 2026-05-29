import { FunctionsHttpError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

export interface OcrReceiptItem {
  name: string;
  price: number;
  category: string;
}

export interface OcrReceiptResult {
  store_name: string;
  purchase_date: string;
  total_amount: string;
  pib: string;
  receipt_number: string;
  items: OcrReceiptItem[];
  raw_text: string;
}

type OcrInvokeResponse = OcrReceiptResult & { error?: string };

export function emptyOcrResult(): OcrReceiptResult {
  return {
    store_name: '',
    purchase_date: new Date().toISOString().split('T')[0],
    total_amount: '',
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

function mapOcrErrorMessage(raw: string): string {
  const lower = raw.toLowerCase();
  if (lower.includes('nije konfigurisan') || lower.includes('google_vision')) {
    return 'OCR servis privremeno nije dostupan. Unesite podatke ručno.';
  }
  if (lower.includes('quota') || lower.includes('rate limit') || lower.includes('429')) {
    return 'Previše OCR zahteva — sačekajte minut i pokušajte ponovo.';
  }
  if (lower.includes('nije prepoznat') || lower.includes('no text') || lower.includes('čitljiv')) {
    return 'Tekst na računu nije dovoljno čitljiv. Slikajte ceo račun, ravno, uz dobro svetlo.';
  }
  if (lower.includes('unauthorized') || lower.includes('401')) {
    return 'Sesija je istekla. Odjavite se i prijavite ponovo.';
  }
  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'Prepoznavanje je predugo trajalo. Pokušajte ponovo sa jasnijom slikom.';
  }
  return raw;
}

async function readFunctionErrorBody(error: FunctionsHttpError): Promise<string | null> {
  try {
    const response = error.context;
    if (response && typeof response.json === 'function') {
      const body = (await response.json()) as { error?: string };
      if (body?.error) return mapOcrErrorMessage(String(body.error));
    }
  } catch {
    /* ignore parse errors */
  }
  return null;
}

function normalizeInvokePayload(data: unknown): { result: OcrReceiptResult; error: string | null } {
  if (!data || typeof data !== 'object') {
    return { result: emptyOcrResult(), error: 'OCR nije vratio podatke.' };
  }

  const payload = data as OcrInvokeResponse;
  const serverError = payload.error ? mapOcrErrorMessage(String(payload.error)) : null;

  const result: OcrReceiptResult = {
    store_name: payload.store_name ?? '',
    purchase_date: payload.purchase_date ?? emptyOcrResult().purchase_date,
    total_amount: payload.total_amount ?? '',
    pib: payload.pib ?? '',
    receipt_number: payload.receipt_number ?? '',
    items: Array.isArray(payload.items) ? payload.items : [],
    raw_text: payload.raw_text ?? '',
  };

  return { result, error: serverError };
}

/** Uklanja data-URL prefiks ako postoji. */
export function normalizeBase64Image(input: string): string {
  const trimmed = input.trim();
  const comma = trimmed.indexOf(',');
  if (trimmed.startsWith('data:') && comma !== -1) {
    return trimmed.slice(comma + 1);
  }
  return trimmed;
}

export async function invokeReceiptOcr(
  imageBase64: string,
): Promise<{ data: OcrReceiptResult | null; error: string | null }> {
  const normalized = normalizeBase64Image(imageBase64);
  if (!normalized || normalized.length < 100) {
    return { data: null, error: 'Slika nije validna ili je previše mala.' };
  }

  const { data, error } = await supabase.functions.invoke('ocr-receipt', {
    body: { image_base64: normalized },
  });

  if (error) {
    if (error instanceof FunctionsHttpError) {
      const bodyMessage = await readFunctionErrorBody(error);
      if (bodyMessage) {
        return { data: null, error: bodyMessage };
      }
    }
    return {
      data: null,
      error: mapOcrErrorMessage(error.message || 'OCR nije uspeo'),
    };
  }

  const { result, error: serverError } = normalizeInvokePayload(data);
  return { data: result, error: serverError };
}
