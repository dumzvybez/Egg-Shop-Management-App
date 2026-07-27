'use client';

import { useI18n } from '@/lib/i18n-context';

export function Footer() {
  const { t } = useI18n();
  const year = new Date().getFullYear();
  return (
    <footer
      className="px-4 pt-2"
      style={{ paddingBottom: 'calc(96px + env(safe-area-inset-bottom))' }}
    >
      <div className="glass rounded-2xl py-3 px-4 max-w-2xl mx-auto text-center">
        <p className="text-[11px] font-semibold text-stone-600 dark:text-amber-100/70">
          {t('footer.copyright', { year })}
        </p>
        <p className="text-[10px] text-stone-500 dark:text-amber-100/50 mt-0.5">
          {t('footer.developer')}
        </p>
      </div>
    </footer>
  );
}
