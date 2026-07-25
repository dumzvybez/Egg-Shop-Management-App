'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, Egg, Wallet, Coins, ChevronRight, Settings as SettingsIcon,
  Package, AlertTriangle, Users, Tag as TagIcon, Bell, Lightbulb, PackageX,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import {
  useDayData, useCategories, useI18n, useInventory, useCredits,
  getDayRecordsForRange, getMonthSummary, todayStr, addDays, relativeDayLabel,
  formatCurrency, formatNumber,
  type DayRecord, type MonthSummary,
} from '@/lib/data-hooks-adapter';
import { formatDate, formatDateShort, formatMonth } from '@/lib/sinhala';

type Props = {
  date: string;
  currency: string;
  onSeeAllReports: () => void;
  onSeeMonthlyReports: () => void;
  onRecentClick: (date: string) => void;
  shopName: string;
  ownerName: string;
  onOpenSettings: () => void;
  onOpenInventory: () => void;
  onOpenSuppliers: () => void;
  onOpenCredit: () => void;
  onChangePrice: () => void;
};

/** Stock thresholds — must match inventory-screen.tsx */
const HIGH_THRESHOLD = 100;
const MEDIUM_THRESHOLD = 50;

/** Compute a time-of-day greeting key based on the current hour. */
function greetingKey(): string {
  const h = new Date().getHours();
  if (h < 12) return 'greeting.morning';
  if (h < 17) return 'greeting.afternoon';
  if (h < 21) return 'greeting.evening';
  return 'greeting.night';
}

