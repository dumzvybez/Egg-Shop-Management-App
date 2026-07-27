'use client';

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

type Toast = {
  id: string;
  title: string;
  description?: string;
  variant: ToastVariant;
};

type ToastInput = {
  title: string;
  description?: string;
  variant?: ToastVariant;
};

type ToastCtx = {
  toast: (t: ToastInput) => void;
  dismiss: (id: string) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((t: ToastInput) => {
    const id = Math.random().toString(36).slice(2);
    const variant = t.variant || 'info';
    setToasts((prev) => [...prev, { id, title: t.title, description: t.description, variant }]);
    setTimeout(() => dismiss(id), 3500);
  }, [dismiss]);

  const variantStyles: Record<ToastVariant, { border: string; dot: string }> = {
    success: { border: 'border-green-300/70', dot: 'bg-green-500' },
    error: { border: 'border-red-300/70', dot: 'bg-red-500' },
    warning: { border: 'border-amber-300/70', dot: 'bg-amber-500' },
    info: { border: 'border-white/40', dot: 'bg-amber-500' },
  };

  return (
    <Ctx.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed top-0 left-0 right-0 z-[200] safe-top pointer-events-none flex flex-col items-center px-4 pt-2 gap-2">
        {toasts.map((t) => {
          const v = variantStyles[t.variant];
          return (
            <button
              key={t.id}
              onClick={() => dismiss(t.id)}
              className={`glass-strong rounded-2xl px-4 py-3 shadow-xl max-w-md w-full text-left pointer-events-auto cursor-pointer animate-pop-in border-l-4 ${v.border}`}
            >
              <div className="flex items-start gap-2">
                <span className={`w-2 h-2 rounded-full ${v.dot} mt-1.5 flex-shrink-0`} />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-stone-800 dark:text-amber-50">{t.title}</p>
                  {t.description && (
                    <p className="text-xs text-stone-600 dark:text-amber-100/70 mt-0.5">{t.description}</p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </Ctx.Provider>
  );
}

export function useAppToast(): ToastCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppToast must be used within ToastProvider');
  return ctx;
}
