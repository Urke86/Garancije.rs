import type { PendingOcrPayload } from '@/lib/ocr-pending';
import { t, getCurrentLocale } from '@/lib/i18n';

export const DEMO_USER_ID = '00000000-0000-4000-8000-0000000000de';

export const DEMO_USER = {
  id: DEMO_USER_ID,
  aud: 'authenticated',
  role: 'authenticated',
  email: 'marko.petrovic@gmail.com',
  email_confirmed_at: '2025-03-14T10:00:00.000Z',
  created_at: '2025-03-14T10:00:00.000Z',
  updated_at: '2025-03-14T10:00:00.000Z',
  app_metadata: { provider: 'email', providers: ['email'] },
  user_metadata: { full_name: 'Marko Petrović' },
  identities: [],
};

const DAY_MS = 24 * 60 * 60 * 1000;

function isoDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

function daysFromToday(days: number): Date {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  return new Date(d.getTime() + days * DAY_MS);
}

function subtractMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() - months);
  return d;
}

interface SeedItem {
  /** Name as printed on the Serbian fiscal receipt; also used in the Serbian UI. */
  name: string;
  /** Name shown when the app runs in English. */
  nameEn?: string;
  category: string;
  price: number;
  warrantyMonths: number;
}

interface SeedReceipt {
  key: string;
  store: string;
  pib: string;
  receiptNumber: string;
  /** Days until the first item's warranty expires (negative = already expired). */
  expiresInDays: number;
  items: SeedItem[];
}

/** Dates are anchored to "today" so statuses stay correct whenever screenshots are regenerated. */
const SEED: SeedReceipt[] = [
  {
    key: 'gigatron-sony',
    store: 'Gigatron',
    pib: '100386580',
    receiptNumber: 'GTR4K7Q2-GTR4K7Q2-48213',
    expiresInDays: 712,
    items: [{ name: 'Sony WH-1000XM5 slušalice', nameEn: 'Sony WH-1000XM5 headphones', category: 'electronics', price: 44999, warrantyMonths: 24 }],
  },
  {
    key: 'sportvision-nike',
    store: 'Sport Vision',
    pib: '104221905',
    receiptNumber: 'SPV8M2X1-SPV8M2X1-30917',
    expiresInDays: 9,
    items: [{ name: 'Nike Air Zoom Pegasus 40', category: 'footwear', price: 15990, warrantyMonths: 6 }],
  },
  {
    key: 'tehnomanija-samsung',
    store: 'Tehnomanija',
    pib: '101670560',
    receiptNumber: 'TMN3P9L5-TMN3P9L5-77104',
    expiresInDays: 548,
    items: [
      { name: 'Samsung Galaxy S24 128GB', category: 'electronics', price: 109999, warrantyMonths: 24 },
      { name: 'Samsung punjač 45W', nameEn: 'Samsung 45W charger', category: 'electronics', price: 3499, warrantyMonths: 24 },
    ],
  },
  {
    key: 'formaideale-sofa',
    store: 'Forma Ideale',
    pib: '100002793',
    receiptNumber: 'FID6W1R8-FID6W1R8-12058',
    expiresInDays: 409,
    items: [{ name: 'Ugaona garnitura Oslo', nameEn: 'Oslo corner sofa', category: 'furniture', price: 79990, warrantyMonths: 24 }],
  },
  {
    key: 'lidl-parkside',
    store: 'Lidl Srbija',
    pib: '109227014',
    receiptNumber: 'LDL2B5T9-LDL2B5T9-90342',
    expiresInDays: 701,
    items: [{ name: 'Parkside akumulatorska bušilica 20V', nameEn: 'Parkside 20V cordless drill', category: 'tools', price: 6999, warrantyMonths: 36 }],
  },
  {
    key: 'emmezeta-airfryer',
    store: 'Emmezeta',
    pib: '103875290',
    receiptNumber: 'EMZ7H4N6-EMZ7H4N6-55621',
    expiresInDays: 262,
    items: [{ name: 'Philips Airfryer XXL', category: 'appliances', price: 24990, warrantyMonths: 24 }],
  },
  {
    key: 'tehnomanija-gorenje',
    store: 'Tehnomanija',
    pib: '101670560',
    receiptNumber: 'TMN9C1D4-TMN9C1D4-20486',
    expiresInDays: 18,
    items: [{ name: 'Gorenje mašina za pranje veša', nameEn: 'Gorenje washing machine', category: 'appliances', price: 54999, warrantyMonths: 24 }],
  },
  {
    key: 'winwin-lenovo',
    store: 'WinWin',
    pib: '106189531',
    receiptNumber: 'WWN5F8J3-WWN5F8J3-61739',
    expiresInDays: -35,
    items: [{ name: 'Lenovo IdeaPad Slim 3', category: 'electronics', price: 64999, warrantyMonths: 24 }],
  },
];

