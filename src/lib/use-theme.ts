'use client';

import { useEffect } from 'react';
import { useSettings } from './use-data';
import { saveSettings, type Settings } from './db';
import { getTheme, getBackground, computeBodyBackground, type ThemeId, type BackgroundId } from './themes';

/**
 * Sync theme + background to <html> + <body> + localStorage mirror.
 * v3.1 — applies the new themeId + backgroundId system.
 */
export function useThemeSync() {
  const { settings } = useSettings();
  useEffect(() => {
    if (!settings) return;
    const themeId = (settings.themeId as ThemeId) || 'modern-dark';
    const bgId = (settings.backgroundId as BackgroundId) || 'default';
    applyThemeAndBackground(themeId, bgId);
  }, [settings]);
}

/**
 * Imperative helper for setup wizard / settings to apply theme + background
 * immediately (before the async saveSettings round-trip completes).
 */
export function applyThemeAndBackground(themeId: ThemeId, backgroundId: BackgroundId) {
  if (typeof document === 'undefined') return;
  const theme = getTheme(themeId);
  const root = document.documentElement;

  // Toggle .dark class based on theme darkness
  root.classList.toggle('dark', theme.isDark);
  root.lang = 'en';
  root.dir = 'ltr';

  // Apply theme CSS variables to :root (always) — they cascade to both
  // light and dark because we set .dark conditionally above.
  for (const [key, value] of Object.entries(theme.vars)) {
    root.style.setProperty(key, value);
  }

  // Apply background to .app-body
  const bodyBg = computeBodyBackground(theme, backgroundId);
  document.querySelectorAll('.app-body').forEach((el) => {
    (el as HTMLElement).style.background = bodyBg;
  });

  // Mirror to localStorage for the pre-hydration bootstrap script
  try {
    const existing = JSON.parse(localStorage.getItem('shop-manager-settings') || '{}');
    existing.themeId = themeId;
    existing.backgroundId = backgroundId;
    existing.theme = theme.isDark ? 'dark' : 'light';
    localStorage.setItem('shop-manager-settings', JSON.stringify(existing));
  } catch { /* ignore */ }

  // Update theme-color meta
  let meta = document.querySelector('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.setAttribute('name', 'theme-color');
    document.head.appendChild(meta);
  }
  meta.setAttribute('content', theme.isDark ? '#0c0a09' : '#fafaf9');
}

/**
 * Legacy compat — some old code calls applyThemeAndLang. Forward to
 * applyThemeAndBackground using sensible defaults.
 */
export function applyThemeAndLang(theme: 'light' | 'dark', _lang: 'en' = 'en') {
  // Map legacy theme to themeId
  const themeId: ThemeId = theme === 'dark' ? 'modern-dark' : 'light-pro';
  applyThemeAndBackground(themeId, 'default');
}
