'use client';

import { useEffect, useState, useCallback } from 'react';
import { ToastProvider } from '@/components/toast-provider';
import { SetupWizard } from '@/components/setup-wizard';
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

type View =
  | 'dashboard' | 'sales' | 'reports' | 'monthly' | 'pdf' | 'backup'
  | 'settings' | 'credit' | 'suppliers' | 'supplier-profile' | 'inventory'
  | 'edit-history' | 'expenses';

type Route = { view: View; date?: string; supplierId?: string | null };

const DEFAULT_ROUTE: Route = { view: 'dashboard' };

/** Parse the URL hash into a Route. Supports:
 *    #/dashboard
 *    #/sales
 *    #/sales/2026-01-15
 *    #/suppliers
 *    #/supplier/<id>
 *    #/inventory
 *    #/credit
 *    #/expenses
 *    #/reports
 *    #/monthly
 *    #/pdf
 *    #/backup
 *    #/settings
 *    #/edit-history
 */
function parseHash(): Route {
  if (typeof window === 'undefined') return DEFAULT_ROUTE;
  const raw = window.location.hash.replace(/^#\/?/, '');
  if (!raw) return DEFAULT_ROUTE;
  const parts = raw.split('/').filter(Boolean);
  const [head, a, b] = parts;
  switch (head) {
    case 'dashboard': return { view: 'dashboard' };
    case 'sales':
    case 'calculator': {
      if (a) return { view: 'sales', date: a };
      return { view: 'sales' };
    }
    case 'suppliers': return { view: 'suppliers' };
    case 'supplier':
    case 'supplier-profile':
      if (a) return { view: 'supplier-profile', supplierId: a };
      return { view: 'suppliers' };
    case 'inventory': return { view: 'inventory' };
    case 'credit': return { view: 'credit' };
    case 'expenses': return { view: 'expenses' };
    case 'reports':
    case 'reports-daily':
    case 'daily-reports': return { view: 'reports' };
    case 'monthly':
    case 'reports-monthly':
    case 'monthly-reports': return { view: 'monthly' };
    case 'pdf': return { view: 'pdf' };
    case 'backup': return { view: 'backup' };
    case 'settings': return { view: 'settings' };
    case 'edit-history': return { view: 'edit-history' };
    default: return DEFAULT_ROUTE;
  }
}

function routeToHash(route: Route): string {
  const { view, date, supplierId } = route;
  switch (view) {
    case 'sales': return date ? `#/sales/${date}` : '#/sales';
    case 'supplier-profile': return supplierId ? `#/supplier/${supplierId}` : '#/suppliers';
    default: return `#/${view}`;
  }
}

function AppInner() {
  const { settings, loading, update, refresh } = useSettings();
  const { t } = useI18n();
  const { active: activeCredits } = useCredits();
  const { refresh: refreshInventory } = useInventory();
  const [route, setRoute] = useState<Route>(DEFAULT_ROUTE);
  const [showSetup, setShowSetup] = useState(false);
  const [showMissedDays, setShowMissedDays] = useState(false);
  const [showMonthEndReminder, setShowMonthEndReminder] = useState(false);
  const [monthEndMonth, setMonthEndMonth] = useState<string>('');
  const [missedChecked, setMissedChecked] = useState(false);

  const view: View = route.view;
  const activeDate = route.date || todayStr();
  const activeSupplierId = route.supplierId || null;

  // Sync theme to <html>
  useThemeSync();

  // Register service worker
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {/* ignore */});
    }
  }, []);

  // -------- URL routing --------
  // On mount, parse the current hash and set the route.
  useEffect(() => {
    setRoute(parseHash());
    const onPop = () => setRoute(parseHash());
    window.addEventListener('popstate', onPop);
    window.addEventListener('hashchange', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      window.removeEventListener('hashchange', onPop);
    };
  }, []);

  // navigate pushes a new history entry and updates the route state.
  const navigate = useCallback((next: Route) => {
    const hash = routeToHash(next);
    if (typeof window !== 'undefined') {
      const currentHash = window.location.hash;
      if (currentHash === hash) {
        // already there — just update state
        setRoute(next);
      } else {
        window.history.pushState(null, '', hash);
        setRoute(next);
        // Scroll to top on navigation
        window.scrollTo({ top: 0, behavior: 'auto' });
      }
    } else {
      setRoute(next);
    }
  }, []);

  // First-time setup
  useEffect(() => {
    if (loading) return;
    if (!settings?.tutorialDone) {
      setShowSetup(true);
    }
  }, [loading, settings]);

  // Check for missed days (after setup complete)
  useEffect(() => {
    if (loading || !settings?.tutorialDone) return;
    if (missedChecked) return;
    (async () => {
      const missed = await detectMissedDays();
      if (missed.length > 0) {
        setShowMissedDays(true);
      }
      setMissedChecked(true);
    })();
  }, [loading, settings?.tutorialDone, missedChecked]);

  // Month-end reminder
  useEffect(() => {
    if (loading || !settings?.tutorialDone) return;
    const today = new Date();
    const todayMonth = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
    if (settings.lastMonthEndPrompted === todayMonth) return;
    const prevDate = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const prevMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;
    const installDate = settings.installDate;
    if (!installDate) return;
    const thisMonthStart = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-01`;
    if (installDate >= thisMonthStart) return;
    setMonthEndMonth(prevMonth);
    setShowMonthEndReminder(true);
    saveSettings({ lastMonthEndPrompted: todayMonth });
  }, [loading, settings?.tutorialDone, settings?.lastMonthEndPrompted, settings?.installDate]);

  // Auto-backup on first app-open of the day
  useEffect(() => {
    if (loading || !settings?.tutorialDone) return;
    if (!settings.autoBackupEnabled) return;
    const today = todayStr();
    // Use dailyPriceDoneDate as a proxy for "has the app been opened today"
    // — but only run auto-backup once per day per session.
    if ((settings as any)._lastAutoBackup === today) return;
    (async () => {
      try {
        const { saveAutoBackup } = await import('@/lib/db');
        await saveAutoBackup();
        await saveSettings({ ...(settings as any), _lastAutoBackup: today } as any);
      } catch (e) {
        // ignore — auto-backup is best-effort
      }
    })();
  }, [loading, settings?.tutorialDone, settings?.autoBackupEnabled]);

  const handleSetupComplete = useCallback(() => {
    setShowSetup(false);
    refresh();
  }, [refresh]);

  const handleShowTutorial = useCallback(async () => {
    await saveSettings({ tutorialDone: false });
    navigate({ view: 'dashboard' });
    setShowSetup(true);
  }, [navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center app-body">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-3xl overflow-hidden shadow-xl">
            <img src="/icons/icon-1024.png" alt="Shop Manager" className="w-full h-full object-cover" />
          </div>
          <div className="w-8 h-8 border-3 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-stone-600 dark:text-amber-100/70 mt-3">Loading…</p>
        </div>
      </div>
    );
  }

  if (showSetup) {
    return <SetupWizard onComplete={handleSetupComplete} />;
  }

  const currency = settings?.currency || 'LKR';
  const shopName = settings?.shopName || '';
  const ownerName = settings?.ownerName || '';
  const shopType = settings?.shopType || '';

  // Bottom nav active state
  const navActive: NavView =
    view === 'sales' ? 'today'
    : view === 'credit' ? 'credit'
    : view === 'suppliers' || view === 'supplier-profile' ? 'suppliers'
    : view === 'expenses' ? 'expenses'
    : view === 'reports' || view === 'monthly' || view === 'pdf' ? 'reports'
    : 'dashboard';

  const handleNavChange = (v: NavView) => {
    if (v === 'today') {
      navigate({ view: 'sales', date: todayStr() });
    } else if (v === 'credit') {
      navigate({ view: 'credit' });
    } else if (v === 'reports') {
      navigate({ view: 'reports' });
    } else if (v === 'suppliers') {
      navigate({ view: 'suppliers' });
    } else if (v === 'expenses') {
      navigate({ view: 'expenses' });
    } else {
      navigate({ view: 'dashboard' });
    }
  };

  const showBottomNav = !showSetup;

  // Wrap each view with footer
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
          onSeeAllReports={() => navigate({ view: 'reports' })}
          onSeeMonthlyReports={() => navigate({ view: 'monthly' })}
          onRecentClick={(date) => navigate({ view: 'sales', date })}
          shopName={shopName}
          ownerName={ownerName}
          shopType={shopType}
          onOpenSettings={() => navigate({ view: 'settings' })}
          onOpenInventory={() => navigate({ view: 'inventory' })}
          onOpenSuppliers={() => navigate({ view: 'suppliers' })}
          onOpenCredit={() => navigate({ view: 'credit' })}
          onOpenExpenses={() => navigate({ view: 'expenses' })}
        />
      )}

      {view === 'sales' && wrapWithFooter(
        <ProfitCalculatorScreen
          date={activeDate}
          onBack={() => { navigate({ view: 'dashboard' }); }}
        />
      )}

      {view === 'reports' && wrapWithFooter(
        <DailyReportsScreen
          currency={currency}
          onBack={() => navigate({ view: 'dashboard' })}
          onEditDay={(date) => navigate({ view: 'sales', date })}
          onOpenPdf={() => navigate({ view: 'pdf' })}
          onOpenMonthly={() => navigate({ view: 'monthly' })}
        />
      )}

      {view === 'monthly' && wrapWithFooter(
        <MonthlyReportsScreen
          currency={currency}
          onBack={() => navigate({ view: 'dashboard' })}
          onOpenDaily={() => navigate({ view: 'reports' })}
          onOpenPdf={() => navigate({ view: 'pdf' })}
        />
      )}

      {view === 'pdf' && wrapWithFooter(
        <PdfReportScreen
          settings={{ shopName, ownerName, currency }}
          onBack={() => navigate({ view: 'reports' })}
        />
      )}

      {view === 'backup' && wrapWithFooter(
        <BackupScreen
          settings={{ shopName, ownerName, currency, lastBackupAt: settings?.lastBackupAt || null }}
          onBack={() => navigate({ view: 'settings' })}
          onChanged={refresh}
        />
      )}

      {view === 'settings' && settings && wrapWithFooter(
        <SettingsScreen
          settings={settings}
          onBack={() => navigate({ view: 'dashboard' })}
          onChanged={refresh}
          onShowTutorial={handleShowTutorial}
          onOpenBackup={() => navigate({ view: 'backup' })}
          onOpenEditHistory={() => navigate({ view: 'edit-history' })}
        />
      )}

      {view === 'credit' && wrapWithFooter(
        <CreditScreen
          onBack={() => navigate({ view: 'dashboard' })}
          currency={currency}
        />
      )}

      {view === 'suppliers' && wrapWithFooter(
        <SuppliersScreen
          onBack={() => navigate({ view: 'dashboard' })}
          onOpenSupplier={(id) => navigate({ view: 'supplier-profile', supplierId: id })}
        />
      )}

      {view === 'supplier-profile' && activeSupplierId && wrapWithFooter(
        <SupplierProfileScreen
          supplierId={activeSupplierId}
          onBack={() => navigate({ view: 'suppliers' })}
          currency={currency}
        />
      )}

      {view === 'inventory' && wrapWithFooter(
        <InventoryScreen
          onBack={() => navigate({ view: 'dashboard' })}
        />
      )}

      {view === 'expenses' && wrapWithFooter(
        <ExpenseScreen
          onBack={() => navigate({ view: 'dashboard' })}
          currency={currency}
        />
      )}

      {view === 'edit-history' && wrapWithFooter(
        <EditHistoryScreen
          onBack={() => navigate({ view: 'settings' })}
        />
      )}

      {/* Missed days modal */}
      <MissedDaysModal
        open={showMissedDays}
        onClose={() => setShowMissedDays(false)}
        onBackfill={(date) => {
          navigate({ view: 'sales', date });
        }}
      />

      {/* Month-end reminder modal */}
      <MonthEndReminderModal
        open={showMonthEndReminder}
        month={monthEndMonth}
        onViewReport={() => {
          setShowMonthEndReminder(false);
          navigate({ view: 'monthly' });
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
