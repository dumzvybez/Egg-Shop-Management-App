'use client';

import { useCallback, useEffect } from 'react';
import { useSettings } from './use-data';

/**
 * Sync the saved theme + language from IndexedDB to:
 *   1. <html> classList ('dark')
 *   2. <html> lang attribute
 *   3. localStorage 'eggshop-settings' (for the inline bootstrap script
 *      in layout.tsx that runs before React hydration)
 *   4. <meta name="theme-color"> (for mobile browser UI)
 *
 * IMPORTANT: This hook is the SOURCE OF TRUTH for theme + language persistence.
 * Whenever the user changes theme or language in Settings, the settings-screen
 * must call `saveSettings({ theme, language })` AND `applyThemeAndLang(theme, lang)`
 * so that both IndexedDB and localStorage are updated immediately. Otherwise a
 * page refresh before pressing "Save" would lose the user's choice.
 */
export function useThemeSync() {
  const { settings } = useSettings();

  useEffect(() => {
    if (!settings) return;

    const theme = settings.theme || 'dark';
    const lang = settings.language || 'si';

    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.lang = lang;
    root.dir = 'ltr';

    // Mirror to localStorage for the bootstrap script on next reload.
    // This MUST stay in sync with IndexedDB so the bootstrap applies the
    // correct theme before React hydrates.
    try {
      localStorage.setItem('eggshop-settings', JSON.stringify({
        theme, language: lang,
        shopName: settings.shopName,
        ownerName: settings.ownerName,
        currency: settings.currency,
      }));
    } catch { /* ignore */ }

    // Update <meta name="theme-color"> for mobile browser UI bar
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    meta.content = theme === 'dark' ? '#0c0a09' : '#f59e0b';

    // Update document.title — uses translated app name
    const appNames: Record<string, string> = { si: 'බිත්තර කඩේ', en: 'EggShop' };
    const shopName = settings.shopName?.trim();
    document.title = shopName ? `${shopName} · ${appNames[lang] || 'EggShop'}` : (appNames[lang] || 'EggShop');
  }, [settings]);
}

/** Manually apply theme + language to <html> AND persist to localStorage.
 *  Use this in UI handlers (settings, setup wizard) for instant feedback.
 *  The caller should ALSO call saveSettings() to persist to IndexedDB so the
 *  change survives across sessions. */
export function applyThemeAndLang(theme: 'light' | 'dark', lang: 'si' | 'en') {
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.lang = lang;
  let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = theme === 'dark' ? '#0c0a09' : '#f59e0b';
  const appNames: Record<string, string> = { si: 'බිත්තර කඩේ', en: 'EggShop' };
  document.title = appNames[lang] || 'EggShop';

  // Persist to localStorage immediately so a refresh before React hydrates
  // picks up the new theme.
  try {
    const existing = localStorage.getItem('eggshop-settings');
    const parsed = existing ? JSON.parse(existing) : {};
    parsed.theme = theme;
    parsed.language = lang;
    localStorage.setItem('eggshop-settings', JSON.stringify(parsed));
  } catch { /* ignore */ }
}
