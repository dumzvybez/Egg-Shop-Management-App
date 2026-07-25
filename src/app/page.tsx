'use client';

import { useEffect, useState, useCallback } from 'react';
import { ToastProvider } from '@/components/toast-provider';
import { SetupWizard } from '@/components/setup-wizard';
import { DailyPriceEntryModal } from '@/components/daily-price-entry-modal';
import { MissedDaysModal } from '@/components/missed-days-modal';
import { MonthEndReminderModal } from '@/components/month-end-reminder-modal';
import { Dashboard } from '@/components/dashboard';
import { ProfitCalculatorScreen } from '@/components/profit-calculator-screen';
import { DailyReportsScreen } from '@/components/daily-reports-screen';
import { MonthlyReportsScreen } from '@/components/monthly-reports-screen';
import { PdfReportScreen } from '@/components/pdf-report-screen';
import { BackupScreen } from '@/components/backup-screen';
import { SettingsScreen } from '@/components/settings-screen';
import { CreditScreen } from '@/components/credit-screen';
import { SuppliersScreen } from '@/components/suppliers-screen';
import { SupplierProfileScreen } from '@/components/supplier-profile-screen';
import { InventoryScreen } from '@/components/inventory-screen';
import { EditHistoryScreen } from '@/components/edit-history-screen';
import { ExpenseScreen } from '@/components/expense-screen';
import { BottomNav, type NavView } from '@/components/bottom-nav';
import { Footer } from '@/components/footer';
import {
  useSettings, useCredits, useI18n, useThemeSync, useInventory,
  detectMissedDays, saveSettings, todayStr,
} from '@/lib/data-hooks-adapter';
import { I18nProvider } from '@/lib/i18n-context';

type View = 'dashboard' | 'calculator' | 'reports' | 'monthly' | 'pdf' | 'backup' | 'settings' | 'credit' | 'suppliers' | 'supplier-profile' | 'inventory' | 'edit-history' | 'expenses';

