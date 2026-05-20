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

export async function invokeReceiptOcr(
  imageBase64: string,
): Promise<{ data: OcrReceiptResult | null; error: string | null }> {
  const { data, error } = await supabase.functions.invoke('ocr-receipt', {
    body: { image_base64: imageBase64 },
  });

  if (error) {
    return { data: null, error: error.message || 'OCR nije uspeo' };
  }

  if (data?.error) {
    return { data: null, error: String(data.error) };
  }

  return { data: data as OcrReceiptResult, error: null };
}