export interface DemoReceiptRow {
  id: string;
  user_id: string;
  store_name: string;
  purchase_date: string;
  total_amount: number;
  pib: string;
  receipt_number: string;
  image_url: string;
  raw_ocr_text: string;
  created_at: string;
}

export interface DemoReceiptItemRow {
  id: string;
  user_id: string;
  receipt_id: string;
  name: string;
  /** Serbian name as printed on the receipt image. */
  receipt_label: string;
  category: string;
  price: number;
  warranty_months: number;
  warranty_expires_at: string;
  created_at: string;
}

export interface DemoReminderRow {
  id: string;
  user_id: string;
  receipt_item_id: string;
  remind_at: string;
  type: string;
  message: string;
  offset_days: number;
  is_sent: boolean;
  is_dismissed: boolean;
}

export function demoReceiptImagePath(key: string): string {
  return `portfolio-demo/receipt-${key}.png`;
}

function buildRawText(seed: SeedReceipt, purchaseDate: string, total: number): string {
  const lines = [
    seed.store.toUpperCase(),
    `PIB: ${seed.pib}`,
    '======== FISKALNI RAČUN ========',
    ...seed.items.map((i) => `${i.name}  ${i.price.toLocaleString('sr-RS')},00`),
    '--------------------------------',
    `UKUPAN IZNOS: ${total.toLocaleString('sr-RS')},00`,
    `PFR vreme: ${purchaseDate.split('-').reverse().join('.')}.`,
    `PFR broj računa: ${seed.receiptNumber}`,
  ];
  return lines.join('\n');
}

export interface DemoDatabase {
  receipts: DemoReceiptRow[];
  receipt_items: DemoReceiptItemRow[];
  reminders: DemoReminderRow[];
  notification_preferences: { user_id: string; enabled: boolean; offsets_days: number[] }[];
  push_tokens: Record<string, unknown>[];
}

