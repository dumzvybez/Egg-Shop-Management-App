'use client';

import { createContext, useContext, useCallback, type ReactNode } from 'react';
import { translate, type Lang } from './i18n';
import { getSettings, saveSettings, type Settings } from './db';

type I18nCtx = {
  lang: Lang;
  setLang: (l: Lang) => Promise<void>;
  t: (key: string, vars?: Record<string, string | number>) => string;
  ready: boolean;
};

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  // Language is fixed to 'en' for v3.0. We keep the provider shape for
  // API stability; setLang is a no-op.
  const lang: Lang = 'en';

  const setLang = useCallback(async (_l: Lang) => {
    // no-op — English only in v3.0
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    return translate('en', key, vars);
  }, []);

  return (
    <Ctx.Provider value={{ lang, setLang, t, ready: true }}>
      {children}
    </Ctx.Provider>
  );
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

/** Standalone translator for non-React code (PDF generation, service worker). */
export function translatorFor(lang: Lang) {
  return (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);
}
