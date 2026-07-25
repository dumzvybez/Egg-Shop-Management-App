'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Store, PencilLine } from 'lucide-react';
import { detectMissedDays, setDayClosed, useI18n } from '@/lib/data-hooks-adapter';
import { useAppToast } from './toast-provider';
import { formatDate } from '@/lib/sinhala';

type Props = {
  open: boolean;
  onClose: () => void;
  onBackfill?: (date: string) => void;
};

export function MissedDaysModal({ open, onClose, onBackfill }: Props) {
  const { t, lang } = useI18n();
  const { toast } = useAppToast();
  const [missed, setMissed] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    detectMissedDays().then(setMissed);
  }, [open]);

  const handleClose = async (date: string) => {
    await setDayClosed(date, true);
    toast({
      title: t('missed.closedToast.title'),
      description: formatDate(date, lang) + ' — ' + t('missed.closedToast.desc'),
      variant: 'success',
    });
    setMissed((m) => m.filter((d) => d !== date));
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative w-full sm:max-w-md max-h-[85vh] glass-strong rounded-3xl overflow-hidden flex flex-col"
            initial={{ scale: 0.95, opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          >
            <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-white/30">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-full glass-info flex items-center justify-center text-white">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-stone-800 dark:text-amber-50">{t('missed.title')}</h2>
                  <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('missed.subtitle')}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full glass flex items-center justify-center text-stone-700 dark:text-amber-50 active:scale-90 transition-transform"
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto scroll-area px-5 py-4 space-y-2.5">
              {missed.length === 0 ? (
                <div className="text-center py-8 text-stone-500 dark:text-amber-100/60 text-sm">
                  {t('missed.noMissed')}
                </div>
              ) : (
                missed.map((date, i) => (
                  <div
                    key={date}
                    className="glass rounded-2xl p-4 animate-float-in"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-bold text-stone-800 dark:text-amber-50">{formatDate(date, lang)}</p>
                        <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('missed.noData')}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleClose(date)}
                        className="glass rounded-xl py-2.5 text-sm font-semibold text-stone-700 dark:text-amber-100 flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                      >
                        <Store size={14} />
                        {t('missed.closed')}
                      </button>
                      <button
                        onClick={() => {
                          onBackfill?.(date);
                          onClose();
                        }}
                        className="glass-primary rounded-xl py-2.5 text-sm font-bold text-white flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                      >
                        <PencilLine size={14} />
                        {t('missed.enterData')}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="px-5 py-4 border-t border-white/30 glass-tint">
              <button
                onClick={onClose}
                className="w-full glass rounded-2xl py-3 font-semibold text-stone-700 dark:text-amber-100 active:scale-95 transition-transform"
              >
                {t('missed.later')}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
