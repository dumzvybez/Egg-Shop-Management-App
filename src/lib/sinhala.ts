/**
 * Locale-formatting helpers for Shop Manager.
 *
 * v3.0 — English only. Number formatting uses en-US grouping (comma
 * thousands separator). Currency defaults to 'LKR'.
 */

import { type Lang, translate } from './i18n';

export const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const SINHALA_MONTHS = ENGLISH_MONTHS; // legacy alias kept

export const ENGLISH_DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday',
  'Thursday', 'Friday', 'Saturday',
];

export const SINHALA_DAYS = ENGLISH_DAYS; // legacy alias kept

function months(_lang: Lang = 'en'): string[] {
  return ENGLISH_MONTHS;
}

function days(_lang: Lang = 'en'): string[] {
  return ENGLISH_DAYS;
}

export function formatDate(dateStr: string, lang: Lang = 'en'): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  const m = months(lang);
  const dy = days(lang);
  return `${m[d.getMonth()]} ${d.getDate()}, ${dy[d.getDay()]}`;
}

export function formatDateShort(dateStr: string, lang: Lang = 'en'): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  const m = months(lang);
  return `${m[d.getMonth()]} ${d.getDate()}`;
}

export function formatDateLong(dateStr: string, lang: Lang = 'en'): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  const m = months(lang);
  return `${d.getFullYear()} ${m[d.getMonth()]} ${d.getDate()}`;
}

export function formatMonth(monthStr: string, lang: Lang = 'en'): string {
  if (!monthStr) return '';
  const parts = monthStr.split('-').map(Number);
  if (parts.length !== 2 || parts.some(isNaN)) return monthStr;
  const [y, m] = parts;
  return `${months(lang)[m - 1]} ${y}`;
}

export function formatNumber(n: number, decimals = 0): string {
  if (!isFinite(n)) return '0';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function formatCurrency(n: number, currency = 'LKR'): string {
  return `${currency} ${formatNumber(n, 2)}`;
}

export function relativeDayLabel(dateStr: string, today: string, lang: Lang = 'en'): string {
  if (dateStr === today) return translate(lang, 'common.today');
  const d = new Date(dateStr + 'T00:00:00');
  const t = new Date(today + 'T00:00:00');
  const delta = Math.round((t.getTime() - d.getTime()) / 86400000);
  if (delta === 1) return translate(lang, 'common.yesterday');
  if (delta === 2) return translate(lang, 'common.dayBefore');
  return formatDate(dateStr, lang);
}
