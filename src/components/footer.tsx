'use client';

import { useI18n } from '@/lib/i18n-context';

/**
 * Small modern footer with copyright + developer credit.
 * Uses liquid glass style; does not distract from the main interface.
 *
 * Bottom padding accounts for the fixed bottom navigation bar (~88px tall)
 * plus safe-area inset, so the footer is fully visible when scrolled to the
 * end of the page on mobile.
 */
export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  return (
    <footer
      className="px-4 pt-3 mt-auto"
      style={{
        paddingBottom: 'calc(96px + env(safe-area-inset-bottom))',
      }}
    >
      <div className="glass rounded-2xl px-4 py-3 text-center max-w-2xl mx-auto">
        <p className="text-[11px] font-semibold text-stone-600 dark:text-amber-100/70">
          {t('footer.copyright', { year: String(year) })}
        </p>
        <p className="text-[10px] text-stone-500 dark:text-amber-100/50 mt-1">
          {t('footer.developer')}
        </p>
      </div>
    </footer>
  );
}
