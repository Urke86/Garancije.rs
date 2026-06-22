import type { ReceiptFormState } from '@/components/receipt/ReceiptEditForm';
import type { ReceiptItemInput } from '@/lib/receipt-persistence';
import { t } from '@/lib/i18n';

export type ReceiptFormField =
  | 'store_name'
  | 'purchase_date'
  | 'total_amount'
  | 'items'
  | `item_${number}_name`
  | `item_${number}_price`;

export interface ReceiptFormValidation {
  ok: boolean;
  message: string | null;
  fieldErrors: Partial<Record<ReceiptFormField, string>>;
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function isValidPurchaseDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  if (year < 2000 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function isValidOptionalAmount(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return true;
  const normalized = trimmed.replace(/\s/g, '').replace(',', '.');
  const amount = Number.parseFloat(normalized);
  return Number.isFinite(amount) && amount >= 0;
}

export function validateReceiptForm(
  form: ReceiptFormState,
  items: ReceiptItemInput[],
): ReceiptFormValidation {
  const fieldErrors: Partial<Record<ReceiptFormField, string>> = {};

  if (!form.store_name.trim()) {
    fieldErrors.store_name = t('errors.validationStoreRequired');
  }

  if (!form.purchase_date.trim()) {
    fieldErrors.purchase_date = t('errors.validationDateRequired');
  } else if (!isValidPurchaseDate(form.purchase_date.trim())) {
    fieldErrors.purchase_date = t('errors.validationDateFormat');
  }

  if (!isValidOptionalAmount(form.total_amount)) {
    fieldErrors.total_amount = t('errors.validationAmountInvalid');
  }

  const namedItems = items.filter((item) => item.name.trim());
  if (namedItems.length === 0) {
    fieldErrors.items = t('errors.addProductRequired');
  }

  items.forEach((item, index) => {
    if (!item.name.trim()) return;
    if (!isValidOptionalAmount(item.price)) {
      fieldErrors[`item_${index}_price`] = t('errors.validationPriceInvalid');
    }
  });

  const firstError =
    fieldErrors.store_name ||
    fieldErrors.purchase_date ||
    fieldErrors.total_amount ||
    fieldErrors.items ||
    Object.values(fieldErrors).find(Boolean) ||
    null;

  return {
    ok: Object.keys(fieldErrors).length === 0,
    message: firstError,
    fieldErrors,
  };
}
