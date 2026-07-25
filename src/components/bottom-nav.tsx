'use client';

import { motion } from 'framer-motion';
import { LayoutDashboard, CalendarDays, Tag, Truck, FileText, Receipt, Calendar } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

export type NavView = 'dashboard' | 'today' | 'price' | 'credit' | 'reports' | 'suppliers' | 'expenses' | 'calendar';

type Props = {
  active: NavView;
  onChange: (view: NavView) => void;
  /** Show a small red badge dot when there are active credit records. */
  creditBadge?: number;
};

export function BottomNav({ active, onChange, creditBadge }: Props) {
  const { t } = useI18n();

  const items: { id: NavView; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: t('nav.dashboard'), icon: <LayoutDashboard size={20} /> },
    { id: 'today', label: t('nav.today'), icon: <CalendarDays size={20} /> },
    { id: 'suppliers', label: t('nav.suppliers'), icon: <Truck size={20} /> },
    { id: 'credit', label: t('nav.credit'), icon: <Receipt size={20} /> },
    { id: 'expenses', label: t('expense.title'), icon: <Tag size={20} /> },
    { id: 'reports', label: t('nav.reports'), icon: <FileText size={20} /> },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 safe-bottom"
      aria-label="Bottom navigation"
    >
      <div className="mx-auto max-w-2xl px-2 pb-2 pt-1">
        <div className="glass-strong rounded-3xl px-1 py-1 flex items-center justify-between shadow-2xl">
          {items.map((item) => {
            const isActive = active === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChange(item.id)}
                className="relative flex-1 flex flex-col items-center justify-center gap-0.5 py-1.5 rounded-2xl transition-all"
                aria-label={item.label}
                aria-current={isActive ? 'page' : undefined}
              >
                <motion.div
                  initial={false}
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -1 : 0,
                  }}
                  transition={{ type: 'spring', damping: 18, stiffness: 280 }}
                  className={`relative flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-xl transition-colors ${
                    isActive ? 'glass-primary text-white' : 'text-stone-600 dark:text-amber-100/70'
                  }`}
                >
                  {item.icon}
                  {item.id === 'credit' && creditBadge && creditBadge > 0 ? (
                    <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                      {creditBadge > 9 ? '9+' : creditBadge}
                    </span>
                  ) : null}
                </motion.div>
                <span
                  className={`text-[9px] sm:text-[10px] leading-none transition-colors ${
                    isActive
                      ? 'font-bold text-amber-700 dark:text-amber-300'
                      : 'text-stone-600 dark:text-amber-100/60'
                  }`}
                >
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
