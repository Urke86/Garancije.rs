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
