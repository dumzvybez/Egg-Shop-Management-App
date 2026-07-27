'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, ChevronRight, ChevronLeft, Coins, Calculator, BarChart3, Package, Truck, Store, User, Palette } from 'lucide-react';
import { useI18n, applyThemeAndLang, saveSettings, todayStr, type Settings } from '@/lib/data-hooks-adapter';
import { useAppToast } from './toast-provider';

const SHOP_TYPES = [
  { id: 'grocery', label: 'Grocery' },
  { id: 'convenience', label: 'Convenience' },
  { id: 'snack', label: 'Snack Shop' },
  { id: 'retail', label: 'Retail' },
  { id: 'egg', label: 'Egg Shop' },
  { id: 'other', label: 'Other' },
];

const THEMES = [
  { id: 'dark' as const, label: 'Dark', icon: '🌙' },
  { id: 'light' as const, label: 'Light', icon: '☀️' },
];

export function SetupWizard({ onComplete }: { onComplete: () => void }) {
  const { t } = useI18n();
  const { toast } = useAppToast();
  const [step, setStep] = useState(0);
  const [shopName, setShopName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [shopType, setShopType] = useState('');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const handleThemeChange = (th: 'dark' | 'light') => {
    setTheme(th);
    applyThemeAndLang(th, 'en');
  };

  const finish = async (skipToast = false) => {
    const patch: Partial<Settings> = {
      shopName: shopName.trim(),
      ownerName: ownerName.trim(),
      shopType: shopType,
      currency: 'LKR',
      theme,
      tutorialDone: true,
      installDate: todayStr(),
    };
    await saveSettings(patch);
    applyThemeAndLang(theme, 'en');
    if (!skipToast) {
      toast({ title: t('toast.ready'), description: t('toast.readyDesc'), variant: 'success' });
    }
    onComplete();
  };

  const skipTutorial = () => finish(true);

  const next = () => setStep((s) => Math.min(s + 1, 2));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  return (
    <div className="fixed inset-0 z-[150] app-body overflow-y-auto">
      <div className="min-h-full flex flex-col items-center justify-center px-4 py-8 safe-top safe-bottom">
        <div className="w-full max-w-md">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-8 bg-amber-500' :
                  i < step ? 'w-4 bg-amber-400' : 'w-4 bg-stone-300 dark:bg-stone-700'
                }`}
              />
            ))}
          </div>

          <motion.div
            key={step}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', damping: 24, stiffness: 220 }}
          >
            {step === 0 && (
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-5 rounded-3xl overflow-hidden shadow-xl">
                  <img src="/icons/icon-1024.png" alt="Shop Manager" className="w-full h-full object-cover" />
                </div>
                <h1 className="text-2xl font-bold text-stone-800 dark:text-amber-50 mb-2">
                  {t('setup.welcome.title')}
                </h1>
                <p className="text-sm text-stone-600 dark:text-amber-100/70 mb-1">
                  {t('setup.welcome.subtitle')}
                </p>
                <p className="text-xs text-stone-500 dark:text-amber-100/60 mb-6 max-w-sm mx-auto">
                  {t('setup.welcome.desc')}
                </p>

                {/* Theme picker */}
                <div className="glass-strong rounded-3xl p-5 mb-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Palette size={16} className="text-amber-600 dark:text-amber-400" />
                    <p className="text-sm font-semibold text-stone-700 dark:text-amber-100">
                      {t('settings.theme')}
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {THEMES.map((th) => (
                      <button
                        key={th.id}
                        onClick={() => handleThemeChange(th.id)}
                        className={`py-3 rounded-2xl text-sm font-semibold transition-all ${
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
                  onClick={next}
                  className="w-full glass-primary rounded-2xl py-4 font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  {t('setup.welcome.start')}
                  <ChevronRight size={18} />
                </button>
                <button
                  onClick={skipTutorial}
                  className="mt-3 text-xs text-stone-500 dark:text-amber-100/60 underline"
                >
                  {t('setup.welcome.skip')}
                </button>
              </div>
            )}

            {step === 1 && (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-10 h-10 rounded-2xl glass-primary flex items-center justify-center text-white">
                    <Store size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-800 dark:text-amber-50">
                      {t('setup.shop.title')}
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-amber-100/60">
                      Tell us about your business
                    </p>
                  </div>
                </div>

                <div className="glass-strong rounded-3xl p-5 space-y-4">
                  <div>
                    <label className="text-xs text-stone-600 dark:text-amber-100/70 mb-1 block flex items-center gap-1">
                      <Store size={12} /> {t('setup.shop.shopName')}
                    </label>
                    <input
                      type="text"
                      value={shopName}
                      onChange={(e) => setShopName(e.target.value)}
                      placeholder={t('setup.shop.shopName.placeholder')}
                      className="w-full px-3 py-3 rounded-xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 text-stone-800 dark:text-amber-50 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stone-600 dark:text-amber-100/70 mb-1 block flex items-center gap-1">
                      <User size={12} /> {t('setup.shop.owner')}
                    </label>
                    <input
                      type="text"
                      value={ownerName}
                      onChange={(e) => setOwnerName(e.target.value)}
                      placeholder={t('setup.shop.owner.placeholder')}
                      className="w-full px-3 py-3 rounded-xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 text-stone-800 dark:text-amber-50 font-semibold focus:outline-none focus:ring-2 focus:ring-amber-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-stone-600 dark:text-amber-100/70 mb-1 block">
                      {t('setup.shop.shopType')}
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {SHOP_TYPES.map((st) => (
                        <button
                          key={st.id}
                          onClick={() => setShopType(st.id === shopType ? '' : st.id)}
                          className={`px-2 py-2 rounded-xl text-xs font-semibold transition-all ${
                            shopType === st.id
                              ? 'glass-primary text-white'
                              : 'glass text-stone-700 dark:text-amber-100'
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-stone-600 dark:text-amber-100/70 mb-1 block flex items-center gap-1">
                      <Coins size={12} /> {t('settings.currency')}
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled
                        className="py-3 rounded-xl text-sm font-bold glass-primary text-white cursor-default"
                      >
                        LKR
                      </button>
                      <div className="py-3 px-2 rounded-xl glass text-stone-500 dark:text-amber-100/60 text-xs">
                        {t('setup.shop.currency.note')}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <button
                    onClick={prev}
                    className="glass rounded-2xl py-3 font-semibold text-stone-700 dark:text-amber-100 text-sm flex items-center justify-center gap-1 active:scale-95 transition-transform"
                  >
                    <ChevronLeft size={16} /> {t('setup.tutorial.prev')}
                  </button>
                  <button
                    onClick={next}
                    disabled={!ownerName.trim()}
                    className="glass-primary rounded-2xl py-3 font-bold text-white text-sm flex items-center justify-center gap-1 active:scale-95 transition-transform disabled:opacity-50"
                  >
                    {t('setup.tutorial.next')} <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="flex items-center gap-2 mb-5">
                  <div className="w-10 h-10 rounded-2xl glass-info flex items-center justify-center text-white">
                    <BarChart3 size={18} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-stone-800 dark:text-amber-50">
                      {t('setup.tutorial.title')}
                    </h2>
                    <p className="text-xs text-stone-500 dark:text-amber-100/60">
                      A quick tour of the app
                    </p>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <TutorialCard icon={<Package size={16} />} color="amber"
                    title={t('setup.tutorial.1.title')} text={t('setup.tutorial.1.text')} />
                  <TutorialCard icon={<Calculator size={16} />} color="green"
                    title={t('setup.tutorial.2.title')} text={t('setup.tutorial.2.text')} />
                  <TutorialCard icon={<Truck size={16} />} color="cyan"
                    title={t('setup.tutorial.3.title')} text={t('setup.tutorial.3.text')} />
                  <TutorialCard icon={<BarChart3 size={16} />} color="amber"
                    title={t('setup.tutorial.4.title')} text={t('setup.tutorial.4.text')} />
                  <TutorialCard icon={<Coins size={16} />} color="green"
                    title={t('setup.tutorial.5.title')} text={t('setup.tutorial.5.text')} />
                </div>

                <div className="grid grid-cols-2 gap-3 mt-5">
                  <button
                    onClick={prev}
                    className="glass rounded-2xl py-3 font-semibold text-stone-700 dark:text-amber-100 text-sm flex items-center justify-center gap-1 active:scale-95 transition-transform"
                  >
                    <ChevronLeft size={16} /> {t('setup.tutorial.prev')}
                  </button>
                  <button
                    onClick={() => finish()}
                    className="glass-success rounded-2xl py-3 font-bold text-white text-sm flex items-center justify-center gap-1 active:scale-95 transition-transform"
                  >
                    <Check size={16} /> {t('setup.tutorial.understood')}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

function TutorialCard({ icon, color, title, text }: {
  icon: React.ReactNode;
  color: 'amber' | 'green' | 'cyan';
  title: string;
  text: string;
}) {
  const colorMap = {
    amber: 'glass-primary',
    green: 'glass-success',
    cyan: 'glass-info',
  };
  return (
    <div className="glass rounded-2xl p-3 flex items-start gap-3">
      <div className={`w-9 h-9 rounded-xl ${colorMap[color]} flex items-center justify-center text-white flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-stone-800 dark:text-amber-50">{title}</p>
        <p className="text-xs text-stone-600 dark:text-amber-100/70 mt-0.5">{text}</p>
      </div>
    </div>
  );
}
