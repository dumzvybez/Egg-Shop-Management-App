'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Egg, AlertTriangle, TrendingUp, PackageX, History, Plus, Minus } from 'lucide-react';
import { useCategories, useInventory, useI18n, formatNumber, getAllStockMovements, todayStr, type StockMovement } from '@/lib/data-hooks-adapter';
import { formatDate } from '@/lib/sinhala';

type Props = {
  onBack: () => void;
};

/** Stock thresholds. Below LOW = red, below MEDIUM = orange, otherwise green. */
const HIGH_THRESHOLD = 100;
const MEDIUM_THRESHOLD = 50;

export function InventoryScreen({ onBack }: Props) {
  const { t, lang } = useI18n();
  const { categories } = useCategories();
  const { inventory, loading } = useInventory();
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    getAllStockMovements().then(setMovements);
  }, [inventory]);

  const totalEggs = categories.reduce((a, c) => a + (inventory[c.id] || 0), 0);
  const outOfStockCount = categories.filter(c => (inventory[c.id] || 0) === 0).length;
  const lowStockCount = categories.filter(c => {
    const qty = inventory[c.id] || 0;
    return qty > 0 && qty < MEDIUM_THRESHOLD;
  }).length;

  return (
    <div className="app-shell pb-28">
      <header className="glass-strong sticky top-0 z-30 safe-top">
        <div className="px-4 py-3 flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full glass flex items-center justify-center text-stone-700 dark:text-amber-50 active:scale-90 transition-transform"
            aria-label={t('common.back')}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-bold text-stone-800 dark:text-amber-50">{t('inventory.title')}</h1>
            <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('inventory.sub')}</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
        {/* Summary cards */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-2"
        >
          <div className="glass-primary rounded-2xl p-3 text-center">
            <Egg size={16} className="mx-auto mb-1 opacity-90" />
            <p className="text-xl font-bold">{formatNumber(totalEggs)}</p>
            <p className="text-[10px] opacity-90">{t('inventory.totalEggs')}</p>
          </div>
          <div className={`rounded-2xl p-3 text-center ${lowStockCount > 0 ? 'glass-danger' : 'glass text-stone-800 dark:text-amber-50'}`}>
            <AlertTriangle size={16} className="mx-auto mb-1 opacity-90" />
            <p className="text-xl font-bold">{lowStockCount}</p>
            <p className="text-[10px] opacity-90">{t('inventory.lowStockCount')}</p>
          </div>
          <div className={`rounded-2xl p-3 text-center ${outOfStockCount > 0 ? 'glass-danger' : 'glass text-stone-800 dark:text-amber-50'}`}>
            <PackageX size={16} className="mx-auto mb-1 opacity-90" />
            <p className="text-xl font-bold">{outOfStockCount}</p>
            <p className="text-[10px] opacity-90">{t('inventory.outOfStockCount')}</p>
          </div>
        </motion.section>

        {/* Low stock alert */}
        {lowStockCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass rounded-2xl p-3 border-amber-300 bg-amber-50/60 dark:bg-amber-900/20 flex items-start gap-2"
          >
            <AlertTriangle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-amber-700 dark:text-amber-300">
              {t('inventory.lowStockAlertDesc', { count: String(lowStockCount) })}
            </p>
          </motion.div>
        )}

        {/* Inventory cards per egg type */}
        {loading ? (
          <div className="glass rounded-2xl p-8 text-center text-stone-500 dark:text-amber-100/60 text-sm">{t('common.loading')}</div>
        ) : categories.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-stone-500 dark:text-amber-100/60 text-sm">{t('inventory.empty')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {categories.map((c, i) => {
              const qty = inventory[c.id] || 0;
              const stockLevel = qty === 0 ? 'out' : qty < MEDIUM_THRESHOLD ? 'low' : qty < HIGH_THRESHOLD ? 'medium' : 'high';
              return (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.05, 0.4) }}
                  className="glass-strong rounded-2xl p-4 relative overflow-hidden"
                >
                  {/* Color stripe */}
                  <div
                    className="absolute top-0 left-0 right-0 h-1"
                    style={{ background: c.color }}
                  />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md"
                        style={{ background: c.color }}
                      >
                        <Egg size={18} />
                      </div>
                      <div>
                        <p className="font-bold text-sm text-stone-800 dark:text-amber-50">
                          {c.nameKey ? t(c.nameKey) : c.name}
                        </p>
                        <p className="text-[10px] text-stone-500 dark:text-amber-100/50">{t('inventory.currentStock')}</p>
                      </div>
                    </div>
                    <StockBadge level={stockLevel} t={t} />
                  </div>
                  <div className="mt-3 flex items-baseline gap-1">
                    {qty === 0 ? (
                      <p className="text-2xl font-bold text-red-600 dark:text-red-400">{t('inventory.outOfStock')}</p>
                    ) : (
                      <>
                        <p className={`text-3xl font-bold ${stockLevel === 'low' ? 'text-red-600 dark:text-red-400' : stockLevel === 'medium' ? 'text-amber-600 dark:text-amber-400' : 'text-green-600 dark:text-green-400'}`}>
                          {formatNumber(qty)}
                        </p>
                        <p className="text-xs text-stone-500 dark:text-amber-100/50">{t('inventory.eggs')}</p>
                      </>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Stock Movement History */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-strong rounded-3xl p-5"
        >
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl glass flex items-center justify-center text-stone-700 dark:text-amber-100">
                <History size={16} />
              </div>
              <div className="text-left">
                <h3 className="font-bold text-sm text-stone-800 dark:text-amber-50">{t('stockHistory.title')}</h3>
                <p className="text-[10px] text-stone-500 dark:text-amber-100/50">{t('stockHistory.sub')}</p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full glass text-stone-600 dark:text-amber-100/70">
              {movements.length}
            </span>
          </button>
          {showHistory && (
            <div className="mt-3 space-y-1.5 max-h-80 overflow-y-auto scroll-area">
              {movements.length === 0 ? (
                <div className="text-center text-stone-500 dark:text-amber-100/60 text-sm py-4">{t('stockHistory.empty')}</div>
              ) : (
                movements.slice(0, 50).map((m) => {
                  const cat = categories.find(c => c.id === m.categoryId);
                  const isAdded = m.changeType === 'added';
                  return (
                    <div key={m.id} className="glass rounded-xl p-2.5 flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-white flex-shrink-0 ${
                        isAdded ? 'bg-green-500' : 'bg-red-500'
                      }`}>
                        {isAdded ? <Plus size={12} /> : <Minus size={12} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-stone-800 dark:text-amber-50">
                          {isAdded ? '+ ' : '− '}{formatNumber(m.quantity)} {cat?.nameKey ? t(cat.nameKey) : cat?.name}
                        </p>
                        <p className="text-[10px] text-stone-500 dark:text-amber-100/50">
                          {formatDate(m.date, lang)} · {isAdded ? t('stockHistory.supplier') : t('stockHistory.sale')} · {t('stockHistory.remaining')}: {formatNumber(m.remainingAfter)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
}

function StockBadge({ level, t }: { level: 'high' | 'medium' | 'low' | 'out'; t: (key: string) => string }) {
  const config = {
    high: { color: 'bg-green-500/20 text-green-700 dark:text-green-400', label: t('inventory.highStock'), icon: <TrendingUp size={10} /> },
    medium: { color: 'bg-amber-500/20 text-amber-700 dark:text-amber-300', label: t('inventory.mediumStock'), icon: <TrendingUp size={10} /> },
    low: { color: 'bg-orange-500/20 text-orange-700 dark:text-orange-400', label: t('inventory.lowStock'), icon: <AlertTriangle size={10} /> },
    out: { color: 'bg-red-500/20 text-red-700 dark:text-red-400', label: t('inventory.outOfStock'), icon: <PackageX size={10} /> },
  };
  const c = config[level];
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-semibold ${c.color}`}>
      {c.icon} {c.label}
    </span>
  );
}
