'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Plus, Phone, ChevronRight, User, Trash2, Pencil, X } from 'lucide-react';
import {
  useSuppliers, useI18n,
  saveSupplier, deleteSupplier, genId,
  type Supplier,
} from '@/lib/data-hooks-adapter';
import { useAppToast } from './toast-provider';

type Props = {
  onBack: () => void;
  onOpenSupplier: (supplierId: string) => void;
};

export function SuppliersScreen({ onBack, onOpenSupplier }: Props) {
  const { t } = useI18n();
  const { suppliers, loading, refresh } = useSuppliers();
  const { toast } = useAppToast();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

  const handleDelete = async (s: Supplier) => {
    if (!confirm(t('supplier.deleteConfirm'))) return;
    await deleteSupplier(s.id);
    await refresh();
    toast({ title: t('supplier.deleted.title'), variant: 'success' });
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
            <h1 className="text-lg font-bold text-stone-800 dark:text-amber-50">{t('supplier.title')}</h1>
            <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('supplier.sub')}</p>
          </div>
          <button
            onClick={() => { setEditing(null); setShowForm(true); }}
            className="w-10 h-10 rounded-full glass-primary flex items-center justify-center text-white active:scale-90 transition-transform"
            aria-label={t('supplier.add')}
          >
            <Plus size={20} />
          </button>
        </div>
      </header>

      <main className="px-4 py-4 space-y-4 max-w-2xl mx-auto w-full">
        {loading ? (
          <div className="glass rounded-2xl p-8 text-center text-stone-500 dark:text-amber-100/60 text-sm">
            {t('common.loading')}
          </div>
        ) : suppliers.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-stone-500 dark:text-amber-100/60 text-sm">
            {t('supplier.noSuppliers')}
          </div>
        ) : (
          <div className="space-y-2">
            {suppliers.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.4) }}
                className="glass rounded-2xl p-3.5 flex items-center gap-3"
              >
                <div
                  onClick={() => onOpenSupplier(s.id)}
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="w-12 h-12 rounded-xl glass-primary flex items-center justify-center text-white flex-shrink-0">
                    <User size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-stone-800 dark:text-amber-50 truncate">{s.name}</p>
                    {s.phone && (
                      <p className="text-xs text-stone-600 dark:text-amber-100/70 mt-0.5 flex items-center gap-1">
                        <Phone size={10} /> {s.phone}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={16} className="text-stone-400 dark:text-amber-100/40 flex-shrink-0" />
                </div>
                {s.phone && (
                  <a
                    href={`tel:${s.phone}`}
                    className="w-9 h-9 rounded-xl glass-success flex items-center justify-center text-white flex-shrink-0 active:scale-90 transition-transform"
                    aria-label={t('supplier.callSupplier')}
                  >
                    <Phone size={14} />
                  </a>
                )}
                <button
                  onClick={() => { setEditing(s); setShowForm(true); }}
                  className="w-9 h-9 rounded-xl glass flex items-center justify-center text-stone-700 dark:text-amber-50 flex-shrink-0 active:scale-90 transition-transform"
                  aria-label={t('supplier.editSupplier')}
                >
                  <Pencil size={14} />
                </button>
                <button
                  onClick={() => handleDelete(s)}
                  className="w-9 h-9 rounded-xl glass-danger flex items-center justify-center text-white flex-shrink-0 active:scale-90 transition-transform"
                  aria-label={t('supplier.deleteSupplier')}
                >
                  <Trash2 size={14} />
                </button>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <SupplierForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditing(null); }}
        onSaved={() => { setShowForm(false); setEditing(null); refresh(); }}
        editing={editing}
      />
    </div>
  );
}

function SupplierForm({ open, onClose, onSaved, editing }: {
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
  editing: Supplier | null;
}) {
  const { t } = useI18n();
  const { toast } = useAppToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Sync form whenever the form opens or the editing target changes
  useEffect(() => {
    if (open) {
      setName(editing?.name || '');
      setPhone(editing?.phone || '');
      setNotes(editing?.notes || '');
    }
  }, [open, editing]);

  const handleSave = async () => {
    if (!name.trim()) {
      toast({ title: t('supplier.err.name'), variant: 'warning' });
      return;
    }
    setSaving(true);
    try {
      const supplier: Supplier = {
        id: editing?.id || genId(),
        name: name.trim(),
        phone: phone.trim() || undefined,
        notes: notes.trim() || undefined,
        createdAt: editing?.createdAt || Date.now(),
      };
      await saveSupplier(supplier);
      toast({
        title: t('supplier.saved.title'),
        description: t('supplier.saved.desc', { name: supplier.name }),
        variant: 'success',
      });
      onSaved();
    } catch (e: any) {
      toast({ title: t('toast.error'), description: e?.message, variant: 'error' });
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    setName(''); setPhone(''); setNotes('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-sm" onClick={handleClose} />
          <motion.div
            className="relative w-full sm:max-w-md glass-strong rounded-3xl overflow-hidden"
            initial={{ scale: 0.95, opacity: 0.6 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
          >
            <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-white/30">
              <h2 className="text-lg font-bold text-stone-800 dark:text-amber-50">
                {editing ? t('supplier.edit') : t('supplier.add')}
              </h2>
              <button onClick={handleClose} className="w-9 h-9 rounded-full glass flex items-center justify-center text-stone-700 dark:text-amber-50 active:scale-90 transition-transform">
                <X size={18} />
              </button>
            </div>
            <div className="px-5 py-4 space-y-3">
              <div>
                <label className="text-xs text-stone-600 dark:text-amber-100/70 mb-1 block">{t('supplier.name')}</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('supplier.namePlaceholder')}
                  className="w-full px-3 py-3 rounded-xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 text-stone-800 dark:text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="text-xs text-stone-600 dark:text-amber-100/70 mb-1 block">{t('supplier.phone')}</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder={t('supplier.phonePlaceholder')}
                  className="w-full px-3 py-3 rounded-xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 text-stone-800 dark:text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400"
                />
              </div>
              <div>
                <label className="text-xs text-stone-600 dark:text-amber-100/70 mb-1 block">{t('supplier.notes')}</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder={t('supplier.notesPlaceholder')}
                  rows={3}
                  className="w-full px-3 py-3 rounded-xl bg-white/70 dark:bg-white/5 border border-white/80 dark:border-white/10 text-stone-800 dark:text-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-white/30 glass-tint grid grid-cols-2 gap-3">
              <button
                onClick={handleClose}
                className="glass rounded-2xl py-3 font-semibold text-stone-700 dark:text-amber-100 active:scale-95 transition-transform"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="glass-primary rounded-2xl py-3 font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-transform disabled:opacity-60"
              >
                {saving ? (
                  <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  t('supplier.save')
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
