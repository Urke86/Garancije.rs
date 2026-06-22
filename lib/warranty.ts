import { t, getCurrentLocale } from '@/lib/i18n';
import { getDateLocale } from '@/lib/locale-storage';
import type { AppLocale } from '@/lib/locale-storage';

export const CATEGORY_IDS = [
  'appliances',
  'electronics',
  'footwear',
  'furniture',
  'clothing',
  'tools',
  'other',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

const CATEGORY_LABEL_KEYS: Record<CategoryId, string> = {
  appliances: 'warranty.categoryAppliances',
  electronics: 'warranty.categoryElectronics',
  footwear: 'warranty.categoryFootwear',
  furniture: 'warranty.categoryFurniture',
  clothing: 'warranty.categoryClothing',
  tools: 'warranty.categoryTools',
  other: 'warranty.categoryOther',
};

const DEFAULT_MONTHS: Record<CategoryId, number> = {
  appliances: 24,
  electronics: 24,
  footwear: 6,
  furniture: 24,
  clothing: 6,
  tools: 24,
  other: 24,
};

export function getCategories() {
  return CATEGORY_IDS.map((id) => ({
    id,
    label: t(CATEGORY_LABEL_KEYS[id]),
    defaultMonths: DEFAULT_MONTHS[id],
  }));
}

/** Prefer getCategories() so labels follow active locale. */
export const CATEGORIES = getCategories();

export function getCategoryLabel(category: string): string {
  const key = CATEGORY_LABEL_KEYS[category as CategoryId];
  return key ? t(key) : t('warranty.categoryOther');
}

export function getDefaultWarrantyMonths(category: string): number {
  return DEFAULT_MONTHS[category as CategoryId] ?? 24;
}

export function calculateWarrantyExpiry(purchaseDate: string, months: number): string {
  const date = new Date(purchaseDate);
  date.setMonth(date.getMonth() + months);
  return date.toISOString().split('T')[0];
}

export function getDaysUntilExpiry(expiryDate: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const expiry = new Date(expiryDate);
  const diff = expiry.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getWarrantyStatus(expiryDate: string): 'active' | 'expiring' | 'expired' {
  const days = getDaysUntilExpiry(expiryDate);
  if (days <= 0) return 'expired';
  if (days <= 30) return 'expiring';
  return 'active';
}

export function getWarrantyStatusLabel(status: 'active' | 'expiring' | 'expired'): string {
  if (status === 'expired') return t('warranty.statusExpired');
  if (status === 'expiring') return t('warranty.statusExpiring');
  return t('warranty.statusActive');
}

export function formatLocalizedDate(dateStr: string, locale?: AppLocale): string {
  const loc = getDateLocale(locale ?? getCurrentLocale());
  return new Date(dateStr).toLocaleDateString(loc, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** @deprecated use formatLocalizedDate */
export function formatSerbianDate(dateStr: string): string {
  return formatLocalizedDate(dateStr, 'sr');
}

export interface WarrantyRemainingParts {
  years: number;
  months: number;
  days: number;
}

export interface WarrantyRemainingInfo {
  status: 'active' | 'expiring' | 'expired';
  statusLabel: string;
  expired: boolean;
  daysRemaining: number;
  daysLabel: string;
  parts: WarrantyRemainingParts;
  remainingLabel: string;
  expiryLabel: string;
}

function pluralUnit(count: number, one: string, few: string, many: string): string {
  const locale = getCurrentLocale();
  if (locale === 'en') {
    return count === 1 ? one : few;
  }
  const n = Math.abs(count);
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 14) return many;
  if (mod10 === 1) return one;
  if (mod10 >= 2 && mod10 <= 4) return few;
  return many;
}

function formatParts(parts: WarrantyRemainingParts, prefix: string): string {
  const chunks: string[] = [];
  if (parts.years > 0) {
    const w = pluralUnit(
      parts.years,
      t('warranty.unitYear_one'),
      t('warranty.unitYear_few'),
      t('warranty.unitYear_many'),
    );
    chunks.push(`${parts.years} ${w}`);
  }
  if (parts.months > 0) {
    const w = pluralUnit(
      parts.months,
      t('warranty.unitMonth_one'),
      t('warranty.unitMonth_few'),
      t('warranty.unitMonth_many'),
    );
    chunks.push(`${parts.months} ${w}`);
  }
  if (parts.days > 0 || chunks.length === 0) {
    const w = pluralUnit(
      parts.days,
      t('warranty.unitDay_one'),
      t('warranty.unitDay_few'),
      t('warranty.unitDay_many'),
    );
    chunks.push(`${parts.days} ${w}`);
  }
  return `${prefix}${chunks.join(', ')}`;
}

function diffCalendarParts(from: Date, to: Date): WarrantyRemainingParts {
  const start = new Date(from);
  const end = new Date(to);
  start.setHours(0, 0, 0, 0);
  end.setHours(0, 0, 0, 0);

  if (end.getTime() <= start.getTime()) {
    return { years: 0, months: 0, days: 0 };
  }

  let years = end.getFullYear() - start.getFullYear();
  let months = end.getMonth() - start.getMonth();
  let days = end.getDate() - start.getDate();

  if (days < 0) {
    months -= 1;
    days += new Date(end.getFullYear(), end.getMonth(), 0).getDate();
  }
  if (months < 0) {
    years -= 1;
    months += 12;
  }

  return { years, months, days };
}

export function getWarrantyRemainingParts(expiryDate: string): WarrantyRemainingParts {
  return diffCalendarParts(new Date(), new Date(expiryDate));
}

export function getWarrantyRemainingInfo(expiryDate: string): WarrantyRemainingInfo {
  const status = getWarrantyStatus(expiryDate);
  const days = getDaysUntilExpiry(expiryDate);
  const expired = days <= 0;
  const expiryLabel = formatLocalizedDate(expiryDate);
  const statusLabel = getWarrantyStatusLabel(status);

  if (expired) {
    const expiredParts = diffCalendarParts(new Date(expiryDate), new Date());
    const absDays = Math.abs(days);
    return {
      status,
      statusLabel,
      expired: true,
      daysRemaining: days,
      daysLabel:
        days === 0
          ? t('warranty.expiredToday')
          : t('warranty.expiredDaysAgo', { count: absDays }),
      parts: expiredParts,
      remainingLabel:
        days === 0
          ? t('warranty.expiredToday')
          : formatParts(expiredParts, t('warranty.expiredPrefix')),
      expiryLabel,
    };
  }

  const parts = getWarrantyRemainingParts(expiryDate);
  return {
    status,
    statusLabel,
    expired: false,
    daysRemaining: days,
    daysLabel: t('warranty.activeDaysRemaining', { count: days }),
    parts,
    remainingLabel: formatParts(parts, t('warranty.remainingPrefix')),
    expiryLabel,
  };
}
