'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Store, User, Coins, Bell, BookOpen, History, Info, Save, ChevronRight,
  Sun, Moon, Languages, DatabaseBackup,
} from 'lucide-react';
import {
  saveSettings, getEditHistory, useI18n, applyThemeAndLang,
  type Settings, type EditHistoryEntry,
} from '@/lib/data-hooks-adapter';
import { useAppToast } from './toast-provider';
import { LANGS, LANG_LABELS, type Lang } from '@/lib/i18n';

type Props = {
  onBack: () => void;
  settings: Settings;
  onChanged: () => void;
  onShowTutorial: () => void;
  onOpenBackup: () => void;
  onOpenEditHistory: () => void;
};

export function SettingsScreen({ onBack, settings, onChanged, onShowTutorial, onOpenBackup, onOpenEditHistory }: Props) {
  const { t, lang, setLang } = useI18n();
  const { toast } = useAppToast();
  const [shopName, setShopName] = useState(settings.shopName);
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [currency, setCurrency] = useState(settings.currency);
  const [language, setLanguage] = useState<Lang>(settings.language || 'si');
  const [theme, setTheme] = useState<'light' | 'dark'>(settings.theme || 'dark');
  const [reminderEnabled, setReminderEnabled] = useState(settings.reminderEnabled);
  const [reminderTime, setReminderTime] = useState(settings.reminderTime || '08:00');
  const [history, setHistory] = useState<EditHistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    // Load only latest 5 for inline preview; full list is in the dedicated screen
    getEditHistory(5).then(setHistory);
  }, []);

  // Sync local state if settings prop changes
  useEffect(() => {
    setShopName(settings.shopName);
    setOwnerName(settings.ownerName);
    setCurrency(settings.currency);
    setLanguage(settings.language || 'si');
    setTheme(settings.theme || 'dark');
    setReminderEnabled(settings.reminderEnabled);
    setReminderTime(settings.reminderTime || '08:00');
  }, [settings]);

  const handleSave = async () => {
    await saveSettings({ shopName, ownerName, currency, language, theme });
    applyThemeAndLang(theme, language);
    await setLang(language);
    onChanged();
    toast({ title: t('settings.saved.title'), variant: 'success' });
  };

  const handleLangChange = async (l: Lang) => {
    setLanguage(l);
    await setLang(l);
    applyThemeAndLang(theme, l);
    // Persist immediately so it survives a refresh even before pressing Save
    await saveSettings({ language: l, theme });
    onChanged();
  };

  const handleThemeChange = async (th: 'light' | 'dark') => {
    setTheme(th);
    applyThemeAndLang(th, language);
    // Persist immediately so the chosen theme survives a refresh even
    // before the user presses "Save" on the rest of the form.
    await saveSettings({ theme: th, language });
    onChanged();
  };

  const handleReminderToggle = async (enabled: boolean) => {
    setReminderEnabled(enabled);
    if (enabled) {
      if ('Notification' in window && Notification.permission !== 'granted') {
        const perm = await Notification.requestPermission();
        if (perm !== 'granted') {
          toast({
            title: t('settings.reminderPerm.title'),
            description: t('settings.reminderPerm.desc'),
            variant: 'warning',
          });
          return;
        }
      }
      scheduleReminder(reminderTime);
      toast({
        title: t('settings.reminderEnabled.title'),
        description: t('settings.reminderEnabled.desc', { time: reminderTime }),
        variant: 'success',
      });
    } else {
      cancelReminder();
    }
    await saveSettings({ reminderEnabled: enabled, reminderTime });
    onChanged();
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
        {/* Shop info */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-strong rounded-3xl p-5 space-y-4"
        >
          <h2 className="font-bold text-stone-800 dark:text-amber-50">{t('settings.shopInfo')}</h2>

          <div>
            <label className="text-sm font-medium text-stone-700 dark:text-amber-100 mb-2 flex items-center gap-1.5">
              <Store size={14} /> {t('settings.shopName')}
            </label>
            <input
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder={t('setup.shop.shopName.placeholder')}
              className="w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 text-stone-800 dark:text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700 dark:text-amber-100 mb-2 flex items-center gap-1.5">
              <User size={14} /> {t('settings.ownerName')}
            </label>
            <input
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder={t('setup.shop.owner.placeholder')}
              className="w-full px-4 py-3 rounded-2xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 text-stone-800 dark:text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-stone-700 dark:text-amber-100 mb-2 flex items-center gap-1.5">
              <Coins size={14} /> {t('settings.currency')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {['රු.', '$'].map((c) => (
                <button
                  key={c}
                  onClick={() => setCurrency(c)}
                  className={`py-2.5 rounded-xl font-semibold transition-all ${
                    currency === c ? 'glass-primary text-white' : 'glass text-stone-700 dark:text-amber-100'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Language */}
          <div>
            <label className="text-sm font-medium text-stone-700 dark:text-amber-100 mb-2 flex items-center gap-1.5">
              <Languages size={14} /> {t('settings.language')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LANGS.map((l) => (
                <button
                  key={l}
                  onClick={() => handleLangChange(l)}
                  className={`py-3 rounded-xl font-semibold transition-all ${
                    language === l ? 'glass-primary text-white' : 'glass text-stone-700 dark:text-amber-100'
                  }`}
                >
                  {LANG_LABELS[l]}
                </button>
              ))}
            </div>
          </div>

          {/* Theme */}
          <div>
            <label className="text-sm font-medium text-stone-700 dark:text-amber-100 mb-2 flex items-center gap-1.5">
              {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />} {t('settings.theme')}
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => handleThemeChange('dark')}
                className={`py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  theme === 'dark' ? 'glass-primary text-white' : 'glass text-stone-700 dark:text-amber-100'
                }`}
              >
                <Moon size={14} /> {t('settings.themeDark')}
              </button>
              <button
                onClick={() => handleThemeChange('light')}
                className={`py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  theme === 'light' ? 'glass-primary text-white' : 'glass text-stone-700 dark:text-amber-100'
                }`}
              >
                <Sun size={14} /> {t('settings.themeLight')}
              </button>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full glass-primary rounded-2xl py-3.5 font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
          >
            <Save size={16} /> {t('common.save')}
          </button>
        </motion.section>

        {/* Reminder */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="glass-strong rounded-3xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl glass-primary flex items-center justify-center text-white">
                <Bell size={18} />
              </div>
              <div>
                <h2 className="font-bold text-stone-800 dark:text-amber-50">{t('settings.reminder')}</h2>
                <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('settings.reminderSub')}</p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => handleReminderToggle(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-12 h-7 bg-stone-300/60 dark:bg-white/10 rounded-full peer-checked:bg-amber-500 transition-colors relative">
                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${reminderEnabled ? 'translate-x-5' : ''}`} />
              </div>
            </label>
          </div>
          {reminderEnabled && (
            <div className="glass rounded-xl p-3 flex items-center gap-3">
              <ClockIcon />
              <div className="flex-1">
                <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('settings.reminderTime')}</p>
                <input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="bg-transparent text-stone-800 dark:text-amber-50 font-semibold focus:outline-none"
                />
              </div>
              <button
                onClick={async () => {
                  await saveSettings({ reminderTime });
                  scheduleReminder(reminderTime);
                  toast({ title: t('settings.timeUpdated'), variant: 'success' });
                }}
                className="text-xs text-amber-700 dark:text-amber-300 font-semibold"
              >
                {t('common.save')}
              </button>
            </div>
          )}
        </motion.section>

        {/* Tutorial */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <button
            onClick={onShowTutorial}
            className="w-full glass-strong rounded-3xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-2xl glass-info flex items-center justify-center text-white">
              <BookOpen size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-stone-800 dark:text-amber-50">{t('settings.tutorialReplay')}</p>
              <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('settings.tutorialSub')}</p>
            </div>
            <ChevronRight size={18} className="text-stone-400 dark:text-amber-100/50" />
          </button>
        </motion.section>

        {/* Backup */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
        >
          <button
            onClick={onOpenBackup}
            className="w-full glass-strong rounded-3xl p-4 flex items-center gap-3 active:scale-[0.98] transition-transform"
          >
            <div className="w-12 h-12 rounded-2xl glass-success flex items-center justify-center text-white">
              <DatabaseBackup size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-bold text-stone-800 dark:text-amber-50">{t('backup.title')}</p>
              <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('backup.sub')}</p>
            </div>
            <ChevronRight size={18} className="text-stone-400 dark:text-amber-100/50" />
          </button>
        </motion.section>

        {/* Edit history */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-strong rounded-3xl p-5"
        >
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl glass flex items-center justify-center text-stone-700 dark:text-amber-100">
                <History size={18} />
              </div>
              <div className="text-left">
                <h2 className="font-bold text-stone-800 dark:text-amber-50">{t('settings.editHistory')}</h2>
                <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('settings.editHistorySub', { n: history.length })}</p>
              </div>
            </div>
            <ChevronRight size={18} className={`text-stone-400 dark:text-amber-100/50 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
          </button>
          {showHistory && (
            <div className="mt-3 space-y-1.5">
              {history.length === 0 ? (
                <div className="text-center text-stone-500 dark:text-amber-100/60 text-sm py-4">{t('editHistory.empty')}</div>
              ) : (
                <>
                  {history.map((h) => (
                    <div key={h.id} className="glass rounded-xl p-2.5 flex items-start gap-2">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        h.action === 'create' ? 'bg-green-500'
                        : h.action === 'update' ? 'bg-amber-500'
                        : h.action === 'mark-paid' ? 'bg-cyan-500'
                        : 'bg-red-500'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-stone-800 dark:text-amber-50">{h.summary}</p>
                        <p className="text-[10px] text-stone-500 dark:text-amber-100/50 mt-0.5">
                          {new Date(h.at).toLocaleString(lang === 'si' ? 'si-LK' : 'en-US')}
                        </p>
                      </div>
                    </div>
                  ))}
                  <button
                    onClick={onOpenEditHistory}
                    className="w-full text-xs text-amber-700 dark:text-amber-300 font-semibold flex items-center justify-center gap-1 py-2 mt-1"
                  >
                    {t('editHistory.viewAll')} <ChevronRight size={12} />
                  </button>
                </>
              )}
            </div>
          )}
        </motion.section>

        {/* About */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass rounded-2xl p-4 flex items-start gap-2"
        >
          <Info size={16} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-stone-600 dark:text-amber-100/70 space-y-1">
            <p className="font-semibold text-stone-700 dark:text-amber-100">EggShop v2.5</p>
            <p>{t('settings.about.pwa')}</p>
          </div>
        </motion.section>
      </main>
    </div>
  );
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-stone-700 dark:text-amber-100">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

// ---------- Reminder scheduling (client-side, persistent via localStorage) ----------

function scheduleReminder(time: string) {
  const [h, m] = time.split(':').map(Number);
  const next = new Date();
  next.setHours(h, m, 0, 0);
  if (next.getTime() < Date.now()) {
    next.setDate(next.getDate() + 1);
  }
  const ms = next.getTime() - Date.now();
  localStorage.setItem('eggshop-reminder-time', time);
  localStorage.setItem('eggshop-reminder-scheduled', String(Date.now() + ms));

  const existing = (window as any).__eggshopReminderTimer;
  if (existing) clearTimeout(existing);

  const timer = setTimeout(() => {
    showReminderNotification();
    const daily = setInterval(() => showReminderNotification(), 24 * 60 * 60 * 1000);
    (window as any).__eggshopReminderInterval = daily;
  }, ms);
  (window as any).__eggshopReminderTimer = timer;
}

function cancelReminder() {
  const t = (window as any).__eggshopReminderTimer;
  const i = (window as any).__eggshopReminderInterval;
  if (t) clearTimeout(t);
  if (i) clearInterval(i);
  localStorage.removeItem('eggshop-reminder-scheduled');
}

function showReminderNotification() {
  if ('Notification' in window && Notification.permission === 'granted') {
    try {
      const lang = document.documentElement.lang === 'en' ? 'en' : 'si';
      const title = lang === 'en' ? 'EggShop' : 'බිත්තර කඩේ';
      // Async fetch inventory + categories so the notification body can show
      // current stock levels (helpful before opening the shop).
      (async () => {
        try {
          const { getAllInventory, getCategories } = await import('@/lib/db');
          const [inv, cats] = await Promise.all([getAllInventory(), getCategories()]);
          const lines: string[] = [];
          let outOfStock = 0;
          for (const c of cats) {
            const qty = inv[c.id] || 0;
            const name = lang === 'en'
              ? (c.nameKey ? c.nameKey.replace('cat.', '').replace('-', ' ') : c.name)
              : c.name;
            if (qty === 0) {
              lines.push(`${name}: ${lang === 'en' ? 'Out of Stock' : 'කොටස් නැත'}`);
              outOfStock++;
            } else {
              lines.push(`${name}: ${qty}`);
            }
          }
          const headerLine = lang === 'en'
            ? 'Enter today\'s egg prices. Stock:'
            : 'අද බිත්තර මිල ඇතුළත් කරන්න. කොටස:';
          // Notification body has a max ~200 char limit on some platforms; keep it short.
          const body = `${headerLine}\n${lines.slice(0, 6).join('\n')}`;
          new Notification(title, {
            body,
            icon: '/icons/icon-192.png',
            badge: '/icons/icon-192.png',
            tag: 'eggshop-daily',
          });
        } catch {
          // Fallback to simple notification
          const body = lang === 'en' ? 'Enter today\'s egg prices.' : 'අද බිත්තර මිල ඇතුළත් කරන්න.';
          new Notification(title, { body, icon: '/icons/icon-192.png', tag: 'eggshop-daily' });
        }
      })();
    } catch { /* ignore */ }
  }
}
