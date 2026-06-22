import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { sr } from '@/locales/sr';
import { en } from '@/locales/en';
import type { AppLocale } from '@/lib/locale-storage';

export const defaultLocale: AppLocale = 'sr';

void i18n.use(initReactI18next).init({
  resources: {
    sr: { translation: sr },
    en: { translation: en },
  },
  lng: defaultLocale,
  fallbackLng: defaultLocale,
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export { i18n };

export function getCurrentLocale(): AppLocale {
  return i18n.language === 'en' ? 'en' : 'sr';
}

export function setI18nLocale(locale: AppLocale): void {
  void i18n.changeLanguage(locale);
}

export function t(key: string, options?: Record<string, unknown>): string {
  return i18n.t(key, options);
}
