'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, History, ChevronDown, ChevronUp } from 'lucide-react';
import { useI18n, getEditHistory, todayStr, type EditHistoryEntry } from '@/lib/data-hooks-adapter';

type Props = {
  onBack: () => void;
};

/** Group edit history entries by time bucket for easier scanning. */
function bucketHistory(entries: EditHistoryEntry[], lang: string) {
  const today = todayStr();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const oneMonthAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;

  const buckets: { key: string; label: string; entries: EditHistoryEntry[] }[] = [
    { key: 'today', label: 'Today', entries: [] },
    { key: 'yesterday', label: 'Yesterday', entries: [] },
    { key: 'thisWeek', label: 'This Week', entries: [] },
    { key: 'thisMonth', label: 'This Month', entries: [] },
    { key: 'thisYear', label: 'This Year', entries: [] },
    { key: 'older', label: 'Older', entries: [] },
  ];

  for (const e of entries) {
    const eDate = new Date(e.at);
    const eDateStr = `${eDate.getFullYear()}-${String(eDate.getMonth() + 1).padStart(2, '0')}-${String(eDate.getDate()).padStart(2, '0')}`;
    if (eDateStr === today) buckets[0].entries.push(e);
    else if (eDateStr === yesterdayStr) buckets[1].entries.push(e);
    else if (e.at > oneWeekAgo) buckets[2].entries.push(e);
    else if (e.at > oneMonthAgo) buckets[3].entries.push(e);
    else if (e.at > oneYearAgo) buckets[4].entries.push(e);
    else buckets[5].entries.push(e);
  }
  return buckets.filter(b => b.entries.length > 0);
}

const ACTION_COLORS: Record<string, string> = {
  'create': 'bg-green-500',
  'update': 'bg-amber-500',
  'delete': 'bg-red-500',
  'mark-paid': 'bg-cyan-500',
};

export function EditHistoryScreen({ onBack }: Props) {
  const { t, lang } = useI18n();
  const [entries, setEntries] = useState<EditHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBuckets, setExpandedBuckets] = useState<Set<string>>(new Set(['today', 'yesterday']));

  useEffect(() => {
    // Load ALL entries (not just 50)
    getEditHistory(100000).then(all => {
      setEntries(all);
      setLoading(false);
    });
  }, []);

  const buckets = useMemo(() => bucketHistory(entries, lang), [entries, lang]);

  const toggleBucket = (key: string) => {
    setExpandedBuckets(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
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
            <h1 className="text-lg font-bold text-stone-800 dark:text-amber-50">{t('editHistory.title')}</h1>
            <p className="text-xs text-stone-600 dark:text-amber-100/70">{t('editHistory.sub')}</p>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 space-y-3 max-w-2xl mx-auto w-full">
        {/* Total count */}
        <div className="glass rounded-2xl p-3 flex items-center gap-2 text-sm">
          <History size={16} className="text-amber-600 dark:text-amber-400" />
          <span className="text-stone-700 dark:text-amber-100">{t('editHistory.total', { n: entries.length })}</span>
        </div>

        {loading ? (
          <div className="glass rounded-2xl p-8 text-center text-stone-500 dark:text-amber-100/60 text-sm">{t('common.loading')}</div>
        ) : entries.length === 0 ? (
          <div className="glass rounded-2xl p-8 text-center text-stone-500 dark:text-amber-100/60 text-sm">{t('editHistory.empty')}</div>
        ) : (
          buckets.map((bucket) => {
            const isExpanded = expandedBuckets.has(bucket.key);
            return (
              <motion.div
                key={bucket.key}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-strong rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => toggleBucket(bucket.key)}
                  className="w-full px-4 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-stone-800 dark:text-amber-50">{bucket.label}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full glass text-stone-600 dark:text-amber-100/70">
                      {bucket.entries.length}
                    </span>
                  </div>
                  {isExpanded ? <ChevronUp size={16} className="text-stone-400 dark:text-amber-100/40" /> : <ChevronDown size={16} className="text-stone-400 dark:text-amber-100/40" />}
                </button>
                {isExpanded && (
                  <div className="px-3 pb-3 space-y-1.5">
                    {bucket.entries.map((e) => {
                      const actionLabel = t(`editHistory.action.${e.action}`) || e.action;
                      return (
                        <div key={e.id} className="glass rounded-xl p-2.5 flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${ACTION_COLORS[e.action] || 'bg-stone-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-stone-800 dark:text-amber-50">{e.summary}</p>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="text-[10px] px-1.5 py-0.5 rounded glass text-stone-500 dark:text-amber-100/50">
                                {actionLabel}
                              </span>
                              <span className="text-[10px] text-stone-500 dark:text-amber-100/50">
                                {new Date(e.at).toLocaleString('en-US', {
                                  day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            );
          })
        )}
      </main>
    </div>
  );
}
