'use client';

import { useEffect } from 'react';
import { useSettings } from './use-data';
import { saveSettings } from './db';

/**
 * Sync theme + language to <html> + localStorage mirror.
 * v3.0 — language is always English; only theme needs syncing.
 */
export function useThemeSync() {
  const { settings } = useSettings();
  useEffect(() => {
    if (!settings) return;
    const theme = settings.theme || 'dark';
    applyThemeAndLang(theme, 'en');
  }, [settings]);
}

/** Imperative helper for setup wizard / settings to apply theme + lang
 *  immediately (before the async saveSettings round-trip completes). */
export function applyThemeAndLang(theme: 'light' | 'dark', _lang: 'en' = 'en') {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.classList.toggle('dark', theme === 'dark');
  root.lang = 'en';
  root.dir = 'ltr';
  try {
    const existing = JSON.parse(localStorage.getItem('shop-manager-settings') || '{}');
    existing.theme = theme;
    existing.language = 'en';
    localStorage.setItem('shop-manager-settings', JSON.stringify(existing));
  } catch { /* ignore */ }
  // Update theme-color meta
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', theme === 'dark' ? '#0c0a09' : '#f59e0b');
}
