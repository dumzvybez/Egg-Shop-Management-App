'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowLeft, Store, User, Coins, Palette, Save, BookOpen, DatabaseBackup,
  History, Info, ChevronDown, ChevronRight, Github, Globe, Youtube, Lock,
  ShieldCheck, Fingerprint, Trash2, Briefcase, Settings as SettingsIcon, Heart,
  Smartphone, WifiOff,
} from 'lucide-react';
import {
  useI18n, applyThemeAndBackground, saveSettings, getEditHistory,
  type Settings, type EditHistoryEntry,
} from '@/lib/data-hooks-adapter';
import { useAppToast } from './toast-provider';
import { PinSetupDialog } from './app-lock';
import { THEMES, BACKGROUNDS, type ThemeId, type BackgroundId } from '@/lib/themes';
import { CURRENCIES } from '@/lib/currencies';
import { BUSINESS_TYPES } from '@/lib/business-types';

type Props = {
  settings: Settings;
  onBack: () => void;
  onChanged: () => void;
  onShowTutorial: () => void;
  onOpenBackup: () => void;
  onOpenEditHistory: () => void;
};

type Section = 'general' | 'appearance' | 'security' | 'currency' | 'business' | 'backup' | 'developer' | 'about';

export function SettingsScreen({
  settings, onBack, onChanged, onShowTutorial, onOpenBackup, onOpenEditHistory,
}: Props) {
  const { t } = useI18n();
  const { toast } = useAppToast();
  const [activeSection, setActiveSection] = useState<Section>('general');
  const [shopName, setShopName] = useState(settings.shopName);
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [shopPhone, setShopPhone] = useState(settings.shopPhone);
  const [shopAddress, setShopAddress] = useState(settings.shopAddress);
  const [shopType, setShopType] = useState(settings.shopType);
  const [currency, setCurrency] = useState(settings.currency || 'LKR');
  const [themeId, setThemeId] = useState<ThemeId>((settings.themeId as ThemeId) || 'modern-dark');
  const [backgroundId, setBackgroundId] = useState<BackgroundId>((settings.backgroundId as BackgroundId) || 'default');
  const [appLockEnabled, setAppLockEnabled] = useState(settings.appLockEnabled);
  const [appLockBiometric, setAppLockBiometric] = useState(settings.appLockBiometric);
  const [showPinSetup, setShowPinSetup] = useState(false);
  const [history, setHistory] = useState<EditHistoryEntry[]>([]);

  useEffect(() => {
    getEditHistory(5).then(setHistory);
  }, []);

  // Sync local state when settings prop changes
  useEffect(() => {
    setShopName(settings.shopName);
    setOwnerName(settings.ownerName);
    setShopPhone(settings.shopPhone);
    setShopAddress(settings.shopAddress);
    setShopType(settings.shopType);
    setCurrency(settings.currency || 'LKR');
    setThemeId((settings.themeId as ThemeId) || 'modern-dark');
    setBackgroundId((settings.backgroundId as BackgroundId) || 'default');
    setAppLockEnabled(settings.appLockEnabled);
    setAppLockBiometric(settings.appLockBiometric);
  }, [settings]);

  const handleThemeChange = (id: ThemeId) => {
    setThemeId(id);
    applyThemeAndBackground(id, backgroundId);
    saveSettings({ themeId: id, theme: id === 'light-pro' ? 'light' : 'dark' });
  };
  const handleBackgroundChange = (id: BackgroundId) => {
    setBackgroundId(id);
    applyThemeAndBackground(themeId, id);
    saveSettings({ backgroundId: id });
  };
  const handleCurrencyChange = (code: string) => {
    setCurrency(code);
    saveSettings({ currency: code });
    toast({ title: 'Currency updated', variant: 'success' });
  };

  const handleSaveGeneral = async () => {
    await saveSettings({ shopName: shopName.trim(), ownerName: ownerName.trim(), shopPhone, shopAddress, shopType, currency });
    toast({ title: t('settings.saved.title'), variant: 'success' });
    onChanged();
  };

  const handleAppLockToggle = async (enabled: boolean) => {
    if (enabled) {
      setAppLockEnabled(true);
      setShowPinSetup(true);
    } else {
      setAppLockEnabled(false);
      setAppLockBiometric(false);
      await saveSettings({ appLockEnabled: false, appLockPin: null, appLockBiometric: false });
      toast({ title: 'App Lock disabled', variant: 'success' });
    }
  };

  const handlePinSaved = async (pin: string) => {
    setShowPinSetup(false);
    await saveSettings({ appLockEnabled: true, appLockPin: pin });
    toast({ title: 'PIN set — App Lock enabled', variant: 'success' });
    onChanged();
  };

  const handleBiometricToggle = async (enabled: boolean) => {
    setAppLockBiometric(enabled);
    await saveSettings({ appLockBiometric: enabled });
  };

  const sections: { id: Section; label: string; icon: React.ReactNode }[] = [
    { id: 'general', label: 'General', icon: <SettingsIcon size={16} /> },
    { id: 'appearance', label: 'Appearance', icon: <Palette size={16} /> },
    { id: 'security', label: 'Security', icon: <Lock size={16} /> },
    { id: 'currency', label: 'Currency', icon: <Coins size={16} /> },
    { id: 'business', label: 'Business', icon: <Briefcase size={16} /> },
    { id: 'backup', label: 'Backup', icon: <DatabaseBackup size={16} /> },
    { id: 'developer', label: 'Developer', icon: <Heart size={16} /> },
    { id: 'about', label: 'About', icon: <Info size={16} /> },
  ];

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
        {/* Section tabs */}
        <div className="glass-strong rounded-3xl p-2 overflow-x-auto scroll-area">
          <div className="flex gap-1 min-w-max">
            {sections.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  activeSection === s.id
                    ? 'glass-primary text-white'
                    : 'glass text-stone-700 dark:text-amber-100'
                }`}
              >
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* GENERAL */}
        {activeSection === 'general' && (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-5 space-y-3">
            <h2 className="font-bold text-stone-800 dark:text-amber-50 mb-2">General</h2>
            <div>
              <label className="text-xs text-stone-600 dark:text-amber-100/70 mb-1 block">Shop name</label>
              <input type="text" value={shopName} onChange={(e) => setShopName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 text-stone-800 dark:text-amber-50 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="text-xs text-stone-600 dark:text-amber-100/70 mb-1 block">Owner name</label>
              <input type="text" value={ownerName} onChange={(e) => setOwnerName(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 text-stone-800 dark:text-amber-50 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="text-xs text-stone-600 dark:text-amber-100/70 mb-1 block">Shop phone</label>
              <input type="tel" value={shopPhone} onChange={(e) => setShopPhone(e.target.value)} placeholder="Optional"
                className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 text-stone-800 dark:text-amber-50 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <div>
              <label className="text-xs text-stone-600 dark:text-amber-100/70 mb-1 block">Shop address</label>
              <input type="text" value={shopAddress} onChange={(e) => setShopAddress(e.target.value)} placeholder="Optional"
                className="w-full px-3 py-2.5 rounded-xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 text-stone-800 dark:text-amber-50 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400" />
            </div>
            <button onClick={handleSaveGeneral}
              className="w-full glass-primary rounded-2xl py-3 font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform">
              <Save size={16} /> Save
            </button>

            {/* Tutorial replay + Edit history */}
            <button onClick={onShowTutorial}
              className="w-full glass rounded-2xl p-3 flex items-center gap-2 active:scale-[0.98] transition-transform mt-2">
              <BookOpen size={16} className="text-amber-500" />
              <span className="text-sm font-semibold text-stone-700 dark:text-amber-100 flex-1 text-left">Replay Tutorial</span>
              <ChevronRight size={14} className="text-stone-400" />
            </button>
            <button onClick={onOpenEditHistory}
              className="w-full glass rounded-2xl p-3 flex items-center gap-2 active:scale-[0.98] transition-transform">
              <History size={16} className="text-amber-500" />
              <span className="text-sm font-semibold text-stone-700 dark:text-amber-100 flex-1 text-left">Edit History</span>
              <ChevronRight size={14} className="text-stone-400" />
            </button>
          </motion.section>
        )}

        {/* APPEARANCE */}
        {activeSection === 'appearance' && (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-5 space-y-4">
            <h2 className="font-bold text-stone-800 dark:text-amber-50">Appearance</h2>
            <div>
              <label className="text-xs text-stone-600 dark:text-amber-100/70 mb-2 block">Theme</label>
              <div className="grid grid-cols-3 gap-2">
                {THEMES.map((th) => (
                  <button key={th.id} onClick={() => handleThemeChange(th.id)}
                    className={`p-2 rounded-xl text-xs font-semibold transition-all ${
                      themeId === th.id ? 'glass-primary text-white' : 'glass text-stone-700 dark:text-amber-100'
                    }`}>
                    <div className="w-6 h-6 mx-auto mb-1 rounded-full" style={{ background: th.swatch }} />
                    {th.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-stone-600 dark:text-amber-100/70 mb-2 block">Background</label>
              <div className="grid grid-cols-3 gap-2">
                {BACKGROUNDS.map((bg) => (
                  <button key={bg.id} onClick={() => handleBackgroundChange(bg.id)}
                    className={`p-2 rounded-xl text-xs font-semibold transition-all ${
                      backgroundId === bg.id ? 'glass-primary text-white' : 'glass text-stone-700 dark:text-amber-100'
                    }`}>
                    <div className="w-full h-8 mb-1 rounded-lg" style={{ background: bg.preview }} />
                    {bg.label}
                  </button>
                ))}
              </div>
            </div>
          </motion.section>
        )}

        {/* SECURITY */}
        {activeSection === 'security' && (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-5 space-y-3">
            <h2 className="font-bold text-stone-800 dark:text-amber-50">Security</h2>
            <label className="flex items-center justify-between p-3 glass rounded-xl cursor-pointer">
              <div className="flex items-center gap-2">
                <Lock size={16} className="text-amber-500" />
                <div>
                  <p className="font-semibold text-sm text-stone-800 dark:text-amber-50">Enable App Lock</p>
                  <p className="text-[10px] text-stone-500 dark:text-amber-100/60">Require PIN to open the app</p>
                </div>
              </div>
              <input type="checkbox" checked={appLockEnabled} onChange={(e) => handleAppLockToggle(e.target.checked)}
                className="w-5 h-5 rounded accent-amber-500" />
            </label>
            {appLockEnabled && (
              <>
                <label className="flex items-center justify-between p-3 glass rounded-xl cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Fingerprint size={16} className="text-amber-500" />
                    <div>
                      <p className="font-semibold text-sm text-stone-800 dark:text-amber-50">Biometric unlock</p>
                      <p className="text-[10px] text-stone-500 dark:text-amber-100/60">Use fingerprint / face where supported</p>
                    </div>
                  </div>
                  <input type="checkbox" checked={appLockBiometric} onChange={(e) => handleBiometricToggle(e.target.checked)}
                    className="w-5 h-5 rounded accent-amber-500" />
                </label>
                <button onClick={() => setShowPinSetup(true)}
                  className="w-full glass rounded-xl py-2.5 text-xs font-semibold text-stone-700 dark:text-amber-100 active:scale-95 transition-transform">
                  Change PIN
                </button>
              </>
            )}
            <div className="glass rounded-xl p-3 flex items-start gap-2 mt-2">
              <ShieldCheck size={14} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-stone-600 dark:text-amber-100/70">
                App Lock protects access to this app on your device. Exported backup files are NOT PIN-protected — store them securely.
              </p>
            </div>
          </motion.section>
        )}

        {/* CURRENCY */}
        {activeSection === 'currency' && (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-5">
            <h2 className="font-bold text-stone-800 dark:text-amber-50 mb-3">Currency</h2>
            <div className="grid grid-cols-3 gap-2">
              {CURRENCIES.map((c) => (
                <button key={c.code} onClick={() => handleCurrencyChange(c.code)}
                  className={`p-2 rounded-xl text-xs font-semibold transition-all ${
                    currency === c.code ? 'glass-primary text-white' : 'glass text-stone-700 dark:text-amber-100'
                  }`}>
                  <div className="font-bold">{c.code}</div>
                  <div className="text-base mb-0.5">{c.symbol}</div>
                  <div className="text-[9px] opacity-70 truncate">{c.name}</div>
                </button>
              ))}
            </div>
          </motion.section>
        )}

        {/* BUSINESS */}
        {activeSection === 'business' && (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-5">
            <h2 className="font-bold text-stone-800 dark:text-amber-50 mb-3">Business Type</h2>
            <div className="grid grid-cols-2 gap-2">
              {BUSINESS_TYPES.map((bt) => (
                <button key={bt.id} onClick={() => { setShopType(bt.id); saveSettings({ shopType: bt.id }); }}
                  className={`p-3 rounded-xl text-xs font-semibold transition-all text-left ${
                    shopType === bt.id ? 'glass-primary text-white' : 'glass text-stone-700 dark:text-amber-100'
                  }`}>
                  <div className="font-bold mb-0.5">{bt.label}</div>
                  <div className={`text-[9px] ${shopType === bt.id ? 'text-white/70' : 'opacity-60'}`}>{bt.description}</div>
                </button>
              ))}
            </div>
          </motion.section>
        )}

        {/* BACKUP */}
        {activeSection === 'backup' && (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-5">
            <button onClick={onOpenBackup} className="w-full flex items-center gap-3 active:scale-[0.98] transition-transform">
              <div className="w-10 h-10 rounded-xl glass-success flex items-center justify-center text-white">
                <DatabaseBackup size={18} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-sm text-stone-800 dark:text-amber-50">Backup & Restore</p>
                <p className="text-xs text-stone-600 dark:text-amber-100/70">Export, import, auto-backup settings</p>
              </div>
              <ChevronRight size={18} className="text-stone-400" />
            </button>
            <div className="glass rounded-xl p-3 flex items-start gap-2 mt-3">
              <Lock size={14} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <p className="text-[10px] text-stone-600 dark:text-amber-100/70">
                Exported backup files are NOT protected by App Lock. Store them securely.
              </p>
            </div>
          </motion.section>
        )}

        {/* DEVELOPER */}
        {activeSection === 'developer' && (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-14 h-14 rounded-full glass-primary flex items-center justify-center text-white">
                <Heart size={24} />
              </div>
              <div>
                <p className="font-bold text-stone-800 dark:text-amber-50">Dumindu Wanasinghe</p>
                <p className="text-xs text-stone-600 dark:text-amber-100/70">Founder & Developer</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 dark:text-amber-100/70 mb-4">
              ShopSuite is a privacy-first, offline-first Progressive Web App for small-business management. All data stays on your device — no servers, no tracking.
            </p>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <LinkButton href="https://github.com/dumzvybez" label="GitHub" icon={<Github size={14} />} />
              <LinkButton href="https://dumindu.vercel.app" label="Portfolio" icon={<Globe size={14} />} />
              <LinkButton href="https://www.youtube.com/@DuminduWanasinghe" label="YouTube" icon={<Youtube size={14} />} />
              <LinkButton href="https://github.com/dumzvybez/Egg-Shop-Management-App" label="Repository" icon={<Github size={14} />} />
            </div>

            <div className="space-y-2">
              <div className="glass rounded-xl p-3 flex items-start gap-2">
                <Lock size={14} className="text-green-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-stone-800 dark:text-amber-50">Privacy-First</p>
                  <p className="text-[10px] text-stone-600 dark:text-amber-100/70">All data stays on your device. No servers, no accounts, no tracking.</p>
                </div>
              </div>
              <div className="glass rounded-xl p-3 flex items-start gap-2">
                <WifiOff size={14} className="text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-stone-800 dark:text-amber-50">Offline-First</p>
                  <p className="text-[10px] text-stone-600 dark:text-amber-100/70">Works completely without internet via IndexedDB storage.</p>
                </div>
              </div>
              <div className="glass rounded-xl p-3 flex items-start gap-2">
                <Smartphone size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-semibold text-stone-800 dark:text-amber-50">Installable PWA</p>
                  <p className="text-[10px] text-stone-600 dark:text-amber-100/70">Install on Android, iOS, or desktop. Launches like a native app.</p>
                </div>
              </div>
            </div>
          </motion.section>
        )}

        {/* ABOUT */}
        {activeSection === 'about' && (
          <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-xl glass-primary flex items-center justify-center text-white">
                <Info size={18} />
              </div>
              <h2 className="font-bold text-stone-800 dark:text-amber-50">About ShopSuite</h2>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600 dark:text-amber-100/70">Version</span>
                <span className="font-bold text-stone-800 dark:text-amber-50">v3.1.0</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600 dark:text-amber-100/70">Type</span>
                <span className="font-bold text-green-700 dark:text-green-400">PWA · Offline-first</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-stone-600 dark:text-amber-100/70">License</span>
                <span className="font-bold text-stone-800 dark:text-amber-50">MIT</span>
              </div>
            </div>
            <p className="text-[10px] text-stone-500 dark:text-amber-100/50 text-center mt-4">
              © {new Date().getFullYear()} ShopSuite. All Rights Reserved.
            </p>
          </motion.section>
        )}

        {/* Recent edit history (always visible) */}
        <motion.section initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="glass-strong rounded-3xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="font-bold text-sm text-stone-800 dark:text-amber-50">Recent Changes</p>
            <button onClick={onOpenEditHistory} className="text-xs text-amber-700 dark:text-amber-300 font-semibold">View all</button>
          </div>
          {history.length === 0 ? (
            <p className="text-xs text-stone-500 dark:text-amber-100/60 text-center py-3">No history yet.</p>
          ) : (
            <div className="space-y-1.5">
              {history.map((e) => (
                <div key={e.id} className="glass rounded-xl p-2 flex items-start gap-2">
                  <span className={`w-2 h-2 rounded-full ${ACTION_COLORS[e.action] || 'bg-stone-400'} mt-1.5 flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-stone-800 dark:text-amber-50 truncate">{e.summary}</p>
                    <p className="text-[10px] text-stone-500 dark:text-amber-100/50">
                      {new Date(e.at).toLocaleString('en-US', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.section>
      </main>

      <PinSetupDialog
        open={showPinSetup}
        onClose={() => { setShowPinSetup(false); if (!settings.appLockPin) setAppLockEnabled(false); }}
        onSaved={handlePinSaved}
      />
    </div>
  );
}

function LinkButton({ href, label, icon }: { href: string; label: string; icon: React.ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer"
      className="glass rounded-xl py-2.5 px-2 text-xs font-semibold text-stone-700 dark:text-amber-100 flex items-center justify-center gap-1.5 active:scale-95 transition-transform">
      {icon} {label}
    </a>
  );
}
