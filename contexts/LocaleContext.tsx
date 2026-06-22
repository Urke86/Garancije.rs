import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '@/lib/supabase';
import { setI18nLocale } from '@/lib/i18n';
import { loadLocale, saveLocale, type AppLocale } from '@/lib/locale-storage';

type LocaleContextValue = {
  locale: AppLocale;
  ready: boolean;
  setLocale: (locale: AppLocale) => Promise<void>;
};

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

export function LocaleProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>('sr');
  const [ready, setReady] = useState(false);
  const userIdRef = useRef<string | null>(null);

  const applyForUser = useCallback(async (userId: string | null) => {
    userIdRef.current = userId;
    const stored = await loadLocale(userId);
    setLocaleState(stored);
    setI18nLocale(stored);
    setReady(true);
  }, []);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      applyForUser(data.session?.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      applyForUser(session?.user?.id ?? null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [applyForUser]);

  const setLocale = useCallback(async (next: AppLocale) => {
    setLocaleState(next);
    setI18nLocale(next);
    await saveLocale(userIdRef.current, next);
  }, []);

  const value = useMemo<LocaleContextValue>(
    () => ({ locale, ready, setLocale }),
    [locale, ready, setLocale],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error('useLocale must be used within LocaleProvider');
  return ctx;
}

export function useDateLocale(): string {
  const { locale } = useLocale();
  return locale === 'en' ? 'en-US' : 'sr-RS';
}

export function useI18nReady(): boolean {
  return useLocale().ready;
}
