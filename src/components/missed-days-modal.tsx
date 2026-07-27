'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Store, PencilLine } from 'lucide-react';
import { detectMissedDays, setDayClosed, useI18n, todayStr, formatDate } from '@/lib/data-hooks-adapter';
import { useAppToast } from './toast-provider';

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
    if (open) {
      detectMissedDays().then(setMissed);
    }
  }, [open]);

  const handleClose = () => {
    onClose();
  };

  const handleClosed = async (date: string) => {
    await setDayClosed(date, true);
    toast({
      title: t('missed.closedToast.title'),
      description: t('missed.closedToast.desc', { date: formatDate(date, lang) }),
      variant: 'success',
    });
    setMissed((m) => m.filter((d) => d !== date));
  };

  const handleBackfill = (date: string) => {
    onBackfill?.(date);
    onClose();
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
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={handleClose} />
          <motion.div
            className="relative w-full max-w-md glass-strong rounded-3xl overflow-hidden flex flex-col max-h-[85vh]"
            initial={{ scale: 0.92, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          >
            <div className="px-5 pt-5 pb-3 flex items-start justify-between border-b border-white/30">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl glass-primary flex items-center justify-center text-white">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-stone-800 dark:text-amber-50">{t('missed.title')}</h2>
                  <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('missed.subtitle')}</p>
                </div>
              </div>
              <button onClick={handleClose} className="w-8 h-8 rounded-full glass flex items-center justify-center text-stone-700 dark:text-amber-50">
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 overflow-y-auto scroll-area flex-1 space-y-2">
              {missed.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-sm text-stone-600 dark:text-amber-100/70">{t('missed.noMissed')}</p>
                </div>
              ) : (
                missed.map((date, i) => (
                  <motion.div
                    key={date}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.05, 0.4) }}
                    className="glass rounded-2xl p-3 animate-float-in"
                    style={{ animationDelay: `${i * 50}ms` }}
                  >
                    <div className="flex items-center justify-between mb-2.5">
                      <div>
                        <p className="font-bold text-sm text-stone-800 dark:text-amber-50">{formatDate(date, lang)}</p>
                        <p className="text-[10px] text-stone-500 dark:text-amber-100/50">{t('reports.noSales')}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => handleClosed(date)}
                        className="glass rounded-xl py-2 text-xs font-semibold text-stone-700 dark:text-amber-100 flex items-center justify-center gap-1 active:scale-95 transition-transform"
                      >
                        <Store size={12} /> {t('missed.closed')}
                      </button>
                      <button
                        onClick={() => handleBackfill(date)}
                        className="glass-primary rounded-xl py-2 text-xs font-bold text-white flex items-center justify-center gap-1 active:scale-95 transition-transform"
                      >
                        <PencilLine size={12} /> {t('missed.enterData')}
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
            <div className="px-5 py-4 border-t border-white/30 glass-tint">
              <button
                onClick={handleClose}
                className="w-full glass rounded-2xl py-3 font-semibold text-stone-700 dark:text-amber-100 text-sm active:scale-95 transition-transform"
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
