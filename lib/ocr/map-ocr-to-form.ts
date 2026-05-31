import { getDefaultWarrantyMonths } from '@/lib/warranty';
import type { ReceiptItemInput } from '@/lib/receipt-persistence';
import type { ReceiptFormState } from '@/components/receipt/ReceiptEditForm';
import type { OcrDetectableField, OcrReceiptResult } from '@/lib/ocr/types';

export function mapOcrToForm(
  ocrData: OcrReceiptResult,
  detectedFields: OcrDetectableField[],
): {
  form: ReceiptFormState;
  items: ReceiptItemInput[];
  detected: OcrDetectableField[];
} {
  const detected = new Set(detectedFields);
  const form: ReceiptFormState = {
    store_name: detected.has('store_name') ? ocrData.store_name : '',
    purchase_date: detected.has('purchase_date')
      ? ocrData.purchase_date
      : new Date().toISOString().split('T')[0],
    total_amount: detected.has('total_amount') ? ocrData.total_amount : '',
    currency: detected.has('currency') ? ocrData.currency || 'RSD' : 'RSD',
    pib: detected.has('pib') ? ocrData.pib : '',
    receipt_number: detected.has('receipt_number') ? ocrData.receipt_number : '',
  };

  const items: ReceiptItemInput[] =
    detected.has('product_name') && ocrData.items.length > 0
      ? ocrData.items.map((item) => ({
          name: item.name || '',
          category: item.category || 'other',
          price: item.price?.toString() || '',
          warranty_months: getDefaultWarrantyMonths(item.category || 'other').toString(),
        }))
      : [{ name: '', category: 'other', price: '', warranty_months: '24' }];

  return { form, items, detected: detectedFields };
}
