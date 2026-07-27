'use client';

import { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Check, X, Trash2, Wallet, TrendingUp, TrendingDown, Receipt } from 'lucide-react';
import {
  useI18n,
  getAllExpenses, saveExpense, deleteExpense, genId, todayStr,
  getSalesForDateRange,
  formatCurrency, formatNumber,
  type Expense,
} from '@/lib/data-hooks-adapter';
import { useAppToast } from './toast-provider';
import { formatDate } from '@/lib/sinhala';

type Props = {
  onBack: () => void;
  currency: string;
};

export function ExpenseScreen({ onBack, currency }: Props) {
  const { t, lang } = useI18n();
  const { toast } = useAppToast();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [salesProfit, setSalesProfit] = useState(0);

  const refresh = async () => {
    setLoading(true);
    const [all, sales] = await Promise.all([
      getAllExpenses(),
      getSalesForDateRange(`${todayStr().slice(0, 7)}-01`, todayStr()),
    ]);
    setExpenses(all);
    setSalesProfit(sales.reduce((a, s) => a + s.profit, 0));
    setLoading(false);
  };

  useEffect(() => { refresh(); }, []);

  const totalThisMonth = useMemo(() => {
    const monthPrefix = todayStr().slice(0, 7);
    return expenses.filter(e => e.date.startsWith(monthPrefix)).reduce((a, e) => a + e.amount, 0);
  }, [expenses]);

  const realProfit = salesProfit - totalThisMonth;

  // 7-day breakdown
  const last7Days = useMemo(() => {
    const today = todayStr();
    const days: { date: string; total: number; label: string }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const total = expenses
        .filter((e) => e.date === dateStr)
        .reduce((a, e) => a + e.amount, 0);
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      days.push({ date: dateStr, total, label });
    }
    return days;
  }, [expenses]);

  const totalLast7Days = last7Days.reduce((a, d) => a + d.total, 0);

  const handleDelete = async (e: Expense) => {
    if (!confirm(t('expense.deleteConfirm'))) return;
    await deleteExpense(e.id);
    await refresh();
    toast({ title: t('expense.deleted'), variant: 'success' });
  };

  const categoryIcon = (cat: string) => {
    const icons: Record<string, string> = {
      transport: '🚚', electricity: '⚡', bags: '📦', rent: '🏠', other: '💰',
    };
    return icons[cat] || '💰';
  };

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
            <h1 className="text-lg font-bold text-stone-800 dark:text-amber-50">{t('expense.title')}</h1>
            <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('expense.sub')}</p>
          </div>
          <button
            onClick={() => setShowForm(true)}
            className="w-10 h-10 rounded-full glass-primary flex items-center justify-center text-white active:scale-90 transition-transform"
            aria-label={t('expense.add')}
          >
            <Plus size={20} />
          </button>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
        {/* Profit comparison card */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          <div className="glass-success rounded-2xl p-4">
            <div className="flex items-center gap-1.5 mb-1.5 opacity-90">
              <TrendingUp size={16} />
              <span className="text-xs">{t('expense.eggProfit')}</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(salesProfit, currency)}</p>
          </div>
          <div className={`rounded-2xl p-4 ${realProfit >= 0 ? 'glass-primary' : 'glass-danger'}`}>
            <div className="flex items-center gap-1.5 mb-1.5 opacity-90">
              <Wallet size={16} />
              <span className="text-xs">{t('expense.realProfit')}</span>
            </div>
            <p className="text-xl font-bold">{formatCurrency(realProfit, currency)}</p>
            <p className="text-[10px] opacity-80 mt-0.5">{t('expense.realProfitDesc')}</p>
          </div>
        </motion.section>

        {/* Monthly total */}
        <div className="glass rounded-2xl p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt size={16} className="text-stone-600 dark:text-amber-100/70" />
            <span className="text-sm text-stone-700 dark:text-amber-100/80">{t('expense.totalThisMonth')}</span>
          </div>
          <span className="font-bold text-red-600 dark:text-red-400">{formatCurrency(totalThisMonth, currency)}</span>
        </div>

        {/* 7-day breakdown */}
        <div className="glass-strong rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-sm text-stone-800 dark:text-amber-50">{t('expense.last7')}</h3>
            <span className="text-xs font-bold text-red-600 dark:text-red-400">{formatCurrency(totalLast7Days, currency)}</span>
          </div>
          <div className="flex items-end justify-between gap-1.5 h-32">
            {last7Days.map((d, i) => {
              const maxTotal = Math.max(...last7Days.map((x) => x.total), 1);
              const height = (d.total / maxTotal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div className="text-[9px] font-semibold text-stone-600 dark:text-amber-100/70 h-3">
                    {d.total > 0 ? formatNumber(d.total, 0) : ''}
                  </div>
                  <div className="w-full bg-stone-200/60 dark:bg-stone-700/60 rounded-t-md flex-1 flex items-end overflow-hidden">
                    <div
                      className="w-full bg-gradient-to-t from-amber-500 to-amber-400 rounded-t-md transition-all"
                      style={{ height: `${height}%`, minHeight: d.total > 0 ? '4px' : '0' }}
                    />
                  </div>
                  <span className="text-[9px] text-stone-500 dark:text-amber-100/60">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Expense list */}
        {loading ? (
          <div className="glass rounded-2xl p-8 text-center text-stone-500 dark:text-amber-100/60 text-sm">{t('common.loading')}</div>
        ) : expenses.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-stone-500 dark:text-amber-100/60 text-sm">{t('expense.noExpenses')}</div>
        ) : (
          <div className="space-y-2">
            {expenses.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="glass rounded-2xl p-3.5 flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl glass flex items-center justify-center text-xl flex-shrink-0">
                  {categoryIcon(e.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-stone-800 dark:text-amber-50">{t(`expense.${e.category}`)}</p>
                  <p className="text-xs text-stone-600 dark:text-amber-100/70 mt-0.5">
                    {formatDate(e.date, lang)}{e.note ? ` · ${e.note}` : ''}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-sm text-red-600 dark:text-red-400">{formatCurrency(e.amount, currency)}</p>
                </div>
                <button
                  onClick={() => handleDelete(e)}
                  className="w-8 h-8 rounded-lg glass-danger flex items-center justify-center text-white flex-shrink-0 active:scale-90 transition-transform"
                  aria-label={t('common.delete')}
                >
                  <Trash2 size={12} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <ExpenseForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSaved={() => { setShowForm(false); refresh(); }}
        currency={currency}
      />
    </div>
  );
}

function ExpenseForm({ open, onClose, onSaved, currency }: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  currency: string;
}) {
  const { t } = useI18n();
  const { toast } = useAppToast();
  const [category, setCategory] = useState<Expense['category']>('transport');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) { setAmount(''); setNote(''); setCategory('transport'); }
  }, [open]);

  const parseNum = (s: string) => { const n = parseFloat(s); return isFinite(n) ? n : 0; };
  const amountN = parseNum(amount);

  const handleSave = async () => {
    if (amountN <= 0) { toast({ title: t('expense.err.amount'), variant: 'warning' }); return; }
    setSaving(true);
    try {
      const expense: Expense = {
        id: genId(),
        category,
        amount: amountN,
        date: todayStr(),
        note: note.trim() || undefined,
        createdAt: Date.now(),
      };
      await saveExpense(expense);
      toast({ title: t('expense.saved'), variant: 'success' });
      onSaved();
    } catch (e: any) {
      toast({ title: t('toast.error'), description: e?.message, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const products: Expense['category'][] = ['transport', 'electricity', 'bags', 'rent', 'other'];

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
            className="relative w-full sm:max-w-md glass-strong rounded-3xl overflow-hidden"
            initial={{ scale: 0.95, opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          >
            <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-white/30">
              <h2 className="text-lg font-bold text-stone-800 dark:text-amber-50">{t('expense.add')}</h2>
              <button onClick={onClose} className="w-9 h-9 rounded-full glass flex items-center justify-center text-stone-700 dark:text-amber-50">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-xs text-stone-600 dark:text-amber-100/70 mb-1 block">{t('expense.category')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {products.map((c) => (
                    <button
                      key={c}
                      onClick={() => setCategory(c)}
                      className={`py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        category === c ? 'glass-primary text-white' : 'glass text-stone-700 dark:text-amber-100'
                      }`}
                    >
                      {t(`expense.${c}`)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-stone-600 dark:text-amber-100/70 mb-1 block">{t('expense.amount')}</label>
                <div className="relative">
                  <input
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    className="w-full px-3 py-3 rounded-xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 text-stone-800 dark:text-amber-50 font-semibold text-lg focus:outline-none focus:ring-2 focus:ring-amber-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 text-xs">{currency}</span>
                </div>
              </div>
              <div>
                <label className="text-xs text-stone-600 dark:text-amber-100/70 mb-1 block">{t('expense.note')} ({t('common.optional')})</label>
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder={t('expense.notePlaceholder')}
                  className="w-full px-3 py-3 rounded-xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 text-stone-800 dark:text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-white/30 glass-tint grid grid-cols-2 gap-3">
              <button onClick={onClose} className="glass rounded-2xl py-3 font-semibold text-stone-700 dark:text-amber-100 active:scale-95 transition-transform">
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving || amountN <= 0}
                className="glass-primary rounded-2xl py-3 font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
              >
                {saving ? <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Check size={16} /> {t('common.save')}</>}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
