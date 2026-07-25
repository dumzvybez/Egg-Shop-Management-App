'use client';

import { createContext, useContext, useEffect, useState, type ReactNode, useCallback } from 'react';
import { translate, type Lang } from './i18n';
import { getSettings, saveSettings, type Settings } from './db';

type I18nCtx = {
  lang: Lang;
  setLang: (l: Lang) => Promise<void>;
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** Raw translate using PDF language (always English-friendly labels mixed with Sinhala numbers as needed) */
  ready: boolean;
};

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('si');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setLangState(s.language || 'si');
      setReady(true);
    })();
  }, []);

  const setLang = useCallback(async (l: Lang) => {
    setLangState(l);
    await saveSettings({ language: l });
  }, []);

  const t = useCallback((key: string, vars?: Record<string, string | number>) => {
    return translate(lang, key, vars);
  }, [lang]);

  return (
    <Ctx.Provider value={{ lang, setLang, t, ready }}>
      {children}
    </Ctx.Provider>
  );
}

export function useI18n(): I18nCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useI18n must be used within I18nProvider');
  return ctx;
}

/** Standalone translator for code that doesn't have React context (e.g. PDF generation, service worker). */
export function translatorFor(lang: Lang) {
  return (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars);
}
