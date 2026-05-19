import { CATEGORIES, formatSerbianDate } from '@/lib/warranty';

export interface SearchableReceiptItem {
  id: string;
  name: string;
  category?: string;
  price?: number;
  warranty_expires_at?: string | null;
}

export interface SearchableReceipt {
  id: string;
  store_name: string;
  purchase_date: string;
  total_amount: number;
  pib?: string | null;
  receipt_number?: string | null;
  receipt_items: SearchableReceiptItem[];
}

function normalizeForSearch(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function categoryLabel(categoryId?: string): string {
  if (!categoryId) return '';
  return CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId;
}

export function buildReceiptSearchText(receipt: SearchableReceipt): string {
  const parts: string[] = [
    receipt.store_name,
    receipt.pib ?? '',
    receipt.receipt_number ?? '',
    receipt.purchase_date,
    formatSerbianDate(receipt.purchase_date),
    String(receipt.total_amount),
    receipt.total_amount.toLocaleString('sr-RS'),
  ];

  for (const item of receipt.receipt_items ?? []) {
    parts.push(
      item.name,
      categoryLabel(item.category),
      item.category ?? '',
      String(item.price ?? ''),
      item.warranty_expires_at ?? '',
      item.warranty_expires_at ? formatSerbianDate(item.warranty_expires_at) : '',
    );
  }

  return normalizeForSearch(parts.filter(Boolean).join(' '));
}

/** Svi tokeni iz upita moraju postojati kao podstring u haystack-u. */
export function receiptMatchesQuery(receipt: SearchableReceipt, rawQuery: string): boolean {
  const query = normalizeForSearch(rawQuery);
  if (!query) return true;

  const haystack = buildReceiptSearchText(receipt);
  const tokens = query.split(' ').filter(Boolean);
  return tokens.every((token) => haystack.includes(token));
}

export function filterReceiptsByQuery<T extends SearchableReceipt>(
  receipts: T[],
  rawQuery: string,
): T[] {
  const q = rawQuery.trim();
  if (!q) return receipts;
  return receipts.filter((r) => receiptMatchesQuery(r, q));
}