function AppInner() {
  const { settings, loading, update, refresh } = useSettings();
  const { t, lang } = useI18n();
  const { active: activeCredits } = useCredits();
  const { refresh: refreshInventory } = useInventory();
  const [view, setView] = useState<View>('dashboard');
  const [showSetup, setShowSetup] = useState(false);
  const [showPriceModal, setShowPriceModal] = useState(false);
  const [showMissedDays, setShowMissedDays] = useState(false);
  const [showMonthEndReminder, setShowMonthEndReminder] = useState(false);
  const [monthEndMonth, setMonthEndMonth] = useState<string>('');
  const [priceModalDate, setPriceModalDate] = useState<string>(todayStr());
  const [missedChecked, setMissedChecked] = useState(false);
  const [activeDate, setActiveDate] = useState<string>(todayStr());
  const [activeSupplierId, setActiveSupplierId] = useState<string | null>(null);

  // Sync theme + language to <html> + localStorage
  useThemeSync();

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {/* ignore */});
    }
  }, []);

  // First-time setup
  useEffect(() => {
    if (loading) return;
    if (!settings?.tutorialDone) {
      setShowSetup(true);
    }
  }, [loading, settings]);

  // Check for daily price entry on app open
  useEffect(() => {
    if (loading || !settings?.tutorialDone) return;
    const today = todayStr();
    setActiveDate(today);
    if (settings.dailyPriceDoneDate !== today) {
      setPriceModalDate(today);
      const timer = setTimeout(() => setShowPriceModal(true), 600);
      return () => clearTimeout(timer);
    }
  }, [loading, settings?.tutorialDone, settings?.dailyPriceDoneDate]);

  // Check for missed days (after price modal is dismissed or if today already done)
  useEffect(() => {
    if (loading || !settings?.tutorialDone) return;
    if (missedChecked) return;
    if (showPriceModal) return;
    (async () => {
      const missed = await detectMissedDays();
      if (missed.length > 0) {
        setShowMissedDays(true);
      }
      setMissedChecked(true);
    })();
  }, [loading, settings?.tutorialDone, missedChecked, showPriceModal]);

  // Month-end reminder: on first app opening after the last day of a month,
  // prompt the user to view the previous month's report. Only shows once per
  // month (tracked via settings.lastMonthEndPrompted).
  useEffect(() => {
    if (loading || !settings?.tutorialDone) return;
    const today = new Date();
    const todayMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    // If we already prompted for the current month, skip.
    if (settings.lastMonthEndPrompted === todayMonth) return;
    // Determine the previous month
    const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    // Only show if the user has been using the app long enough to have data
    // from the previous month (i.e., install date is before the start of this month).
    const installDate = settings.installDate;
    if (!installDate) return;
    const thisMonthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    if (installDate >= thisMonthStart) return; // installed this month — no prev month to report
    // Show the reminder
    setMonthEndMonth(prevMonth);
    setShowMonthEndReminder(true);
    // Mark as prompted so it doesn't show again this month
    saveSettings({ lastMonthEndPrompted: todayMonth });
  }, [loading, settings?.tutorialDone, settings?.lastMonthEndPrompted, settings?.installDate]);

  const handlePriceSaved = useCallback(async () => {
    await update({ dailyPriceDoneDate: todayStr() });
    setTimeout(async () => {
      const missed = await detectMissedDays();
      if (missed.length > 0) setShowMissedDays(true);
    }, 200);
  }, [update]);

  const handleSetupComplete = useCallback(() => {
    setShowSetup(false);
    refresh();
  }, [refresh]);

  const handleShowTutorial = useCallback(async () => {
    await saveSettings({ tutorialDone: false });
    setView('dashboard');
    setShowSetup(true);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center app-body">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-3xl overflow-hidden shadow-xl">
            <img src="/icons/icon-1024.png" alt="EggShop" className="w-full h-full object-cover" />
          </div>
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-stone-600 dark:text-amber-100/70 mt-3">{lang === 'si' ? 'පූරණය වෙමින්...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (showSetup) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  const currency = settings?.currency || 'රු.';
  const shopName = settings?.shopName || '';
  const ownerName = settings?.ownerName || '';

  // Bottom nav active state
  const navActive: NavView = view === 'calculator' ? 'today'
    : view === 'credit' ? 'credit'
    : view === 'suppliers' || view === 'supplier-profile' ? 'suppliers'
    : view === 'expenses' ? 'expenses'
    : view === 'reports' || view === 'monthly' || view === 'pdf' ? 'reports'
    : 'dashboard';

  const handleNavChange = (v: NavView) => {
    if (v === 'today') {
      setActiveDate(todayStr());
      setView('calculator');
    } else if (v === 'price') {
      setPriceModalDate(todayStr());
      setShowPriceModal(true);
    } else if (v === 'credit') {
      setView('credit');
    } else if (v === 'reports') {
      setView('reports');
    } else if (v === 'suppliers') {
      setView('suppliers');
    } else if (v === 'expenses') {
      setView('expenses');
    } else {
      setView('dashboard');
    }
  };

  const showBottomNav = !showSetup;

  // Wrap each view with footer (footer only on main screens — not full-screen modals)
  const wrapWithFooter = (content: React.ReactNode) => (
    <>
      {content}
      <Footer />
    </>
  );

  return (
    <>
      {view === 'dashboard' && wrapWithFooter(
        <Dashboard
          date={activeDate}
          currency={currency}
          onSeeAllReports={() => setView('reports')}
          onSeeMonthlyReports={() => setView('monthly')}
          onRecentClick={(date) => { setActiveDate(date); setView('calculator'); }}
          shopName={shopName}
          ownerName={ownerName}
          onOpenSettings={() => setView('settings')}
          onOpenInventory={() => setView('inventory')}
          onOpenSuppliers={() => setView('suppliers')}
          onOpenCredit={() => setView('credit')}
          onChangePrice={() => {
            setPriceModalDate(todayStr());
            setShowPriceModal(true);
          }}
        />
      )}

      {view === 'calculator' && wrapWithFooter(
        <ProfitCalculatorScreen
          date={activeDate}
          onBack={() => { setView('dashboard'); setActiveDate(todayStr()); }}
        />
      )}

      {view === 'reports' && wrapWithFooter(
        <DailyReportsScreen
          currency={currency}
          onBack={() => setView('dashboard')}
          onEditDay={(date) => { setActiveDate(date); setView('calculator'); }}
          onOpenPdf={() => setView('pdf')}
          onOpenMonthly={() => setView('monthly')}
        />
      )}

      {view === 'monthly' && wrapWithFooter(
        <MonthlyReportsScreen
          currency={currency}
          onBack={() => setView('dashboard')}
          onOpenDaily={() => setView('reports')}
          onOpenPdf={() => setView('pdf')}
        />
      )}

      {view === 'pdf' && wrapWithFooter(
        <PdfReportScreen
          settings={{ shopName, ownerName, currency }}
          onBack={() => setView('reports')}
        />
      )}

      {view === 'backup' && wrapWithFooter(
        <BackupScreen
          settings={{ shopName, ownerName, currency, lastBackupAt: settings?.lastBackupAt || null }}
          onBack={() => setView('settings')}
          onChanged={refresh}
        />
      )}

      {view === 'settings' && settings && wrapWithFooter(
        <SettingsScreen
          settings={settings}
          onBack={() => setView('dashboard')}
          onChanged={refresh}
          onShowTutorial={handleShowTutorial}
          onOpenBackup={() => setView('backup')}
          onOpenEditHistory={() => setView('edit-history')}
        />
      )}

      {view === 'credit' && wrapWithFooter(
        <CreditScreen
          onBack={() => setView('dashboard')}
          currency={currency}
        />
      )}

      {view === 'suppliers' && wrapWithFooter(
        <SuppliersScreen
          onBack={() => setView('dashboard')}
          onOpenSupplier={(id) => { setActiveSupplierId(id); setView('supplier-profile'); }}
        />
      )}

      {view === 'supplier-profile' && activeSupplierId && wrapWithFooter(
        <SupplierProfileScreen
          supplierId={activeSupplierId}
          onBack={() => setView('suppliers')}
          currency={currency}
        />
      )}

      {view === 'inventory' && wrapWithFooter(
        <InventoryScreen
          onBack={() => setView('dashboard')}
        />
      )}

      {view === 'expenses' && wrapWithFooter(
        <ExpenseScreen
          onBack={() => setView('dashboard')}
          currency={currency}
        />
      )}

      {view === 'edit-history' && wrapWithFooter(
        <EditHistoryScreen
          onBack={() => setView('settings')}
        />
      )}

      {/* Daily price modal */}
      <DailyPriceEntryModal
        open={showPriceModal}
        date={priceModalDate}
        onClose={() => setShowPriceModal(false)}
        onSaved={handlePriceSaved}
      />

      {/* Missed days modal */}
      <MissedDaysModal
        open={showMissedDays}
        onClose={() => setShowMissedDays(false)}
        onBackfill={(date) => {
          setActiveDate(date);
          setPriceModalDate(date);
          setShowPriceModal(true);
        }}
      />

      {/* Month-end reminder modal */}
      <MonthEndReminderModal
        open={showMonthEndReminder}
        month={monthEndMonth}
        onViewReport={() => {
          setShowMonthEndReminder(false);
          setView('monthly');
        }}
        onClose={() => setShowMonthEndReminder(false)}
      />

      {/* Bottom navigation */}
      {showBottomNav && (
        <BottomNav
          active={navActive}
          onChange={handleNavChange}
          creditBadge={activeCredits.length}
        />
      )}
    </>
  );
}

export default function Home() {
  return (
    <I18nProvider>
      <ToastProvider>
        <AppInner />
      </ToastProvider>
    </I18nProvider>
  );
}
