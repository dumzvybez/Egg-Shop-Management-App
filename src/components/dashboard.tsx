'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, TrendingDown, Wallet, Coins, Truck, Users, Package,
  AlertTriangle, Settings as SettingsIcon, ChevronRight, Crown, ArrowUpRight, ArrowDownRight, ShoppingBag,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell,
} from 'recharts';
import {
  useI18n, getDashboardStats, getMonthSummary, todayStr, addDays,
  formatCurrency, formatNumber, type DashboardStats, type MonthSummary,
} from '@/lib/data-hooks-adapter';
import { formatDateShort, formatMonth } from '@/lib/sinhala';

type Props = {
  date: string;
  currency: string;
  onSeeAllReports: () => void;
  onSeeMonthlyReports: () => void;
  onRecentClick: (date: string) => void;
  shopName: string;
  ownerName: string;
  shopType: string;
  onOpenSettings: () => void;
  onOpenInventory: () => void;
  onOpenSuppliers: () => void;
  onOpenCredit: () => void;
  onOpenExpenses: () => void;
};

function greetingKey(): string {
  const h = new Date().getHours();
  if (h < 12) return 'greeting.morning';
  if (h < 17) return 'greeting.afternoon';
  if (h < 21) return 'greeting.evening';
  return 'greeting.night';
}

