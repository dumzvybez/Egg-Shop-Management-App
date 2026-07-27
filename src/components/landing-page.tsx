'use client';

import { motion } from 'framer-motion';
import {
  ShoppingBag, Package, Truck, Users, Wallet, FileText, Shield, WifiOff,
  Smartphone, ArrowRight, Store, TrendingUp, Check,
} from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';

type Props = {
  onGetStarted: () => void;
};

export function LandingPage({ onGetStarted }: Props) {
  const { t } = useI18n();

  const features = [
    { icon: <ShoppingBag size={22} />, title: 'Sales Tracking', desc: 'Record multi-line sales with automatic profit calculation and stock updates.' },
    { icon: <Package size={22} />, title: 'Inventory Management', desc: 'Full product CRUD, opening stock, reorder thresholds, and movement history.' },
    { icon: <Truck size={22} />, title: 'Supplier Management', desc: 'Track purchases, partial payments, and outstanding balances.' },
    { icon: <Users size={22} />, title: 'Customer Credit', desc: 'Record credit sales, collect partial payments, and track outstanding dues.' },
    { icon: <Wallet size={22} />, title: 'Expense Tracking', desc: 'Categorize operating costs and see real-time net profit impact.' },
    { icon: <FileText size={22} />, title: 'Professional Reports', desc: 'Daily, monthly, and printable PDF reports with section selection.' },
  ];

  return (
    <div className="min-h-screen app-body overflow-y-auto">
      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center px-4 safe-top safe-bottom">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative w-full max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 rounded-3xl glass-primary flex items-center justify-center text-white shadow-2xl"
          >
            <Store size={36} />
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-4xl sm:text-5xl font-bold text-stone-800 dark:text-amber-50 mb-4"
          >
            ShopSuite
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg sm:text-xl text-stone-600 dark:text-amber-100/70 mb-2 max-w-2xl mx-auto"
          >
            The professional small-business management system that works entirely offline.
          </motion.p>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-sm text-stone-500 dark:text-amber-100/50 mb-8 max-w-xl mx-auto"
          >
            Track sales, inventory, suppliers, credit, expenses and reports — all in one clean, simple app. Your data never leaves your device.
          </motion.p>

          <motion.button
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4 }}
            onClick={onGetStarted}
            className="glass-primary rounded-2xl px-8 py-4 font-bold text-white text-lg flex items-center justify-center gap-2 mx-auto shadow-xl active:scale-95 transition-transform"
          >
            Get Started <ArrowRight size={20} />
          </motion.button>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="mt-6 flex items-center justify-center gap-4 text-xs text-stone-500 dark:text-amber-100/50"
          >
            <span className="flex items-center gap-1"><Shield size={12} /> Privacy-first</span>
            <span className="flex items-center gap-1"><WifiOff size={12} /> Offline-ready</span>
            <span className="flex items-center gap-1"><Smartphone size={12} /> Installable PWA</span>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section className="px-4 py-16 max-w-5xl mx-auto">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mb-10"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-stone-800 dark:text-amber-50 mb-2">
            Everything your shop needs
          </h2>
          <p className="text-sm text-stone-600 dark:text-amber-100/70">
            One app for the entire daily workflow of running a small business.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={i}
              initial={{ y: 20, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="glass-strong rounded-3xl p-5"
            >
              <div className="w-11 h-11 rounded-2xl glass-primary flex items-center justify-center text-white mb-3">
                {f.icon}
              </div>
              <h3 className="font-bold text-stone-800 dark:text-amber-50 mb-1">{f.title}</h3>
              <p className="text-xs text-stone-600 dark:text-amber-100/70 leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Privacy / Offline / PWA */}
      <section className="px-4 py-16 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            className="glass-strong rounded-3xl p-6 text-center"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl glass-success flex items-center justify-center text-white">
              <Shield size={22} />
            </div>
            <h3 className="font-bold text-stone-800 dark:text-amber-50 mb-2">Privacy-First</h3>
            <p className="text-xs text-stone-600 dark:text-amber-100/70">
              All data stays on your device. No servers, no accounts, no tracking. Optional App Lock with PIN + biometrics.
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="glass-strong rounded-3xl p-6 text-center"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl glass-info flex items-center justify-center text-white">
              <WifiOff size={22} />
            </div>
            <h3 className="font-bold text-stone-800 dark:text-amber-50 mb-2">Offline-First</h3>
            <p className="text-xs text-stone-600 dark:text-amber-100/70">
              Works completely without internet. Survives phone restarts and app kills via IndexedDB storage.
            </p>
          </motion.div>

          <motion.div
            initial={{ y: 20, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="glass-strong rounded-3xl p-6 text-center"
          >
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl glass-primary flex items-center justify-center text-white">
              <Smartphone size={22} />
            </div>
            <h3 className="font-bold text-stone-800 dark:text-amber-50 mb-2">Installable PWA</h3>
            <p className="text-xs text-stone-600 dark:text-amber-100/70">
              Install on Android, iOS, or desktop. Launches like a native app with its own icon and splash screen.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-4 py-16 max-w-2xl mx-auto text-center">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          whileInView={{ y: 0, opacity: 1 }}
          viewport={{ once: true }}
          className="glass-strong rounded-3xl p-8"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <TrendingUp size={24} className="text-amber-500" />
            <h2 className="text-2xl font-bold text-stone-800 dark:text-amber-50">Ready to get started?</h2>
          </div>
          <p className="text-sm text-stone-600 dark:text-amber-100/70 mb-6">
            Set up your shop in under 2 minutes. No signup, no internet required.
          </p>
          <button
            onClick={onGetStarted}
            className="glass-primary rounded-2xl px-8 py-4 font-bold text-white text-lg inline-flex items-center gap-2 shadow-xl active:scale-95 transition-transform"
          >
            Get Started <ArrowRight size={20} />
          </button>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-4 py-8 max-w-4xl mx-auto text-center safe-bottom">
        <div className="glass rounded-2xl py-4 px-4">
          <p className="text-xs font-semibold text-stone-600 dark:text-amber-100/70">
            © {new Date().getFullYear()} ShopSuite. All Rights Reserved.
          </p>
          <p className="text-[10px] text-stone-500 dark:text-amber-100/50 mt-1">
            Developed by Dumindu Wanasinghe
          </p>
        </div>
      </footer>
    </div>
  );
}
