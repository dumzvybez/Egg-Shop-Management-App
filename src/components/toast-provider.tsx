'use client';

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Toast = {
  id: string;
  title: string;
  description?: string;
  variant?: 'success' | 'error' | 'info' | 'warning';
};

type ToastCtx = {
  toast: (t: Omit<Toast, 'id'>) => void;
  dismiss: (id: string) => void;
};

const Ctx = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismiss = (id: string) => setToasts((t) => t.filter((x) => x.id !== id));

  const toast = (t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((cur) => [...cur, { ...t, id }]);
    setTimeout(() => dismiss(id), 3500);
  };

  return (
    <Ctx.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed top-0 left-0 right-0 z-[200] flex flex-col items-center gap-2 p-3 safe-top pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            onClick={() => dismiss(t.id)}
            className={`glass-strong animate-pop-in rounded-2xl px-4 py-3 max-w-md w-full pointer-events-auto cursor-pointer flex items-start gap-3 ${
              t.variant === 'success' ? 'border-green-300/70'
              : t.variant === 'error' ? 'border-red-300/70'
              : t.variant === 'warning' ? 'border-amber-300/70'
              : 'border-white/40'
            }`}
          >
            <div className={`mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
              t.variant === 'success' ? 'bg-green-500'
              : t.variant === 'error' ? 'bg-red-500'
              : t.variant === 'warning' ? 'bg-amber-500'
              : 'bg-amber-500'
            }`} />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-stone-800 dark:text-amber-50">{t.title}</p>
              {t.description && (
                <p className="text-xs text-stone-600 dark:text-amber-100/70 mt-0.5">{t.description}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export function useAppToast() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAppToast must be used within ToastProvider');
  return ctx;
}
