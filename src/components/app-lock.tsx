'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Fingerprint, Delete, ArrowRight, ShieldCheck } from 'lucide-react';
import { useI18n } from '@/lib/i18n-context';
import { getSettings, saveSettings } from '@/lib/db';

/**
 * App Lock — full-screen overlay shown when appLockEnabled is true.
 * Blocks all app access until the user enters the correct PIN or
 * authenticates via biometrics (WebAuthn).
 *
 * v3.1 — new feature.
 */

type Props = {
  onUnlocked: () => void;
};

export function AppLock({ onUnlocked }: Props) {
  const { t } = useI18n();
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [correctPin, setCorrectPin] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    (async () => {
      const s = await getSettings();
      setCorrectPin(s.appLockPin);
      setBiometricEnabled(s.appLockBiometric);
      // Check WebAuthn availability
      if (s.appLockBiometric && 'PublicKeyCredential' in window) {
        try {
          const available = await (PublicKeyCredential as any).isUserVerifyingPlatformAuthenticatorAvailable?.();
          setBiometricAvailable(!!available);
        } catch {
          setBiometricAvailable(false);
        }
      }
    })();
  }, []);

  const handleBiometric = async () => {
    if (!biometricAvailable) return;
    try {
      // Use WebAuthn platform authenticator for biometric prompt
      const challenge = new Uint8Array(32);
      crypto.getRandomValues(challenge);
      const credential = await navigator.credentials.get({
        publicKey: {
          challenge,
          timeout: 60000,
          userVerification: 'required',
          allowCredentials: [],
        },
      } as any);
      if (credential) {
        onUnlocked();
      }
    } catch {
      // User cancelled or biometric failed — fall back to PIN
    }
  };

  // Auto-trigger biometric on mount if enabled
  useEffect(() => {
    if (biometricAvailable && biometricEnabled) {
      handleBiometric();
    }
  }, [biometricAvailable, biometricEnabled]);

  const handleDigit = (d: string) => {
    if (pin.length >= 8) return;
    setError(false);
    const next = pin + d;
    setPin(next);
    if (next.length >= 4 && next === correctPin) {
      setTimeout(() => onUnlocked(), 150);
    } else if (next.length >= (correctPin?.length || 4) || next.length >= 8) {
      // Wrong PIN or max length reached
      setTimeout(() => {
        setError(true);
        setPin('');
        setAttempts((a) => a + 1);
      }, 200);
    }
  };

  const handleDelete = () => {
    setPin((p) => p.slice(0, -1));
    setError(false);
  };

  const shake = error;
  const dots = Array.from({ length: correctPin?.length || 4 }, (_, i) => i);

  return (
    <motion.div
      className="fixed inset-0 z-[300] app-body flex flex-col items-center justify-center px-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="w-full max-w-xs">
        {/* Logo + title */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', damping: 20, stiffness: 200 }}
            className="w-16 h-16 mx-auto mb-4 rounded-3xl glass-primary flex items-center justify-center text-white shadow-xl"
          >
            <ShieldCheck size={28} />
          </motion.div>
          <h1 className="text-xl font-bold text-stone-800 dark:text-amber-50">ShopSuite</h1>
          <p className="text-xs text-stone-500 dark:text-amber-100/60 mt-1">Enter your PIN to unlock</p>
        </div>

        {/* PIN dots */}
        <motion.div
          className="flex items-center justify-center gap-3 mb-8"
          animate={shake ? { x: [-8, 8, -8, 8, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          {dots.map((i) => (
            <div
              key={i}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                error
                  ? 'border-red-500 bg-red-500/20'
                  : i < pin.length
                  ? 'border-amber-500 bg-amber-500'
                  : 'border-stone-400 dark:border-amber-100/30'
              }`}
            />
          ))}
        </motion.div>

        {/* Error message */}
        <div className="h-6 text-center mb-4">
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs font-semibold text-red-500"
            >
              {attempts >= 3 ? 'Too many attempts. Try again.' : 'Wrong PIN. Try again.'}
            </motion.p>
          )}
        </div>

        {/* Number pad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              onClick={() => handleDigit(d)}
              className="aspect-square glass-strong rounded-2xl text-xl font-bold text-stone-800 dark:text-amber-50 flex items-center justify-center active:scale-90 transition-transform"
            >
              {d}
            </button>
          ))}
          <button
            onClick={handleBiometric}
            disabled={!biometricAvailable}
            className={`aspect-square rounded-2xl flex items-center justify-center transition-transform ${
              biometricAvailable
                ? 'glass-info text-white active:scale-90'
                : 'glass text-stone-300 dark:text-amber-100/20 cursor-not-allowed'
            }`}
            aria-label="Use biometric"
          >
            <Fingerprint size={22} />
          </button>
          <button
            onClick={() => handleDigit('0')}
            className="aspect-square glass-strong rounded-2xl text-xl font-bold text-stone-800 dark:text-amber-50 flex items-center justify-center active:scale-90 transition-transform"
          >
            0
          </button>
          <button
            onClick={handleDelete}
            className="aspect-square glass rounded-2xl text-stone-700 dark:text-amber-100 flex items-center justify-center active:scale-90 transition-transform"
            aria-label="Delete"
          >
            <Delete size={20} />
          </button>
        </div>

        <p className="text-center text-[10px] text-stone-400 dark:text-amber-100/40">
          <Lock size={10} className="inline mr-1" />
          Your data is protected on this device
        </p>
      </div>
    </motion.div>
  );
}

// ─── PIN setup dialog (used in onboarding + settings) ───────────────────────

type SetupProps = {
  open: boolean;
  onClose: () => void;
  onSaved: (pin: string) => void;
  title?: string;
};

export function PinSetupDialog({ open, onClose, onSaved, title = 'Set App Lock PIN' }: SetupProps) {
  const { t } = useI18n();
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setStep('enter');
      setPin1('');
      setPin2('');
      setError('');
    }
  }, [open]);

  const handleDigit = (d: string) => {
    setError('');
    const maxLen = 8;
    if (step === 'enter') {
      if (pin1.length >= maxLen) return;
      const next = pin1 + d;
      setPin1(next);
      if (next.length >= 4) {
        setTimeout(() => setStep('confirm'), 150);
      }
    } else {
      if (pin2.length >= maxLen) return;
      const next = pin2 + d;
      setPin2(next);
      if (next.length >= 4 && next === pin1) {
        setTimeout(() => onSaved(next), 150);
      } else if (next.length >= pin1.length) {
        setTimeout(() => {
          setError('PINs do not match. Start again.');
          setStep('enter');
          setPin1('');
          setPin2('');
        }, 200);
      }
    }
  };

  const handleDelete = () => {
    setError('');
    if (step === 'enter') setPin1((p) => p.slice(0, -1));
    else setPin2((p) => p.slice(0, -1));
  };

  const currentPin = step === 'enter' ? pin1 : pin2;
  const dots = Array.from({ length: 4 }, (_, i) => i);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            className="relative w-full max-w-xs glass-strong rounded-3xl p-6"
            initial={{ scale: 0.9, opacity: 0.6 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-3 rounded-2xl glass-primary flex items-center justify-center text-white">
                <Lock size={20} />
              </div>
              <h2 className="text-base font-bold text-stone-800 dark:text-amber-50">{title}</h2>
              <p className="text-xs text-stone-500 dark:text-amber-100/60 mt-1">
                {step === 'enter' ? 'Enter a 4–8 digit PIN' : 'Confirm your PIN'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-3 mb-6">
              {dots.map((i) => (
                <div
                  key={i}
                  className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                    i < currentPin.length
                      ? 'border-amber-500 bg-amber-500'
                      : 'border-stone-400 dark:border-amber-100/30'
                  }`}
                />
              ))}
            </div>

            <div className="h-5 text-center mb-3">
              {error && <p className="text-xs font-semibold text-red-500">{error}</p>}
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
                <button
                  key={d}
                  onClick={() => handleDigit(d)}
                  className="aspect-square glass rounded-xl text-lg font-bold text-stone-800 dark:text-amber-50 flex items-center justify-center active:scale-90 transition-transform"
                >
                  {d}
                </button>
              ))}
              <div />
              <button
                onClick={() => handleDigit('0')}
                className="aspect-square glass rounded-xl text-lg font-bold text-stone-800 dark:text-amber-50 flex items-center justify-center active:scale-90 transition-transform"
              >
                0
              </button>
              <button
                onClick={handleDelete}
                className="aspect-square glass rounded-xl text-stone-700 dark:text-amber-100 flex items-center justify-center active:scale-90 transition-transform"
              >
                <Delete size={18} />
              </button>
            </div>

            <button
              onClick={onClose}
              className="w-full mt-4 text-xs text-stone-500 dark:text-amber-100/60 py-2"
            >
              Cancel
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
