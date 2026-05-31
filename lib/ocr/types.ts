export type OcrConfidence = 'high' | 'medium' | 'low';

export type OcrDetectableField =
  | 'store_name'
  | 'purchase_date'
  | 'total_amount'
  | 'currency'
  | 'pib'
  | 'receipt_number'
  | 'product_name';

export interface OcrReceiptItem {
  name: string;
  price: number;
  category: string;
}

export interface OcrReceiptResult {
  store_name: string;
  purchase_date: string;
  total_amount: string;
  currency: string;
  pib: string;
  receipt_number: string;
  items: OcrReceiptItem[];
  raw_text: string;
}

export interface ParsedField<T> {
  value: T;
  confidence: OcrConfidence | 'none';
}

export interface ParsedReceiptFields {
  store_name: ParsedField<string>;
  purchase_date: ParsedField<string>;
  total_amount: ParsedField<string>;
  currency: ParsedField<string>;
  pib: ParsedField<string>;
  receipt_number: ParsedField<string>;
  items: ParsedField<OcrReceiptItem[]>;
}

export interface ParseReceiptOutput {
  result: OcrReceiptResult;
  detectedFields: OcrDetectableField[];
  partial: boolean;
}

export interface RunReceiptOcrOutput {
  data: OcrReceiptResult;
  error: string | null;
  detectedFields: OcrDetectableField[];
  partial: boolean;
}
