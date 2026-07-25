'use client';

/**
 * React hooks that expose the local data layer with reactive refresh.
 * Single source of truth for the whole app.
 */

import { useCallback, useEffect, useState } from 'react';
import {
  getSettings, saveSettings,
  getCategories,
  getPriceSessionsForDate, savePriceSession,
  getSalesForDate, saveSale, updateSale, deleteSale,
  getDayRecord, getAllDayRecords, setDayClosed, recalcDay,
  getEditHistory, addEditHistory,
  getActiveCredits, getPaidCredits, saveCredit, markCreditPaid, recordCreditPayment, getCreditPayments,
  getAllSuppliers, saveSupplier, deleteSupplier,
  getPurchasesForSupplier, getPurchasesGroupedByGroup, saveSupplierPurchase, deleteSupplierPurchase,
  getPaymentsForSupplier, saveSupplierPayment,
  getSupplierSummary,
  getAllInventory, getInventoryForCategory,
  todayStr,
  type Settings, type EggCategory, type PriceSession, type Sale, type DayRecord, type EditHistoryEntry, type CreditRecord, type CreditPayment,
  type Supplier, type SupplierPurchase, type SupplierPayment, type SupplierSummary,
} from './db';

export function useSettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const s = await getSettings();
    setSettings(s);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const update = useCallback(async (patch: Partial<Settings>) => {
    const next = await saveSettings(patch);
    setSettings(next);
    return next;
  }, []);

  return { settings, loading, update, refresh };
}

export function useCategories() {
  const [categories, setCategories] = useState<EggCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const c = await getCategories();
    setCategories(c);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { categories, loading, refresh };
}

export function useDayData(date: string) {
  const [day, setDay] = useState<DayRecord | undefined>(undefined);
  const [sales, setSales] = useState<Sale[]>([]);
  const [sessions, setSessions] = useState<PriceSession[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [d, s, p] = await Promise.all([
      getDayRecord(date),
      getSalesForDate(date),
      getPriceSessionsForDate(date),
    ]);
    setDay(d);
    setSales(s);
    setSessions(p);
    setLoading(false);
  }, [date]);

  useEffect(() => { refresh(); }, [refresh]);

  return { day, sales, sessions, loading, refresh };
}

export function useAllDays() {
  const [days, setDays] = useState<DayRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const d = await getAllDayRecords();
    setDays(d);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { days, loading, refresh };
}

export function useEditHistory(limit = 50) {
  const [history, setHistory] = useState<EditHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const h = await getEditHistory(limit);
    setHistory(h);
    setLoading(false);
  }, [limit]);

  useEffect(() => { refresh(); }, [refresh]);

  return { history, loading, refresh };
}

export function useCredits() {
  const [active, setActive] = useState<CreditRecord[]>([]);
  const [paid, setPaid] = useState<CreditRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [a, p] = await Promise.all([
      getActiveCredits(),
      getPaidCredits(),
    ]);
    setActive(a);
    setPaid(p);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { active, paid, loading, refresh, saveCredit, markCreditPaid };
}

export function useSuppliers() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const s = await getAllSuppliers();
    setSuppliers(s);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { suppliers, loading, refresh, saveSupplier, deleteSupplier };
}

export function useSupplierData(supplierId: string | null) {
  const [summary, setSummary] = useState<SupplierSummary | null>(null);
  const [purchases, setPurchases] = useState<SupplierPurchase[]>([]);
  const [purchaseGroups, setPurchaseGroups] = useState<{ groupId: string; date: string; at: number; items: SupplierPurchase[]; totalCost: number; totalEggs: number; totalPaid: number; totalRemaining: number; allPaid: boolean }[]>([]);
  const [payments, setPayments] = useState<SupplierPayment[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!supplierId) {
      setSummary(null);
      setPurchases([]);
      setPurchaseGroups([]);
      setPayments([]);
      setLoading(false);
      return;
    }
    const [sum, p, groups, pm] = await Promise.all([
      getSupplierSummary(supplierId),
      getPurchasesForSupplier(supplierId),
      getPurchasesGroupedByGroup(supplierId),
      getPaymentsForSupplier(supplierId),
    ]);
    setSummary(sum);
    setPurchases(p);
    setPurchaseGroups(groups);
    setPayments(pm);
    setLoading(false);
  }, [supplierId]);

  useEffect(() => { refresh(); }, [refresh]);

  return {
    summary, purchases, purchaseGroups, payments, loading, refresh,
    saveSupplierPurchase, deleteSupplierPurchase, saveSupplierPayment,
  };
}

export function useInventory() {
  const [inventory, setInventory] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const inv = await getAllInventory();
    setInventory(inv);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  return { inventory, loading, refresh, getInventoryForCategory };
}
