/**
 * Locale-formatting helpers for ShopSuite.
 *
 * v3.1 — English only. Multi-currency support via currencies.ts.
 */

import { type Lang } from './i18n';
import { getCurrency } from './currencies';

export const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const SINHALA_MONTHS = ENGLISH_MONTHS;

export const ENGLISH_DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday',
];

export const SINHALA_DAYS = ENGLISH_DAYS;

function months(): string[] {
  return ENGLISH_MONTHS;
}

function days(): string[] {
  return ENGLISH_DAYS;
}

export function formatDate(dateStr: string, _lang: Lang = 'en'): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  const m = months();
  const dy = days();
  return `${m[d.getMonth()]} ${d.getDate()}, ${dy[d.getDay()]}`;
}

export function formatDateShort(dateStr: string, _lang: Lang = 'en'): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  const m = months();
  return `${m[d.getMonth()]} ${d.getDate()}`;
}

export function formatDateLong(dateStr: string, _lang: Lang = 'en'): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  const m = months();
  return `${d.getFullYear()} ${m[d.getMonth()]} ${d.getDate()}`;
}

export function formatMonth(monthStr: string, _lang: Lang = 'en'): string {
  if (!monthStr) return '';
  const parts = monthStr.split('-').map(Number);
  if (parts.length !== 2 || parts.some(isNaN)) return monthStr;
  const [y, m] = parts;
  return `${months()[m - 1]} ${y}`;
}

export function formatNumber(n: number, decimals = 0): string {
  if (!isFinite(n)) return '0';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Format a number as a currency string using the user's selected currency.
 * Falls back gracefully if currencyCode is unknown.
 *
 * v3.1: now uses the multi-currency system from currencies.ts.
 */
export function formatCurrency(n: number, currencyCode = 'LKR'): string {
  const c = getCurrency(currencyCode);
  const formatted = Math.abs(n).toLocaleString('en-US', {
    minimumFractionDigits: c.decimals,
    maximumFractionDigits: c.decimals,
  });
  const sign = n < 0 ? '-' : '';
  return c.position === 'before'
    ? `${sign}${c.symbol} ${formatted}`
    : `${sign}${formatted} ${c.symbol}`;
}

export function relativeDayLabel(dateStr: string, today: string, lang: Lang = 'en'): string {
  if (dateStr === today) return 'Today';
  const d = new Date(dateStr + 'T00:00:00');
  const t = new Date(today + 'T00:00:00');
  const delta = Math.round((t.getTime() - d.getTime()) / 86400000);
  if (delta === 1) return 'Yesterday';
  if (delta === 2) return 'Day before';
  return formatDate(dateStr, lang);
}