export function Dashboard({
  date, currency, onSeeAllReports, onSeeMonthlyReports, onRecentClick,
  shopName, ownerName, onOpenSettings, onOpenInventory, onOpenSuppliers, onOpenCredit,
  onChangePrice,
}: Props) {
  const { day, loading } = useDayData(date);
  const { categories } = useCategories();
  const { inventory } = useInventory();
  const { active: activeCredits } = useCredits();
  const { t, lang } = useI18n();
  const [recent, setRecent] = useState<DayRecord[]>([]);
  const [last7, setLast7] = useState<{ date: string; profit: number; label: string }[]>([]);
  const [yesterdayProfit, setYesterdayProfit] = useState<number | null>(null);
  const [monthSummary, setMonthSummary] = useState<MonthSummary | null>(null);

  useEffect(() => {
    (async () => {
      const today = todayStr();
      // Fetch last 7 days of sales for accurate profit chart
      const { getSalesForDateRange } = await import('@/lib/db');
      const salesByDate = new Map<string, number>();
      for (let i = 1; i <= 7; i++) {
        const d = addDays(today, -i);
        const sales = await getSalesForDateRange(d, d);
        const profit = sales.reduce((a, s) => a + s.profit, 0);
        if (profit !== 0 || sales.length > 0) {
          salesByDate.set(d, profit);
        }
      }
      // Build chart data (7 days, even if some have 0 profit)
      const chartData: { date: string; profit: number; label: string }[] = [];
      for (let i = 7; i >= 1; i--) {
        const d = addDays(today, -i);
        const dayNum = new Date(d + 'T00:00:00').getDate();
        chartData.push({
          date: d,
          profit: salesByDate.get(d) || 0,
          label: String(dayNum),
        });
      }
      setLast7(chartData);
      // Yesterday's profit for Business Health card
      setYesterdayProfit(salesByDate.get(addDays(today, -1)) || 0);

      // Recent records (for display)
      const records: DayRecord[] = [];
      for (let i = 1; i <= 7; i++) {
        const d = addDays(today, -i);
        const rec = await getDayRecordsForRange(d, d);
        if (rec.length > 0 && rec[0].status !== 'closed') {
          records.push(rec[0]);
        }
        if (records.length >= 5) break;
      }
      setRecent(records);

      const month = today.slice(0, 7);
      const ms = await getMonthSummary(month);
      setMonthSummary(ms);
    })();
  }, [date, day, lang]);

  const monthLabel = formatMonth(todayStr().slice(0, 7), lang);
  const todayHasData = day && (day.saleCount > 0 || day.status === 'closed');

  // Aggregate stock values
  const totalStock = useMemo(() => categories.reduce((a, c) => a + (inventory[c.id] || 0), 0), [categories, inventory]);
  const outOfStockCount = useMemo(() => categories.filter(c => (inventory[c.id] || 0) === 0).length, [categories, inventory]);
  const lowStockCount = useMemo(() => categories.filter(c => {
    const qty = inventory[c.id] || 0;
    return qty > 0 && qty < MEDIUM_THRESHOLD;
  }).length, [categories, inventory]);

  // Outstanding customer payments
  const outstandingCustomers = activeCredits.length;
  const outstandingTotal = useMemo(() => activeCredits.reduce((a, c) => a + c.remaining, 0), [activeCredits]);

  return (
    <div className="app-shell pb-28">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-30 safe-top">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg">
            <img src="/icons/icon-1024.png" alt="EggShop" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-stone-800 dark:text-amber-50 truncate">
              {shopName || t('app.name')}
            </h1>
            <p className="text-xs text-stone-600 dark:text-amber-100/70 truncate">
              {t(greetingKey())}
              {ownerName ? `, ${ownerName}` : ''}
            </p>
          </div>
          <button
            onClick={onChangePrice}
            className="w-10 h-10 rounded-full glass-primary flex items-center justify-center text-white active:scale-90 transition-transform"
            aria-label={t('dashboard.changePrice')}
            title={t('dashboard.changePrice')}
          >
            <TagIcon size={18} />
          </button>
          <button
            onClick={onOpenSettings}
            className="w-10 h-10 rounded-full glass flex items-center justify-center text-stone-700 dark:text-amber-50 active:scale-90 transition-transform"
            aria-label={t('settings.title')}
          >
            <SettingsIcon size={18} />
          </button>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
        {/* Today status */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl p-5"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-xs text-stone-500 dark:text-amber-100/60 mb-0.5">{t('dashboard.todayStatus')}</p>
              <h2 className="text-xl font-bold text-stone-800 dark:text-amber-50">{formatDateShort(date, lang)}</h2>
            </div>
            {todayHasData ? (
              <div className="px-3 py-1.5 rounded-full glass-success text-white text-xs font-semibold">
                {t('dashboard.hasData')}
              </div>
            ) : (
              <div className="px-3 py-1.5 rounded-full glass-info text-white text-xs font-semibold">
                {t('dashboard.start')}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <BigStat
              icon={<TrendingUp size={18} />}
              label={t('dashboard.todayProfit')}
              value={day ? formatCurrency(day.totalProfit, currency) : '—'}
              variant={day && day.totalProfit < 0 ? 'danger' : 'success'}
            />
            <BigStat
              icon={<Egg size={18} />}
              label={t('dashboard.todayEggs')}
              value={day ? `${formatNumber(day.totalEggs)} ${lang === 'si' ? 'ක්' : ''}`.trim() : `0 ${lang === 'si' ? 'ක්' : ''}`.trim()}
              variant="primary"
            />
            <BigStat
              icon={<Wallet size={18} />}
              label={t('dashboard.todaySell')}
              value={day ? formatCurrency(day.totalSell, currency) : '—'}
              variant="info"
            />
            <BigStat
              icon={<Coins size={18} />}
              label={t('dashboard.todayBuy')}
              value={day ? formatCurrency(day.totalBuy, currency) : '—'}
              variant="muted"
            />
          </div>
        </motion.section>

        {/* Business Health Card — today vs yesterday */}
        {day && yesterdayProfit !== null && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.02 }}
            className="glass-strong rounded-3xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-stone-800 dark:text-amber-50">{t('health.title')}</h3>
              </div>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                day.totalProfit < 0 ? 'glass-danger text-white'
                : day.totalProfit > yesterdayProfit ? 'glass-success text-white' : 'glass text-stone-700 dark:text-amber-100'
              }`}>
                {day.totalProfit < 0 ? t('health.worstDay') : day.totalProfit > yesterdayProfit ? t('health.goodDay') : t('health.slowDay')}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-2xl p-3">
                <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('health.todaySales')}</p>
                <p className="text-lg font-bold text-stone-800 dark:text-amber-50">{formatCurrency(day.totalSell, currency)}</p>
              </div>
              <div className="glass rounded-2xl p-3">
                <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('health.eggProfit')}</p>
                <p className={`text-lg font-bold ${day.totalProfit < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                  {formatCurrency(day.totalProfit, currency)}
                </p>
              </div>
            </div>
            {yesterdayProfit > 0 && (
              <p className="text-xs text-stone-500 dark:text-amber-100/50 mt-2">
                {t('health.vsYesterday')}: {day.totalProfit > yesterdayProfit ? '↑' : '↓'} {formatCurrency(Math.abs(day.totalProfit - yesterdayProfit), currency)}
              </p>
            )}
          </motion.section>
        )}

        {/* Inventory summary card */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="glass-strong rounded-3xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl glass-primary flex items-center justify-center text-white">
                <Package size={16} />
              </div>
              <div>
                <h3 className="font-bold text-stone-800 dark:text-amber-50">{t('inventory.currentStock')}</h3>
                <p className="text-xs text-stone-500 dark:text-amber-100/60">{formatNumber(totalStock)} {t('inventory.eggs')}</p>
              </div>
            </div>
            <button
              onClick={onOpenInventory}
              className="text-xs text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-0.5"
            >
              {t('dashboard.seeAll')} <ChevronRight size={12} />
            </button>
          </div>
          {/* Mini inventory chips */}
          <div className="grid grid-cols-3 gap-2">
            {categories.map((c) => {
              const qty = inventory[c.id] || 0;
              const isOut = qty === 0;
              const isLow = qty > 0 && qty < MEDIUM_THRESHOLD;
              return (
                <div
                  key={c.id}
                  onClick={onOpenInventory}
                  className="glass rounded-xl p-2 cursor-pointer active:scale-95 transition-transform"
                >
                  <div className="flex items-center gap-1 mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                    <p className="text-[10px] text-stone-600 dark:text-amber-100/70 truncate">{c.nameKey ? t(c.nameKey) : c.name}</p>
                  </div>
                  {isOut ? (
                    <p className="text-xs font-bold text-red-600 dark:text-red-400">{t('inventory.outOfStock')}</p>
                  ) : (
                    <p className={`text-sm font-bold ${isLow ? 'text-orange-600 dark:text-orange-400' : 'text-stone-800 dark:text-amber-50'}`}>
                      {formatNumber(qty)}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          {(lowStockCount > 0 || outOfStockCount > 0) && (
            <div className="glass rounded-xl p-2.5 mt-2 flex items-start gap-2 text-xs">
              <AlertTriangle size={12} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-amber-700 dark:text-amber-300">
                {outOfStockCount > 0 && `${outOfStockCount} ${t('inventory.outOfStockCount')}`}
                {outOfStockCount > 0 && lowStockCount > 0 && ' · '}
                {lowStockCount > 0 && `${lowStockCount} ${t('inventory.lowStockCount')}`}
              </p>
            </div>
          )}
        </motion.section>

        {/* Outstanding customer payments */}
        {outstandingCustomers > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="glass-strong rounded-3xl p-5"
          >
            <button onClick={onOpenCredit} className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl glass-danger flex items-center justify-center text-white">
                  <Users size={16} />
                </div>
                <div className="text-left">
                  <h3 className="font-bold text-stone-800 dark:text-amber-50">{t('dashboard.outstandingPayments')}</h3>
                  <p className="text-xs text-stone-500 dark:text-amber-100/60">
                    {outstandingCustomers} {t('dashboard.outstandingCustomers')}
                  </p>
                </div>
              </div>
              <ChevronRight size={16} className="text-stone-400 dark:text-amber-100/40" />
            </button>
            <div className="mt-3 glass-danger rounded-2xl p-3 flex items-center justify-between">
              <span className="text-xs text-white opacity-90">{t('dashboard.outstandingTotal')}</span>
              <span className="text-xl font-bold text-white">{formatCurrency(outstandingTotal, currency)}</span>
            </div>
          </motion.section>
        )}

        {/* Last 7 days chart */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="glass-strong rounded-3xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-stone-800 dark:text-amber-50">{t('trend.last7')}</h3>
              <p className="text-xs text-stone-500 dark:text-amber-100/60">{t('dashboard.last5ProfitSub')}</p>
            </div>
          </div>
          {last7.length > 0 ? (
            <div className="h-48 -mx-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={last7} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(120,113,108,0.15)" vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    axisLine={false}
                    tickLine={false}
                    className="text-stone-500"
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: 'currentColor' }}
                    axisLine={false}
                    tickLine={false}
                    className="text-stone-500"
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(245,158,11,0.1)' }}
                    contentStyle={{
                      background: 'rgba(255,255,255,0.95)',
                      border: '1px solid rgba(245,158,11,0.3)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                    formatter={(value: any) => [formatCurrency(Number(value), currency), t('dashboard.todayProfit')]}
                  />
                  <Bar dataKey="profit" radius={[8, 8, 0, 0]}>
                    {last7.map((entry, i) => (
                      <Cell key={i} fill={entry.profit < 0 ? '#ef4444' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-stone-500 dark:text-amber-100/60 text-sm">
              {t('dashboard.noData')}
            </div>
          )}
        </motion.section>

        {/* Month summary */}
        {monthSummary && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-strong rounded-3xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-stone-800 dark:text-amber-50">{t('dashboard.monthProfit', { month: monthLabel })}</h3>
                <p className="text-xs text-stone-500 dark:text-amber-100/60">{t('dashboard.monthSummary')}</p>
              </div>
              <button
                onClick={onSeeMonthlyReports}
                className="text-xs text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-0.5"
              >
                {t('dashboard.seeAll')} <ChevronRight size={12} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <BigStat
                icon={<TrendingUp size={16} />}
                label={t('dashboard.monthlyProfit')}
                value={formatCurrency(monthSummary.totalProfit, currency)}
                variant={monthSummary.totalProfit < 0 ? 'danger' : 'success'}
              />
              <BigStat
                icon={<Egg size={16} />}
                label={t('dashboard.totalEggs')}
                value={`${formatNumber(monthSummary.totalEggs)} ${lang === 'si' ? 'ක්' : ''}`.trim()}
                variant="primary"
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <MiniStat label={t('dashboard.openDays')} value={`${monthSummary.openDays}`} />
              <MiniStat label={t('dashboard.closedDays')} value={`${monthSummary.closedDays}`} />
              <MiniStat label={t('dashboard.dailyAvg')} value={formatCurrency(monthSummary.averageDailyProfit, currency)} />
            </div>
          </motion.section>
        )}

        {/* Suppliers quick link */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={onOpenSuppliers}
            className="w-full glass-strong rounded-3xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-2xl glass-info flex items-center justify-center text-white">
              <Package size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-stone-800 dark:text-amber-50">{t('supplier.title')}</p>
              <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('supplier.sub')}</p>
            </div>
            <ChevronRight size={18} className="text-stone-400 dark:text-amber-100/40" />
          </button>
        </motion.section>
      </main>
    </div>
  );
}

function BigStat({ icon, label, value, variant }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  variant: 'primary' | 'success' | 'info' | 'muted' | 'danger';
}) {
  const colorMap = {
    primary: 'glass-primary',
    success: 'glass-success',
    info: 'glass-info',
    muted: 'glass text-stone-800 dark:text-amber-50',
    danger: 'glass-danger',
  };
  return (
    <div className={`${colorMap[variant]} rounded-2xl p-4`}>
      <div className="flex items-center gap-1.5 mb-1.5 opacity-90">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-xl font-bold leading-tight">{value}</p>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass rounded-xl py-2.5 px-2">
      <p className="text-xs text-stone-600 dark:text-amber-100/70 mb-0.5">{label}</p>
      <p className="font-bold text-sm text-stone-800 dark:text-amber-50 truncate">{value}</p>
    </div>
  );
}