export function Dashboard({
  date, currency, onSeeAllReports, onSeeMonthlyReports,
  shopName, ownerName, shopType,
  onOpenSettings, onOpenInventory, onOpenSuppliers, onOpenCredit, onOpenExpenses,
}: Props) {
  const { t } = useI18n();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [monthSummary, setMonthSummary] = useState<MonthSummary | null>(null);
  const [last7, setLast7] = useState<{ date: string; profit: number; label: string }[]>([]);

  useEffect(() => {
    (async () => {
      const s = await getDashboardStats();
      setStats(s);

      const today = todayStr();
      const { getSalesForDateRange } = await import('@/lib/db');
      const salesByDate = new Map<string, number>();
      for (let i = 1; i <= 7; i++) {
        const d = addDays(today, -i);
        const sales = await getSalesForDateRange(d, d);
        const profit = sales.reduce((a, s) => a + s.profit, 0);
        if (profit !== 0 || sales.length > 0) salesByDate.set(d, profit);
      }
      const chartData: { date: string; profit: number; label: string }[] = [];
      for (let i = 7; i >= 1; i--) {
        const d = addDays(today, -i);
        const dayNum = new Date(d + 'T00:00:00').getDate();
        chartData.push({ date: d, profit: salesByDate.get(d) || 0, label: String(dayNum) });
      }
      setLast7(chartData);

      const month = today.slice(0, 7);
      const ms = await getMonthSummary(month);
      setMonthSummary(ms);
    })();
  }, [date]);

  const monthLabel = formatMonth(todayStr().slice(0, 7));

  // Compute today vs yesterday comparison
  const todayVsYesterday = stats && stats.yesterdayProfit !== null
    ? {
        diff: stats.todayProfit - stats.yesterdayProfit,
        pct: stats.yesterdayProfit > 0 ? ((stats.todayProfit - stats.yesterdayProfit) / Math.abs(stats.yesterdayProfit)) * 100 : 0,
        up: stats.todayProfit > stats.yesterdayProfit,
      }
    : null;

  // Compute month vs last month comparison
  const monthVsLastMonth = stats && stats.lastMonthProfit !== null
    ? {
        diff: stats.monthProfit - stats.lastMonthProfit,
        pct: stats.lastMonthProfit > 0 ? ((stats.monthProfit - stats.lastMonthProfit) / Math.abs(stats.lastMonthProfit)) * 100 : 0,
        up: stats.monthProfit > stats.lastMonthProfit,
      }
    : null;

  return (
    <div className="app-shell pb-28">
      {/* Header */}
      <header className="glass-strong sticky top-0 z-30 safe-top">
        <div className="px-4 py-3 flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl overflow-hidden flex-shrink-0 shadow-lg">
            <img src="/icons/icon-1024.png" alt="Shop Manager" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-base font-bold text-stone-800 dark:text-amber-50 truncate">
              {shopName || t('app.name')}
            </h1>
            <p className="text-xs text-stone-600 dark:text-amber-100/70 truncate">
              {t(greetingKey())}{ownerName ? `, ${ownerName}` : ''}
            </p>
          </div>
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
        {/* Top row: Cash Available + Gross Profit + Net Profit */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-2 gap-3"
        >
          <BigStat
            icon={<Wallet size={18} />}
            label={t('dashboard.cashAvailable')}
            value={stats ? formatCurrency(stats.cashAvailable, currency) : '—'}
            variant="success"
            sublabel={t('dashboard.cashAvailableDesc')}
            fullWidth
          />
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.02 }}
          className="grid grid-cols-2 gap-3"
        >
          <BigStat
            icon={<TrendingUp size={18} />}
            label={t('dashboard.grossProfit')}
            value={stats ? formatCurrency(stats.grossProfit, currency) : '—'}
            variant={stats && stats.grossProfit < 0 ? 'danger' : 'success'}
          />
          <BigStat
            icon={<Coins size={18} />}
            label={t('dashboard.netProfit')}
            value={stats ? formatCurrency(stats.netProfit, currency) : '—'}
            variant={stats && stats.netProfit < 0 ? 'danger' : 'primary'}
            sublabel={stats ? `${t('expense.totalThisMonth')}: ${formatCurrency(stats.monthExpenses, currency)}` : undefined}
          />
        </motion.section>

        {/* Dues: Supplier Due + Customer Due */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.04 }}
          className="grid grid-cols-2 gap-3"
        >
          <button onClick={onOpenSuppliers} className="text-left active:scale-[0.98] transition-transform">
            <BigStat
              icon={<Truck size={18} />}
              label={t('dashboard.supplierDue')}
              value={stats ? formatCurrency(stats.supplierDue, currency) : '—'}
              variant={stats && stats.supplierDue > 0 ? 'danger' : 'info'}
              sublabel={t('supplier.title')}
            />
          </button>
          <button onClick={onOpenCredit} className="text-left active:scale-[0.98] transition-transform">
            <BigStat
              icon={<Users size={18} />}
              label={t('dashboard.customerDue')}
              value={stats ? formatCurrency(stats.customerDue, currency) : '—'}
              variant={stats && stats.customerDue > 0 ? 'danger' : 'info'}
              sublabel={t('credit.title')}
            />
          </button>
        </motion.section>

        {/* Today's Sales */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="glass-strong rounded-3xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-stone-800 dark:text-amber-50">{t('dashboard.todaySales')}</h3>
              <p className="text-xs text-stone-500 dark:text-amber-100/60">{formatDateShort(date)}</p>
            </div>
            {todayVsYesterday && (
              <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                todayVsYesterday.up
                  ? 'glass-success text-white'
                  : todayVsYesterday.diff < 0
                  ? 'glass-danger text-white'
                  : 'glass text-stone-700 dark:text-amber-100'
              }`}>
                {todayVsYesterday.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {Math.abs(todayVsYesterday.diff) < 1 ? '—' : formatCurrency(Math.abs(todayVsYesterday.diff), currency)}
              </div>
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="glass rounded-2xl p-3">
              <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('dashboard.todaySell')}</p>
              <p className="text-base font-bold text-stone-800 dark:text-amber-50">
                {stats ? formatCurrency(stats.todaySales, currency) : '—'}
              </p>
            </div>
            <div className="glass rounded-2xl p-3">
              <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('dashboard.todayProfit')}</p>
              <p className={`text-base font-bold ${stats && stats.todayProfit < 0 ? 'text-red-600 dark:text-red-400' : 'text-green-700 dark:text-green-400'}`}>
                {stats ? formatCurrency(stats.todayProfit, currency) : '—'}
              </p>
            </div>
            <div className="glass rounded-2xl p-3">
              <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('dashboard.todayEggs')}</p>
              <p className="text-base font-bold text-stone-800 dark:text-amber-50">
                {stats ? `${formatNumber(stats.todayItems)}` : '—'}
              </p>
            </div>
          </div>
          {todayVsYesterday && (
            <p className="text-xs text-stone-500 dark:text-amber-100/50 mt-2">
              {t('dashboard.vsYesterday')}: {todayVsYesterday.up ? '↑' : '↓'} {Math.abs(todayVsYesterday.pct).toFixed(1)}%
            </p>
          )}
        </motion.section>

        {/* Business Health */}
        {stats && todayVsYesterday && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
            className="glass-strong rounded-3xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-stone-800 dark:text-amber-50">{t('dashboard.businessHealth')}</h3>
              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                stats.todayProfit < 0 ? 'glass-danger text-white' :
                todayVsYesterday.up ? 'glass-success text-white' : 'glass text-stone-700 dark:text-amber-100'
              }`}>
                {stats.todayProfit < 0 ? t('dashboard.worstDay') :
                 todayVsYesterday.up ? t('dashboard.goodDay') : t('dashboard.slowDay')}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-2xl p-3">
                <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('dashboard.vsYesterday')}</p>
                <p className={`text-lg font-bold ${todayVsYesterday.up ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {todayVsYesterday.up ? '↑' : '↓'} {formatCurrency(Math.abs(todayVsYesterday.diff), currency)}
                </p>
                <p className="text-[10px] text-stone-500 dark:text-amber-100/50 mt-0.5">
                  {Math.abs(todayVsYesterday.pct).toFixed(1)}%
                </p>
              </div>
              <div className="glass rounded-2xl p-3">
                <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('dashboard.vsLastMonth')}</p>
                <p className={`text-lg font-bold ${monthVsLastMonth?.up ? 'text-green-700 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  {monthVsLastMonth ? `${monthVsLastMonth.up ? '↑' : '↓'} ${formatCurrency(Math.abs(monthVsLastMonth.diff), currency)}` : '—'}
                </p>
                <p className="text-[10px] text-stone-500 dark:text-amber-100/50 mt-0.5">
                  {monthVsLastMonth ? `${Math.abs(monthVsLastMonth.pct).toFixed(1)}%` : ''}
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {/* Stock Alerts */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-strong rounded-3xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl glass-danger flex items-center justify-center text-white">
                <AlertTriangle size={16} />
              </div>
              <div>
                <h3 className="font-bold text-stone-800 dark:text-amber-50">{t('dashboard.todayStockAlerts')}</h3>
                <p className="text-xs text-stone-500 dark:text-amber-100/60">
                  {stats ? `${stats.outOfStockCount} ${t('inventory.outOfStockCount')} · ${stats.lowStockCount} ${t('inventory.lowStockCount')}` : ''}
                </p>
              </div>
            </div>
            <button
              onClick={onOpenInventory}
              className="text-xs text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-0.5"
            >
              {t('dashboard.seeAll')} <ChevronRight size={12} />
            </button>
          </div>
          {stats && stats.lowStockProducts.length > 0 ? (
            <div className="space-y-1.5 max-h-44 overflow-y-auto scroll-area">
              {stats.lowStockProducts.slice(0, 6).map((p) => (
                <div key={p.id} className="glass rounded-xl p-2.5 flex items-center justify-between">
                  <p className="text-sm font-semibold text-stone-800 dark:text-amber-50 truncate">{p.name}</p>
                  <span className={`text-xs font-bold ${p.qty === 0 ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'}`}>
                    {formatNumber(p.qty)} / {formatNumber(p.threshold)}
                  </span>
                </div>
              ))}
              {stats.lowStockProducts.length > 6 && (
                <p className="text-xs text-stone-500 dark:text-amber-100/50 text-center pt-1">
                  +{stats.lowStockProducts.length - 6} more
                </p>
              )}
            </div>
          ) : (
            <p className="text-sm text-stone-500 dark:text-amber-100/60 text-center py-3">
              {t('dashboard.noStockAlerts')}
            </p>
          )}
        </motion.section>

        {/* Top Selling Product */}
        {stats && stats.topProduct && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
            className="glass-strong rounded-3xl p-5"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl glass-success flex items-center justify-center text-white">
                <Crown size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-stone-500 dark:text-amber-100/60">{t('dashboard.topSellingProduct')}</p>
                <p className="font-bold text-stone-800 dark:text-amber-50 truncate">{stats.topProduct.name}</p>
                <p className="text-xs text-stone-600 dark:text-amber-100/70">
                  {formatNumber(stats.topProduct.qty)} {t('dashboard.units')} · {formatCurrency(stats.topProduct.profit, currency)}
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {/* Monthly Comparison */}
        {monthVsLastMonth && (
          <motion.section
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.14 }}
            className="glass-strong rounded-3xl p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-bold text-stone-800 dark:text-amber-50">{t('dashboard.monthlyComparison')}</h3>
                <p className="text-xs text-stone-500 dark:text-amber-100/60">{monthLabel}</p>
              </div>
              <div className={`px-2.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${
                monthVsLastMonth.up ? 'glass-success text-white' : 'glass-danger text-white'
              }`}>
                {monthVsLastMonth.up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                {Math.abs(monthVsLastMonth.pct).toFixed(1)}%
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="glass rounded-2xl p-3">
                <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('dashboard.thisMonth')}</p>
                <p className="text-base font-bold text-stone-800 dark:text-amber-50">
                  {stats ? formatCurrency(stats.monthProfit, currency) : '—'}
                </p>
              </div>
              <div className="glass rounded-2xl p-3">
                <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('dashboard.lastMonth')}</p>
                <p className="text-base font-bold text-stone-500 dark:text-amber-100/60">
                  {stats ? formatCurrency(stats.lastMonthProfit, currency) : '—'}
                </p>
              </div>
            </div>
          </motion.section>
        )}

        {/* Last 7 days chart */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.16 }}
          className="glass-strong rounded-3xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-bold text-stone-800 dark:text-amber-50">{t('trend.monthlyProfit')}</h3>
              <p className="text-xs text-stone-500 dark:text-amber-100/60">{t('dashboard.last5ProfitSub')}</p>
            </div>
            <button
              onClick={onSeeAllReports}
              className="text-xs text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-0.5"
            >
              {t('dashboard.seeAll')} <ChevronRight size={12} />
            </button>
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

        {/* Quick links */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid grid-cols-2 gap-3"
        >
          <button
            onClick={onOpenInventory}
            className="glass-strong rounded-3xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-11 h-11 rounded-2xl glass-primary flex items-center justify-center text-white">
              <Package size={18} />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="font-bold text-sm text-stone-800 dark:text-amber-50">{t('inventory.title')}</p>
              <p className="text-xs text-stone-600 dark:text-amber-100/70 truncate">{t('inventory.sub')}</p>
            </div>
            <ChevronRight size={16} className="text-stone-400 dark:text-amber-100/40" />
          </button>
          <button
            onClick={onOpenExpenses}
            className="glass-strong rounded-3xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-11 h-11 rounded-2xl glass-info flex items-center justify-center text-white">
              <ShoppingBag size={18} />
            </div>
            <div className="text-left flex-1 min-w-0">
              <p className="font-bold text-sm text-stone-800 dark:text-amber-50">{t('expense.title')}</p>
              <p className="text-xs text-stone-600 dark:text-amber-100/70 truncate">{t('expense.sub')}</p>
            </div>
            <ChevronRight size={16} className="text-stone-400 dark:text-amber-100/40" />
          </button>
        </motion.section>
      </main>
    </div>
  );
}

function BigStat({ icon, label, value, variant, sublabel, fullWidth }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  variant: 'primary' | 'success' | 'info' | 'muted' | 'danger';
  sublabel?: string;
  fullWidth?: boolean;
}) {
  const colorMap = {
    primary: 'glass-primary',
    success: 'glass-success',
    info: 'glass-info',
    muted: 'glass text-stone-800 dark:text-amber-50',
    danger: 'glass-danger',
  };
  return (
    <div className={`${colorMap[variant]} rounded-3xl p-4 ${fullWidth ? 'col-span-2' : ''}`}>
      <div className="flex items-center gap-1.5 mb-1.5 opacity-90">
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-xl font-bold leading-tight">{value}</p>
      {sublabel && <p className="text-[10px] opacity-80 mt-1 truncate">{sublabel}</p>}
    </div>
  );
}
