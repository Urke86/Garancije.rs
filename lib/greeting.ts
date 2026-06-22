import { t } from '@/lib/i18n';

export function getTimeGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return t('home.greetingMorning');
  if (hour < 18) return t('home.greetingDay');
  return t('home.greetingEvening');
}

export { getGreetingName, getUserInitials } from '@/lib/greeting-name';
