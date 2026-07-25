'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, AlertTriangle } from 'lucide-react';
import {
  useCategories, useI18n,
  savePriceSession, getPriceSessionsForDate, getDayRecord, setDayClosed, recalcDay, genId, todayStr,
  type PriceSession,
} from '@/lib/data-hooks-adapter';
import { useAppToast } from './toast-provider';
import { formatDate } from '@/lib/sinhala';

type Props = {
  open: boolean;
  date: string;
  onClose: () => void;
  onSaved?: () => void;
};

type Row = {
  categoryId: string;
  buyPrice: string;
  sellPrice: string;
  unavailable: boolean;
};

export function DailyPriceEntryModal({ open, date, onClose, onSaved }: Props) {
  const { categories } = useCategories();
  const { t, lang } = useI18n();
  const { toast } = useAppToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [invalidIds, setInvalidIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      setInvalidIds(new Set());
      const existing = await getPriceSessionsForDate(date);
      // For each category, find the latest session (highest sessionIndex) and prefill from it
      const initial: Row[] = categories.map((c) => {
        const latest = existing
          .filter((s) => s.categoryId === c.id)
          .sort((a, b) => b.sessionIndex - a.sessionIndex)[0];
        if (latest) {
          return {
            categoryId: c.id,
            buyPrice: latest.buyPrice == null ? '' : String(latest.buyPrice),
            sellPrice: latest.sellPrice == null ? '' : String(latest.sellPrice),
            unavailable: latest.buyPrice == null && latest.sellPrice == null,
          };
        }
        return { categoryId: c.id, buyPrice: '', sellPrice: '', unavailable: false };
      });
      if (!cancelled) {
        setRows(initial);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, date, categories]);

  const updateRow = (i: number, patch: Partial<Row>) => {
    setRows((r) => r.map((row, idx) => (idx === i ? { ...row, ...patch } : row)));
    // Clear invalid flag when this row changes
    if (patch.buyPrice !== undefined || patch.sellPrice !== undefined || patch.unavailable !== undefined) {
      const cat = rows[i]?.categoryId;
      if (cat) {
        setInvalidIds((s) => { const n = new Set(s); n.delete(cat); return n; });
      }
    }
  };

  const parseNum = (s: string): number | null => {
    if (s.trim() === '') return null;
    const n = parseFloat(s);
    return isFinite(n) ? n : null;
  };

  /**
   * VALIDATION: Each row must be either:
   *   (a) marked unavailable, OR
   *   (b) have BOTH buy and sell prices entered.
   * Returns the list of incomplete category IDs.
   */
  const getIncompleteRows = (): Row[] => {
    return rows.filter((r) => {
      if (r.unavailable) return false;
      const buy = parseNum(r.buyPrice);
      const sell = parseNum(r.sellPrice);
      // Incomplete if either price is missing, OR if either is <=0
      return buy == null || sell == null || buy <= 0 || sell <= 0;
    });
  };

  const incomplete = getIncompleteRows();
  const hasNegative = rows.some(
    (r) => !r.unavailable && parseNum(r.buyPrice) != null && parseNum(r.sellPrice) != null && (parseNum(r.sellPrice)! < parseNum(r.buyPrice)!)
  );
  const filledCount = rows.length - incomplete.length;
  const totalBuy = rows.reduce((a, r) => a + (r.unavailable ? 0 : (parseNum(r.buyPrice) || 0)), 0);
  const totalSell = rows.reduce((a, r) => a + (r.unavailable ? 0 : (parseNum(r.sellPrice) || 0)), 0);

  const handleSave = async () => {
    // Validate
    const bad = getIncompleteRows();
    if (bad.length > 0) {
      const badIds = new Set(bad.map((r) => r.categoryId));
      setInvalidIds(badIds);
      const names = bad.map((r) => {
        const c = categories.find((x) => x.id === r.categoryId);
        return c?.nameKey ? t(c.nameKey) : (c?.name || r.categoryId);
      }).join(', ');
      toast({
        title: t('price.error.noData'),
        description: t('price.validation.incomplete', { names }),
        variant: 'warning',
      });
      return;
    }

    setSaving(true);
    try {
      const existing = await getPriceSessionsForDate(date);
      // Compute new sessionIndex = max(existing sessionIndex) + 1.
      // Only count sessions that have at least one available category to avoid burning session numbers
      // when re-opening today's modal after marking everything unavailable.
      const maxIdx = existing.reduce((m, s) => Math.max(m, s.sessionIndex), -1);
      const newIdx = maxIdx + 1;

      const day = await getDayRecord(date);
      if (!day) {
        await setDayClosed(date, false);
      }

      const newSessions: PriceSession[] = [];
      for (const r of rows) {
        const buy = r.unavailable ? null : parseNum(r.buyPrice);
        const sell = r.unavailable ? null : parseNum(r.sellPrice);
        // Skip nothing — every category must produce a session so we know its
        // unavailability status today. (Either real prices OR explicit nulls.)
        newSessions.push({
          id: genId(),
          date,
          categoryId: r.categoryId,
          sessionIndex: newIdx,
          buyPrice: buy,
          sellPrice: sell,
          createdAt: Date.now(),
        });
      }

      for (const s of newSessions) await savePriceSession(s);
      await recalcDay(date);
      toast({
        title: t('price.saved.title'),
        description: t('price.saved.desc'),
        variant: 'success',
      });
      onSaved?.();
      onClose();
    } catch (e: any) {
      toast({ title: t('toast.error'), description: e?.message || t('toast.errorDesc'), variant: 'error' });
    } finally {
      setSaving(false);
    }
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
          <div
            className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            className="relative w-full sm:max-w-lg max-h-[90vh] glass-strong rounded-3xl overflow-hidden flex flex-col"
            initial={{ scale: 0.95, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-white/30">
              <div>
                <h2 className="text-xl font-bold text-stone-800 dark:text-amber-50">{t('price.title')}</h2>
                <p className="text-xs text-stone-600 dark:text-amber-100/70 mt-0.5">{formatDate(date, lang)}</p>
              </div>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full glass flex items-center justify-center text-stone-700 dark:text-amber-50 active:scale-90 transition-transform"
                aria-label={t('common.close')}
              >
                <X size={18} />
              </button>
            </div>

            {loading ? (
              <div className="flex-1 flex items-center justify-center py-12">
                <div className="w-10 h-10 border-3 border-amber-500 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto scroll-area px-5 py-4 space-y-3">
                  {rows.map((r, i) => {
                    const cat = categories.find((c) => c.id === r.categoryId);
                    const buy = parseNum(r.buyPrice);
                    const sell = parseNum(r.sellPrice);
                    const profit = !r.unavailable && buy != null && sell != null ? sell - buy : null;
                    const negative = profit != null && profit < 0;
                    const isInvalid = invalidIds.has(r.categoryId);
                    return (
                      <div
                        key={r.categoryId}
                        className={`glass rounded-2xl p-4 animate-float-in ${r.unavailable ? 'opacity-60' : ''} ${isInvalid ? 'row-invalid' : ''}`}
                        style={{ animationDelay: `${i * 40}ms` }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-8 rounded-full" style={{ background: cat?.color }} />
                            <p className="font-semibold text-stone-800 dark:text-amber-50">
                              {cat?.nameKey ? t(cat.nameKey) : cat?.name}
                            </p>
                          </div>
                          <label className="flex items-center gap-1.5 text-xs text-stone-600 dark:text-amber-100/70 select-none cursor-pointer">
                            <input
                              type="checkbox"
                              checked={r.unavailable}
                              onChange={(e) => updateRow(i, { unavailable: e.target.checked })}
                              className="w-4 h-4 rounded accent-amber-500"
                            />
                            {t('price.notAvailable')}
                          </label>
                        </div>
                        {!r.unavailable && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-stone-600 dark:text-amber-100/70 mb-1 block">{t('price.buyPrice')}</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.01"
                                  value={r.buyPrice}
                                  onChange={(e) => updateRow(i, { buyPrice: e.target.value })}
                                  placeholder="0.00"
                                  className={`w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-white/5 border font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400 ${
                                    isInvalid ? 'border-red-300' : 'border-white/80 dark:border-white/10'
                                  } text-stone-800 dark:text-amber-50`}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs">රු.</span>
                              </div>
                            </div>
                            <div>
                              <label className="text-xs text-stone-600 dark:text-amber-100/70 mb-1 block">{t('price.sellPrice')}</label>
                              <div className="relative">
                                <input
                                  type="number"
                                  inputMode="decimal"
                                  step="0.01"
                                  value={r.sellPrice}
                                  onChange={(e) => updateRow(i, { sellPrice: e.target.value })}
                                  placeholder="0.00"
                                  className={`w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-white/5 border font-semibold focus:outline-none focus:ring-2 ${
                                    negative ? 'border-red-300 focus:ring-red-400' : isInvalid ? 'border-red-300 focus:ring-red-400' : 'border-white/80 dark:border-white/10 focus:ring-amber-400'
                                  } text-stone-800 dark:text-amber-50`}
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs">රු.</span>
                              </div>
                            </div>
                          </div>
                        )}
                        {!r.unavailable && profit != null && (
                          <div className={`mt-2 text-xs flex items-center gap-1 ${negative ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                            {negative ? <AlertTriangle size={12} /> : <Check size={12} />}
                            {t('price.profitPerEgg')}: රු. {profit.toFixed(2)}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {hasNegative && (
                    <div className="glass rounded-2xl p-3 border-red-300 bg-red-50/60 dark:bg-red-900/20">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={16} />
                        <p className="text-xs text-red-700 dark:text-red-300">
                          {t('price.negativeWarning')}
                        </p>
                      </div>
                    </div>
                  )}

                  {incomplete.length > 0 && (
                    <div className="glass rounded-2xl p-3 border-amber-300 bg-amber-50/60 dark:bg-amber-900/20">
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                        <p className="text-xs text-amber-700 dark:text-amber-300">
                          {t('price.validation.required')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="px-5 py-4 border-t border-white/30 glass-tint space-y-3">
                  <div className="flex items-center justify-between text-xs text-stone-600 dark:text-amber-100/70">
                    <span>{t('price.entered')}: {filledCount}/{rows.length}</span>
                    <span>{t('price.priceDiff')}: රු. {(totalSell - totalBuy).toFixed(2)}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={onClose}
                      className="glass rounded-2xl py-3 font-semibold text-stone-700 dark:text-amber-100 active:scale-95 transition-transform"
                    >
                      {t('common.cancel')}
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="glass-primary rounded-2xl py-3 font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
                    >
                      {saving ? (
                        <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Check size={18} />
                      )}
                      {t('common.save')}
                    </button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
