/**
 * Date / number / currency formatting helpers that respect the active language.
 * Sinhala and English both supported.
 */

import { type Lang, translate } from './i18n';

const SINHALA_MONTHS = [
  'ජනවාරි', 'පෙබරවාරි', 'මාර්තු', 'අප්‍රේල්', 'මැයි', 'ජූනි',
  'ජූලි', 'අගෝස්තු', 'සැප්තැම්බර්', 'ඔක්තෝබර්', 'නොවැම්බර්', 'දෙසැම්බර්',
];
const ENGLISH_MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SINHALA_DAYS = [
  'ඉරිදා', 'සඳුදා', 'අඟහරුවාදා', 'බදාදා', 'බ්‍රහස්පතින්දා', 'සිකුරාදා', 'සෙනසුරාදා',
];
const ENGLISH_DAYS = [
  'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday',
];

function months(lang: Lang) {
  return lang === 'en' ? ENGLISH_MONTHS : SINHALA_MONTHS;
}
function days(lang: Lang) {
  return lang === 'en' ? ENGLISH_DAYS : SINHALA_DAYS;
}

/** Format YYYY-MM-DD → "ජූලි 25, ඉරිදා" or "July 25, Sunday" */
export function formatDate(dateStr: string, lang: Lang = 'si'): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return `${months(lang)[d.getMonth()]} ${d.getDate()}, ${days(lang)[d.getDay()]}`;
}

/** Format YYYY-MM-DD → "ජූලි 25" or "July 25" */
export function formatDateShort(dateStr: string, lang: Lang = 'si'): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return `${months(lang)[d.getMonth()]} ${d.getDate()}`;
}

/** Format YYYY-MM → "ජූලි 2026" or "July 2026" */
export function formatMonth(monthStr: string, lang: Lang = 'si'): string {
  if (!monthStr) return '';
  const [y, m] = monthStr.split('-').map(Number);
  if (!y || !m) return monthStr;
  return `${months(lang)[m - 1]} ${y}`;
}

/** Format YYYY-MM-DD → "2026 ජූලි 25" or "2026 July 25" (used in PDF) */
export function formatDateLong(dateStr: string, lang: Lang = 'si'): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  return `${d.getFullYear()} ${months(lang)[d.getMonth()]} ${d.getDate()}`;
}

/** Format number with grouping */
export function formatNumber(n: number, decimals = 0): string {
  if (!isFinite(n)) return '0';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Format currency with the shop's currency symbol */
export function formatCurrency(n: number, currency = 'රු.'): string {
  return `${currency} ${formatNumber(n, 2)}`;
}

/** Sinhala relative day label: "අද", "ඊයේ", "පෙරේදා", otherwise weekday */
export function relativeDayLabel(dateStr: string, todayStr: string, lang: Lang = 'si'): string {
  if (dateStr === todayStr) {
    return translate(lang, 'common.today');
  }
  const a = new Date(dateStr + 'T00:00:00').getTime();
  const b = new Date(todayStr + 'T00:00:00').getTime();
  const delta = Math.round((b - a) / 86400000);
  if (delta === 1) return translate(lang, 'common.yesterday');
  if (delta === 2) return translate(lang, 'common.dayBefore');
  return formatDate(dateStr, lang);
}

export { SINHALA_MONTHS, SINHALA_DAYS, ENGLISH_MONTHS, ENGLISH_DAYS };
