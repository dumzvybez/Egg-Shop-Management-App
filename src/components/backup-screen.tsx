'use client';

import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, Upload, AlertTriangle, Check, Clock, RefreshCw, DatabaseBackup, Trash2 } from 'lucide-react';
import {
  exportBackup, importBackup, saveSettings, useI18n,
  saveAutoBackup, listAutoBackups, restoreAutoBackup, deleteAutoBackup,
} from '@/lib/data-hooks-adapter';
import { useAppToast } from './toast-provider';
import { getSalesForDateRange, getDayRecordsForRange, getPriceSessionsForDateRange, getActiveCredits } from '@/lib/db';
import { formatDate } from '@/lib/sinhala';

type Props = {
  onBack: () => void;
  settings: { shopName: string; ownerName: string; currency: string; lastBackupAt: number | null };
  onChanged: () => void;
};

export function BackupScreen({ onBack, settings, onChanged }: Props) {
  const { t, lang } = useI18n();
  const { toast } = useAppToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<{ sales: number; days: number; sessions: number; credits: number } | null>(null);
  const [autoBackups, setAutoBackups] = useState<{ id: string; at: number }[]>([]);

  const refreshStats = async () => {
    const [allSales, allDays, allSessions, allCredits, allBackups] = await Promise.all([
      getSalesForDateRange('1900-01-01', '2999-12-31'),
      getDayRecordsForRange('1900-01-01', '2999-12-31'),
      getPriceSessionsForDateRange('1900-01-01', '2999-12-31'),
      getActiveCredits(),
      listAutoBackups(),
    ]);
    setStats({
      sales: allSales.length,
      days: allDays.length,
      sessions: allSessions.length,
      credits: allCredits.length,
    });
    setAutoBackups(allBackups);
  };

  useEffect(() => { refreshStats(); }, []);

  const handleExport = async () => {
    setBusy(true);
    try {
      const json = await exportBackup();
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `shop-manager-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      await saveSettings({ lastBackupAt: Date.now() });
      await refreshStats();
      onChanged();
      toast({ title: t('backup.exportToast.title'), description: t('backup.exportToast.desc'), variant: 'success' });

      const file = new File([blob], a.download, { type: 'application/json' });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: 'Shop Manager Backup', text: t('backup.title') });
        } catch { /* cancelled */ }
      }
    } catch (e: any) {
      toast({ title: t('toast.error'), description: e?.message, variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleCreateAutoBackup = async () => {
    setBusy(true);
    try {
      await saveAutoBackup();
      await refreshStats();
      toast({ title: t('backup.exportToast.title'), variant: 'success' });
    } catch (e: any) {
      toast({ title: t('toast.error'), description: e?.message, variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleRestoreAuto = async (id: string) => {
    if (!confirm(t('backup.importConfirm'))) return;
    setBusy(true);
    try {
      await restoreAutoBackup(id);
      await refreshStats();
      onChanged();
      toast({ title: t('backup.importToast.title'), description: t('backup.importToast.desc'), variant: 'success' });
    } catch (e: any) {
      toast({ title: t('backup.importFailed.title'), description: e?.message, variant: 'error' });
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteAuto = async (id: string) => {
    await deleteAutoBackup(id);
    await refreshStats();
    toast({ title: t('toast.saved'), variant: 'success' });
  };

  const handleImport = async (file: File) => {
    if (!confirm(t('backup.importConfirm'))) return;
    setBusy(true);
    try {
      const text = await file.text();
      await importBackup(text);
      await refreshStats();
      onChanged();
      toast({ title: t('backup.importToast.title'), description: t('backup.importToast.desc'), variant: 'success' });
    } catch (e: any) {
      toast({ title: t('backup.importFailed.title'), description: e?.message || t('backup.importFailed.desc'), variant: 'error' });
    } finally {
      setBusy(false);
    }
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
            <h1 className="text-lg font-bold text-stone-800 dark:text-amber-50">{t('backup.title')}</h1>
            <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('backup.sub')}</p>
          </div>
          <button
            onClick={refreshStats}
            className="w-10 h-10 rounded-full glass flex items-center justify-center text-stone-700 dark:text-amber-50 active:scale-90 transition-transform"
            aria-label={t('backup.refresh')}
          >
            <RefreshCw size={16} />
          </button>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
        {/* Data status */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl p-5"
        >
          <h2 className="font-bold text-stone-800 dark:text-amber-50 mb-3">{t('backup.dataStatus')}</h2>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 text-center">
            <div className="glass rounded-xl py-3 px-2">
              <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats?.days ?? '—'}</p>
              <p className="text-[10px] text-stone-600 dark:text-amber-100/70">{t('backup.dayRecords')}</p>
            </div>
            <div className="glass rounded-xl py-3 px-2">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats?.sales ?? '—'}</p>
              <p className="text-[10px] text-stone-600 dark:text-amber-100/70">{t('backup.sales')}</p>
            </div>
            <div className="glass rounded-xl py-3 px-2">
              <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{stats?.sessions ?? '—'}</p>
              <p className="text-[10px] text-stone-600 dark:text-amber-100/70">{t('backup.priceSessions')}</p>
            </div>
            <div className="glass rounded-xl py-3 px-2">
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats?.credits ?? '—'}</p>
              <p className="text-[10px] text-stone-600 dark:text-amber-100/70">{t('credit.activeCount')}</p>
            </div>
          </div>
          {settings.lastBackupAt && (
            <div className="mt-3 glass rounded-xl p-2.5 flex items-center gap-2 text-xs text-stone-600 dark:text-amber-100/70">
              <Clock size={12} />
              {t('backup.lastBackup')}: {new Date(settings.lastBackupAt).toLocaleString('en-US')}
            </div>
          )}
        </motion.section>

        {/* Export */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-strong rounded-3xl p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl glass-success flex items-center justify-center text-white">
              <Download size={22} />
            </div>
            <div>
              <h2 className="font-bold text-stone-800 dark:text-amber-50">{t('backup.exportTitle')}</h2>
              <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('backup.exportDesc')}</p>
            </div>
          </div>
          <button
            onClick={handleExport}
            disabled={busy}
            className="w-full glass-success rounded-2xl py-3.5 font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
          >
            {busy ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Download size={18} /> {t('backup.exportBtn')}
              </>
            )}
          </button>
          <p className="text-[11px] text-stone-500 dark:text-amber-100/60 mt-2">{t('backup.exportTip')}</p>
        </motion.section>

        {/* Import */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-strong rounded-3xl p-5"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl glass-info flex items-center justify-center text-white">
              <Upload size={22} />
            </div>
            <div>
              <h2 className="font-bold text-stone-800 dark:text-amber-50">{t('backup.importTitle')}</h2>
              <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('backup.importDesc')}</p>
            </div>
          </div>

          <div className="glass rounded-xl p-3 border-amber-300 bg-amber-50/40 dark:bg-amber-900/20 mb-3 flex items-start gap-2">
            <AlertTriangle size={14} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-800 dark:text-amber-200">
              {t('backup.importWarning')}
            </p>
          </div>

          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleImport(f);
              e.target.value = '';
            }}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="w-full glass-info rounded-2xl py-3.5 font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
          >
            {busy ? (
              <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <Upload size={18} /> {t('backup.importBtn')}
              </>
            )}
          </button>
        </motion.section>

        {/* Auto Backups */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="glass-strong rounded-3xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl glass-info flex items-center justify-center text-white">
                <Clock size={16} />
              </div>
              <div>
                <h2 className="font-bold text-stone-800 dark:text-amber-50">{t('backup.autoBackups')}</h2>
                <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('backup.autoBackupsDesc')}</p>
              </div>
            </div>
            <button
              onClick={handleCreateAutoBackup}
              disabled={busy}
              className="glass-info rounded-xl px-3 py-2 text-xs font-bold text-white flex items-center gap-1 active:scale-95 transition-transform disabled:opacity-60"
            >
              <DatabaseBackup size={12} /> {t('common.add')}
            </button>
          </div>
          {autoBackups.length === 0 ? (
            <p className="text-xs text-stone-500 dark:text-amber-100/60 text-center py-4">{t('backup.noAutoBackups')}</p>
          ) : (
            <div className="space-y-1.5">
              {autoBackups.map((b) => (
                <div key={b.id} className="glass rounded-xl p-2.5 flex items-center gap-2">
                  <Clock size={12} className="text-stone-500 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-stone-800 dark:text-amber-50">
                      {new Date(b.at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestoreAuto(b.id)}
                    disabled={busy}
                    className="glass-success rounded-lg px-2.5 py-1 text-[10px] font-bold text-white active:scale-95 transition-transform disabled:opacity-60"
                  >
                    {t('backup.restore')}
                  </button>
                  <button
                    onClick={() => handleDeleteAuto(b.id)}
                    className="glass-danger rounded-lg w-6 h-6 flex items-center justify-center text-white active:scale-90 transition-transform"
                    aria-label={t('common.delete')}
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Info */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass rounded-2xl p-4"
        >
          <div className="flex items-start gap-2">
            <DatabaseBackup size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-xs text-stone-600 dark:text-amber-100/70 space-y-1.5">
              <p className="font-semibold text-stone-700 dark:text-amber-100">{t('backup.about.title')}</p>
              <p>• {t('backup.about.1')}</p>
              <p>• {t('backup.about.2')}</p>
              <p>• {t('backup.about.3')}</p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
