'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, ChevronRight, X } from 'lucide-react';
import { useI18n } from '@/lib/data-hooks-adapter';
import { formatMonth } from '@/lib/sinhala';

type Props = {
  open: boolean;
  month: string; // YYYY-MM of the month that just ended
  onViewReport: () => void;
  onClose: () => void;
};

export function MonthEndReminderModal({ open, month, onViewReport, onClose }: Props) {
  const { t } = useI18n();
  const monthLabel = formatMonth(month, 'si'); // always show in current UI lang via t body

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
            className="relative w-full max-w-sm glass-strong rounded-3xl overflow-hidden"
            initial={{ scale: 0.9, opacity: 0.6, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          >
            <div className="px-5 pt-5 pb-3 text-center">
              <div className="w-16 h-16 mx-auto mb-3 rounded-2xl glass-primary flex items-center justify-center text-white shadow-lg">
                <Calendar size={28} />
              </div>
              <h2 className="text-lg font-bold text-stone-800 dark:text-amber-50">{t('monthEnd.title')}</h2>
              <p className="text-xs text-stone-600 dark:text-amber-100/70 mt-1">
                {t('monthEnd.body', { month: monthLabel })}
              </p>
            </div>
            <div className="px-5 py-4 border-t border-white/30 glass-tint grid grid-cols-2 gap-3">
              <button
                onClick={onClose}
                className="glass rounded-2xl py-3 font-semibold text-stone-700 dark:text-amber-100 active:scale-95 transition-transform"
              >
                {t('monthEnd.later')}
              </button>
              <button
                onClick={onViewReport}
                className="glass-primary rounded-2xl py-3 font-bold text-white flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
              >
                {t('monthEnd.viewReport')} <ChevronRight size={14} />
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
