export const CATEGORIES = [
  { id: 'appliances', label: 'Bela tehnika', defaultMonths: 24 },
  { id: 'electronics', label: 'Elektronika', defaultMonths: 24 },
  { id: 'footwear', label: 'Obuća', defaultMonths: 6 },
  { id: 'furniture', label: 'Nameštaj', defaultMonths: 24 },
  { id: 'clothing', label: 'Odeća', defaultMonths: 6 },
  { id: 'tools', label: 'Alati', defaultMonths: 24 },
  { id: 'other', label: 'Ostalo', defaultMonths: 24 },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];

export function getDefaultWarrantyMonths(category: string): number {
  const found = CATEGORIES.find((c) => c.id === category);
  return found?.defaultMonths ?? 24;
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
  if (status === 'expired') return 'Istekla';
  if (status === 'expiring') return 'Ističe uskoro';
  return 'Aktivna';
}

export function formatSerbianDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('sr-RS', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
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
  /** npr. "542 dana aktivne garancije" ili "Istekla pre 12 dana" */
  daysLabel: string;
  parts: WarrantyRemainingParts;
  /** npr. "Još 1 godinu, 2 meseca, 5 dana" */
  remainingLabel: string;
  /** Datum isteka, lokalizovan */
  expiryLabel: string;
}

function pluralSr(count: number, one: string, few: string, many: string): string {
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
    const w = pluralSr(parts.years, 'godinu', 'godine', 'godina');
    chunks.push(`${parts.years} ${w}`);
  }
  if (parts.months > 0) {
    const w = pluralSr(parts.months, 'mesec', 'meseca', 'meseci');
    chunks.push(`${parts.months} ${w}`);
  }
  if (parts.days > 0 || chunks.length === 0) {
    const w = pluralSr(parts.days, 'dan', 'dana', 'dana');
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
  const expiryLabel = formatSerbianDate(expiryDate);
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
          ? 'Garancija je istekla danas'
          : `Istekla pre ${absDays} ${pluralSr(absDays, 'dana', 'dana', 'dana')}`,
      parts: expiredParts,
      remainingLabel:
        days === 0
          ? 'Garancija je istekla danas'
          : formatParts(expiredParts, 'Istekla pre '),
      expiryLabel,
    };
  }

  const parts = getWarrantyRemainingParts(expiryDate);
  return {
    status,
    statusLabel,
    expired: false,
    daysRemaining: days,
    daysLabel: `${days} ${pluralSr(days, 'dan', 'dana', 'dana')} aktivne garancije`,
    parts,
    remainingLabel: formatParts(parts, 'Još '),
    expiryLabel,
  };
}
