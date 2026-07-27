'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Store, User, Coins, Palette, Save, BookOpen, DatabaseBackup,
  History, Info, ChevronDown, ChevronRight, Github, Globe, Youtube, Lock, Heart,
} from 'lucide-react';
import {
  useI18n, applyThemeAndLang, saveSettings, getEditHistory,
  type Settings, type EditHistoryEntry,
} from '@/lib/data-hooks-adapter';
import { useAppToast } from './toast-provider';

type Props = {
  settings: Settings;
  onBack: () => void;
  onChanged: () => void;
  onShowTutorial: () => void;
  onOpenBackup: () => void;
  onOpenEditHistory: () => void;
};

const THEMES = [
  { id: 'dark' as const, label: 'Dark', icon: '🌙' },
  { id: 'light' as const, label: 'Light', icon: '☀️' },
];

export function SettingsScreen({
  settings, onBack, onChanged, onShowTutorial, onOpenBackup, onOpenEditHistory,
}: Props) {
  const { t } = useI18n();
  const { toast } = useAppToast();
  const [shopName, setShopName] = useState(settings.shopName);
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [shopType, setShopType] = useState(settings.shopType);
  const [currency] = useState(settings.currency || 'LKR');
  const [theme, setTheme] = useState<'dark' | 'light'>(settings.theme);
  const [history, setHistory] = useState<EditHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    getEditHistory(5).then(setHistory);
  }, []);

  useEffect(() => {
    setShopName(settings.shopName);
    setOwnerName(settings.ownerName);
    setShopType(settings.shopType);
    setTheme(settings.theme);
  }, [settings]);

  const handleThemeChange = (th: 'dark' | 'light') => {
    setTheme(th);
    applyThemeAndLang(th, 'en');
    saveSettings({ theme: th });
  };

  const handleSave = async () => {
    await saveSettings({ shopName: shopName.trim(), ownerName: ownerName.trim(), shopType, currency: 'LKR' });
    applyThemeAndLang(theme, 'en');
    toast({ title: t('settings.saved.title'), variant: 'success' });
    onChanged();
  };

  const ACTION_COLORS: Record<string, string> = {
    create: 'bg-green-500',
    update: 'bg-amber-500',
    'mark-paid': 'bg-cyan-500',
    delete: 'bg-red-500',
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
            <h1 className="text-lg font-bold text-stone-800 dark:text-amber-50">{t('settings.title')}</h1>
            <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('settings.sub')}</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
        {/* Business Profile */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl glass-primary flex items-center justify-center text-white">
              <Store size={16} />
            </div>
            <h2 className="font-bold text-stone-800 dark:text-amber-50">{t('settings.shopInfo')}</h2>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-stone-600 dark:text-amber-100/70 mb-1 block flex items-center gap-1">
                <Store size={11} /> {t('settings.shopName')}
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value)}
                placeholder={t('setup.shop.shopName.placeholder')}
                className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 text-stone-800 dark:text-amber-50 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="text-xs text-stone-600 dark:text-amber-100/70 mb-1 block flex items-center gap-1">
                <User size={11} /> {t('settings.ownerName')}
              </label>
              <input
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder={t('setup.shop.owner.placeholder')}
                className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 text-stone-800 dark:text-amber-50 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="text-xs text-stone-600 dark:text-amber-100/70 mb-1 block">
                {t('settings.shopType')}
              </label>
              <input
                type="text"
                value={shopType}
                onChange={(e) => setShopType(e.target.value)}
                placeholder={t('setup.shop.shopType.placeholder')}
                className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 text-stone-800 dark:text-amber-50 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
              />
            </div>
            <div>
              <label className="text-xs text-stone-600 dark:text-amber-100/70 mb-1 block flex items-center gap-1">
                <Coins size={11} /> {t('settings.currency')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button disabled className="py-3 rounded-xl text-sm font-bold glass-primary text-white cursor-default">
                  LKR
                </button>
                <div className="py-3 px-2 rounded-xl glass text-stone-500 dark:text-amber-100/60 text-xs flex items-center justify-center">
                  Locked to LKR
                </div>
              </div>
            </div>
            <div>
              <label className="text-xs text-stone-600 dark:text-amber-100/70 mb-1 block flex items-center gap-1">
                <Palette size={11} /> {t('settings.theme')}
              </label>
              <div className="grid grid-cols-2 gap-2">
                {THEMES.map((th) => (
                  <button
                    key={th.id}
                    onClick={() => handleThemeChange(th.id)}
                    className={`py-3 rounded-xl text-sm font-semibold transition-all ${
                      theme === th.id
                        ? 'glass-primary text-white'
                        : 'glass text-stone-700 dark:text-amber-100'
                    }`}
                  >
                    <span className="mr-1.5">{th.icon}</span>
                    {th.label}
                  </button>
                ))}
              </div>
            </div>
            <button
              onClick={handleSave}
              className="w-full glass-primary rounded-2xl py-3 font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <Save size={16} /> {t('common.save')}
            </button>
          </div>
        </motion.section>

        {/* Tutorial replay */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <button
            onClick={onShowTutorial}
            className="w-full glass-strong rounded-3xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl glass-info flex items-center justify-center text-white">
              <BookOpen size={18} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm text-stone-800 dark:text-amber-50">{t('settings.tutorialReplay')}</p>
              <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('settings.tutorialSub')}</p>
            </div>
            <ChevronRight size={18} className="text-stone-400 dark:text-amber-100/40" />
          </button>
        </motion.section>

        {/* Backup */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={onOpenBackup}
            className="w-full glass-strong rounded-3xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-10 h-10 rounded-xl glass-success flex items-center justify-center text-white">
              <DatabaseBackup size={18} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold text-sm text-stone-800 dark:text-amber-50">{t('settings.backup')}</p>
              <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('settings.backupSub')}</p>
            </div>
            <ChevronRight size={18} className="text-stone-400 dark:text-amber-100/40" />
          </button>
        </motion.section>

        {/* Edit history */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="glass-strong rounded-3xl p-5"
        >
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl glass-info flex items-center justify-center text-white">
                <History size={16} />
              </div>
              <div className="text-left">
                <p className="font-bold text-sm text-stone-800 dark:text-amber-50">{t('settings.editHistory')}</p>
                <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('settings.editHistorySub', { n: history.length })}</p>
              </div>
            </div>
            <ChevronDown size={16} className={`text-stone-400 transition-transform ${showHistory ? 'rotate-180' : ''}`} />
          </button>
          {showHistory && (
            <div className="mt-3 space-y-2">
              {history.length === 0 ? (
                <p className="text-xs text-stone-500 dark:text-amber-100/60 text-center py-3">{t('editHistory.empty')}</p>
              ) : (
                history.map((e) => (
                  <div key={e.id} className="glass rounded-xl p-2.5 flex items-start gap-2">
                    <span className={`w-2 h-2 rounded-full ${ACTION_COLORS[e.action] || 'bg-stone-400'} mt-1.5 flex-shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-stone-800 dark:text-amber-50 truncate">{e.summary}</p>
                      <p className="text-[10px] text-stone-500 dark:text-amber-100/50">
                        {new Date(e.at).toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))
              )}
              <button
                onClick={onOpenEditHistory}
                className="w-full text-xs text-amber-700 dark:text-amber-300 font-semibold py-2"
              >
                {t('editHistory.viewAll')} →
              </button>
            </div>
          )}
        </motion.section>

        {/* About / Developer card */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-strong rounded-3xl p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <div className="w-9 h-9 rounded-xl glass-primary flex items-center justify-center text-white">
              <Info size={16} />
            </div>
            <h2 className="font-bold text-stone-800 dark:text-amber-50">{t('settings.about')}</h2>
          </div>

          {/* Developer card */}
          <div className="glass rounded-2xl p-4 mb-4">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full glass-primary flex items-center justify-center text-white">
                <Heart size={20} />
              </div>
              <div>
                <p className="font-bold text-stone-800 dark:text-amber-50">{t('settings.developerName')}</p>
                <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('settings.developerRole')}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <LinkButton href="https://github.com/dumzvybez" label={t('settings.github')} icon={<Github size={14} />} />
              <LinkButton href="https://dumindu.vercel.app" label={t('settings.portfolio')} icon={<Globe size={14} />} />
              <LinkButton href="https://www.youtube.com/@DuminduWanasinghe" label={t('settings.youtube')} icon={<Youtube size={14} />} />
              <LinkButton href="https://github.com/dumzvybez/Egg-Shop-Management-App" label={t('settings.repository')} icon={<Github size={14} />} />
            </div>
          </div>

          {/* Privacy note */}
          <div className="glass rounded-2xl p-3 flex items-start gap-2 mb-3">
            <Lock size={14} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-stone-600 dark:text-amber-100/70">
              {t('settings.privacyNote')}
            </p>
          </div>

          {/* Version */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-stone-600 dark:text-amber-100/70">{t('settings.about.version')}</span>
            <span className="font-bold text-stone-800 dark:text-amber-50">v3.0.0</span>
          </div>
          <div className="flex items-center justify-between text-xs mt-1">
            <span className="text-stone-600 dark:text-amber-100/70">{t('settings.about.pwa')}</span>
            <span className="font-bold text-green-700 dark:text-green-400">✓ Active</span>
          </div>
        </motion.section>
      </main>
    </div>
  );
}

function LinkButton({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="glass rounded-xl py-2.5 px-2 text-xs font-semibold text-stone-700 dark:text-amber-100 flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
    >
      {icon} {label}
    </a>
  );
}