export function createDemoDatabase(): DemoDatabase {
  const receipts: DemoReceiptRow[] = [];
  const items: DemoReceiptItemRow[] = [];

  SEED.forEach((seed, index) => {
    const expiry = daysFromToday(seed.expiresInDays);
    const purchase = subtractMonths(expiry, seed.items[0].warrantyMonths);
    const purchaseDate = isoDate(purchase);
    const total = seed.items.reduce((sum, i) => sum + i.price, 0);
    const receiptId = `demo-receipt-${index + 1}`;

    receipts.push({
      id: receiptId,
      user_id: DEMO_USER_ID,
      store_name: seed.store,
      purchase_date: purchaseDate,
      total_amount: total,
      pib: seed.pib,
      receipt_number: seed.receiptNumber,
      image_url: demoReceiptImagePath(seed.key),
      raw_ocr_text: buildRawText(seed, purchaseDate, total),
      created_at: purchase.toISOString(),
    });

    seed.items.forEach((item, itemIndex) => {
      const itemExpiry = new Date(purchase);
      itemExpiry.setMonth(itemExpiry.getMonth() + item.warrantyMonths);
      let renamed: string | null = null;
      items.push({
        id: `demo-item-${index + 1}-${itemIndex + 1}`,
        user_id: DEMO_USER_ID,
        receipt_id: receiptId,
        get name() {
          if (renamed) return renamed;
          return getCurrentLocale() === 'en' && item.nameEn ? item.nameEn : item.name;
        },
        set name(value: string) {
          renamed = value;
        },
        receipt_label: item.name,
        category: item.category,
        price: item.price,
        warranty_months: item.warrantyMonths,
        warranty_expires_at: isoDate(itemExpiry),
        created_at: purchase.toISOString(),
      });
    });
  });

  const firstItemOf = (seedKey: string) => {
    const receiptId = `demo-receipt-${SEED.findIndex((s) => s.key === seedKey) + 1}`;
    return items.find((i) => i.receipt_id === receiptId)!;
  };

  /** Same rule as production: remind_at = warranty expiry − offset days (09:00 local). */
  const remindAt = (item: DemoReceiptItemRow, offsetDays: number) => {
    const [y, m, d] = item.warranty_expires_at.split('-').map(Number);
    return new Date(y, m - 1, d - offsetDays, 9, 0, 0, 0).toISOString();
  };

  const nike = firstItemOf('sportvision-nike');
  const gorenje = firstItemOf('tehnomanija-gorenje');
  const airfryer = firstItemOf('emmezeta-airfryer');
  const lenovo = firstItemOf('winwin-lenovo');

  const reminder = (
    n: number,
    item: DemoReceiptItemRow,
    offsetDays: number,
    isSent = false,
  ): DemoReminderRow => ({
    id: `demo-reminder-${n}`,
    user_id: DEMO_USER_ID,
    receipt_item_id: item.id,
    remind_at: remindAt(item, offsetDays),
    type: 'warranty_expiring',
    get message() {
      return offsetDays === 1
        ? t('reminders.messageTomorrow', { name: item.name })
        : t('reminders.messageDays', { name: item.name, days: offsetDays });
    },
    offset_days: offsetDays,
    is_sent: isSent,
    is_dismissed: false,
  });

  /** One upcoming reminder per product so the list never shows two timings for the same item. */
  const reminders: DemoReminderRow[] = [
    reminder(1, nike, 7),
    reminder(2, gorenje, 14),
    reminder(3, airfryer, 30),
    reminder(4, lenovo, 7, true),
  ];

  return {
    receipts,
    receipt_items: items,
    reminders,
    notification_preferences: [
      { user_id: DEMO_USER_ID, enabled: true, offsets_days: [30, 14, 7, 1] },
    ],
    push_tokens: [],
  };
}

export const DEMO_OCR_IMAGE_PATH = demoReceiptImagePath('ocr-scan');

/** Result shown on the "new receipt" review screen, as if ML Kit just read the photo. */
export function createDemoPendingOcr(): PendingOcrPayload {
  const purchaseDate = isoDate(daysFromToday(0));
  return {
    result: {
      store_name: 'Gigatron',
      purchase_date: purchaseDate,
      total_amount: '89999',
      currency: 'RSD',
      pib: '100386580',
      receipt_number: 'GTR8D3V6-GTR8D3V6-50274',
      items: [{ name: 'LG OLED evo C3 55"', price: 89999, category: 'electronics' }],
      raw_text: [
        'GIGATRON',
        'PIB: 100386580',
        '======== FISKALNI RAČUN ========',
        'LG OLED evo C3 55"  89.999,00',
        '--------------------------------',
        'UKUPAN IZNOS: 89.999,00',
        `PFR vreme: ${purchaseDate.split('-').reverse().join('.')}.`,
        'PFR broj računa: GTR8D3V6-GTR8D3V6-50274',
      ].join('\n'),
    },
    warning: null,
    detectedFields: [
      'store_name',
      'purchase_date',
      'total_amount',
      'currency',
      'pib',
      'receipt_number',
      'product_name',
    ],
  };
}
