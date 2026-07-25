'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, ArrowLeft, Check, Store, User, Coins, BookOpen, Calculator, BarChart3, Package, Truck } from 'lucide-react';
import { saveSettings, todayStr } from '@/lib/db';
import { useAppToast } from './toast-provider';
import { useI18n } from '@/lib/i18n-context';
import { LANGS, LANG_LABELS, type Lang } from '@/lib/i18n';
import { applyThemeAndLang } from '@/lib/use-theme';

type Props = {
  onComplete: (shopName: string, ownerName: string, currency: string, language: Lang, theme: 'light' | 'dark') => void;
};

const STEPS = ['welcome', 'shop', 'tutorial', 'done'] as const;

export function SetupWizard({ onComplete }: Props) {
  const { t, lang, setLang } = useI18n();
  const { toast } = useAppToast();
  const [step, setStep] = useState(0);
  const [shopName, setShopName] = useState('බිත්තර කඩේ');
  const [ownerName, setOwnerName] = useState('');
  const [currency, setCurrency] = useState('රු.');
  const [language, setLanguage] = useState<Lang>('si');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  const handleLangChange = async (l: Lang) => {
    setLanguage(l);
    await setLang(l);
    // Apply to <html> immediately so the wizard UI updates
    applyThemeAndLang(theme, l);
  };

  const handleThemeChange = (th: 'light' | 'dark') => {
    setTheme(th);
    applyThemeAndLang(th, language);
  };

  const finish = async () => {
    await saveSettings({
      shopName,
      ownerName,
      currency,
      language,
      theme,
      tutorialDone: true,
      installDate: todayStr(),
    });
    applyThemeAndLang(theme, language);
    toast({ title: t('toast.ready'), description: t('toast.readyDesc'), variant: 'success' });
    onComplete(shopName, ownerName, currency, language, theme);
  };

  const skipTutorial = async () => {
    await saveSettings({
      shopName,
      ownerName,
      currency,
      language,
      theme,
      tutorialDone: true,
      installDate: todayStr(),
    });
    applyThemeAndLang(theme, language);
    onComplete(shopName, ownerName, currency, language, theme);
  };

  return (
    <div className="fixed inset-0 z-[150] overflow-y-auto scroll-area app-body">
      <div className="min-h-full flex flex-col items-center justify-center p-5 safe-top safe-bottom">
        <motion.div
          key={STEPS[step]}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ type: 'spring', damping: 24, stiffness: 220 }}
          className="w-full max-w-md"
        >
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-1.5 mb-6">
            {STEPS.map((s, i) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-8 bg-amber-500' : i < step ? 'w-4 bg-amber-400' : 'w-4 bg-stone-300/60 dark:bg-white/15'
                }`}
              />
            ))}
          </div>

          {step === 0 && (
            <div className="glass-strong rounded-3xl p-7 text-center animate-pop-in">
              <div className="w-24 h-24 mx-auto mb-5 rounded-3xl overflow-hidden shadow-xl">
                <img src="/icons/icon-1024.png" alt="EggShop" className="w-full h-full object-cover" />
              </div>
              <h1 className="text-3xl font-bold text-stone-800 dark:text-amber-50 mb-2">{t('setup.welcome.title')}</h1>
              <p className="text-stone-600 dark:text-amber-100/80 mb-1">{t('setup.welcome.subtitle')}</p>
              <p className="text-sm text-stone-500 dark:text-amber-100/60 mb-7">{t('setup.welcome.desc')}</p>

              {/* Language picker (also shown on welcome so user can pick before continuing) */}
              <div className="grid grid-cols-2 gap-2 mb-5">
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

              {/* Theme picker */}
              <div className="grid grid-cols-2 gap-2 mb-5">
                <button
                  onClick={() => handleThemeChange('dark')}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    theme === 'dark' ? 'glass-primary text-white' : 'glass text-stone-700 dark:text-amber-100'
                  }`}
                >
                  🌙 {t('settings.themeDark')}
                </button>
                <button
                  onClick={() => handleThemeChange('light')}
                  className={`py-2.5 rounded-xl text-sm font-semibold transition-all ${
                    theme === 'light' ? 'glass-primary text-white' : 'glass text-stone-700 dark:text-amber-100'
                  }`}
                >
                  ☀️ {t('settings.themeLight')}
                </button>
              </div>

              <button
                onClick={() => setStep(1)}
                className="w-full glass-primary rounded-2xl py-4 font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                {t('setup.welcome.start')} <ArrowRight size={18} />
              </button>
              <button
                onClick={skipTutorial}
                className="mt-3 text-sm text-stone-500 dark:text-amber-100/60 underline"
              >
                {t('setup.welcome.skip')}
              </button>
            </div>
          )}

          {step === 1 && (
            <div className="glass-strong rounded-3xl p-7 animate-pop-in space-y-5">
              <h2 className="text-2xl font-bold text-stone-800 dark:text-amber-50 text-center">{t('setup.shop.title')}</h2>

              <div>
                <label className="text-sm font-medium text-stone-700 dark:text-amber-100 mb-2 flex items-center gap-1.5">
                  <Store size={14} /> {t('setup.shop.shopName')}
                </label>
                <input
                  value={shopName}
                  onChange={(e) => setShopName(e.target.value)}
                  placeholder={t('setup.shop.shopName.placeholder')}
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 text-stone-800 dark:text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700 dark:text-amber-100 mb-2 flex items-center gap-1.5">
                  <User size={14} /> {t('setup.shop.owner')}
                </label>
                <input
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder={t('setup.shop.owner.placeholder')}
                  className="w-full px-4 py-3.5 rounded-2xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 text-stone-800 dark:text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700 dark:text-amber-100 mb-2 flex items-center gap-1.5">
                  <Coins size={14} /> {t('setup.shop.currency')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['රු.', '$'].map((c) => (
                    <button
                      key={c}
                      onClick={() => setCurrency(c)}
                      className={`py-3 rounded-xl font-semibold transition-all ${
                        currency === c ? 'glass-primary text-white' : 'glass text-stone-700 dark:text-amber-100'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-stone-700 dark:text-amber-100 mb-2 block">
                  {t('setup.shop.language')}
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

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setStep(0)}
                  className="glass rounded-2xl py-3.5 font-semibold text-stone-700 dark:text-amber-100 flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                >
                  <ArrowLeft size={16} /> {t('setup.tutorial.prev')}
                </button>
                <button
                  onClick={() => setStep(2)}
                  disabled={!ownerName.trim()}
                  className="glass-primary rounded-2xl py-3.5 font-bold text-white flex items-center justify-center gap-1.5 active:scale-95 transition-transform disabled:opacity-60"
                >
                  {t('setup.tutorial.next')} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="glass-strong rounded-3xl p-7 animate-pop-in space-y-4">
              <h2 className="text-2xl font-bold text-stone-800 dark:text-amber-50 text-center mb-2">{t('setup.tutorial.title')}</h2>

              <TutorialCard
                icon={<Coins size={20} />}
                color="amber"
                title={t('setup.tutorial.1.title')}
                text={t('setup.tutorial.1.text')}
              />
              <TutorialCard
                icon={<Calculator size={20} />}
                color="green"
                title={t('setup.tutorial.2.title')}
                text={t('setup.tutorial.2.text')}
              />
              <TutorialCard
                icon={<BarChart3 size={20} />}
                color="cyan"
                title={t('setup.tutorial.3.title')}
                text={t('setup.tutorial.3.text')}
              />
              <TutorialCard
                icon={<Package size={20} />}
                color="amber"
                title={t('setup.tutorial.4.title')}
                text={t('setup.tutorial.4.text')}
              />
              <TutorialCard
                icon={<Truck size={20} />}
                color="cyan"
                title={t('setup.tutorial.5.title')}
                text={t('setup.tutorial.5.text')}
              />

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => setStep(1)}
                  className="glass rounded-2xl py-3.5 font-semibold text-stone-700 dark:text-amber-100 flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                >
                  <ArrowLeft size={16} /> {t('setup.tutorial.prev')}
                </button>
                <button
                  onClick={() => setStep(3)}
                  className="glass-primary rounded-2xl py-3.5 font-bold text-white flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                >
                  {t('setup.tutorial.understood')} <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="glass-strong rounded-3xl p-7 text-center animate-pop-in">
              <div className="w-20 h-20 mx-auto mb-5 rounded-full glass-success flex items-center justify-center text-white">
                <Check size={40} strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-bold text-stone-800 dark:text-amber-50 mb-2">{t('setup.done.title')}</h2>
              <p className="text-stone-600 dark:text-amber-100/80 mb-1">{t('setup.done.subtitle')}</p>
              <p className="text-sm text-stone-500 dark:text-amber-100/60 mb-7">{t('setup.done.subtitle2')}</p>
              <button
                onClick={finish}
                className="w-full glass-primary rounded-2xl py-4 font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                {t('setup.welcome.start')} <ArrowRight size={18} />
              </button>
            </div>
          )}
        </motion.div>
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
    <div className="glass rounded-2xl p-4 flex gap-3">
      <div className={`w-11 h-11 rounded-xl ${colorMap[color]} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="font-bold text-stone-800 dark:text-amber-50 text-sm mb-0.5">{title}</p>
        <p className="text-xs text-stone-600 dark:text-amber-100/70 leading-relaxed">{text}</p>
      </div>
    </div>
  );
}
