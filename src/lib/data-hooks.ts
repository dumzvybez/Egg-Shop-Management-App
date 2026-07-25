'use client';

/**
 * Convenience re-exports so dashboard/components can import everything from one place.
 * Thin adapter over @/lib/db and @/lib/sinhala.
 */

import {
  getSettings, saveSettings,
  getCategories,
  getPriceSessionsForDate, getPriceSessionsForDateRange, savePriceSession, getLatestPriceSessionForCategory, isCategoryUnavailable,
  getSalesForDate, getSalesForDateRange, saveSale, updateSale, deleteSale,
  getDayRecord, getAllDayRecords, getDayRecordsForRange, setDayClosed, recalcDay,
  getEditHistory, addEditHistory,
  exportBackup, importBackup,
  detectMissedDays, getMonthSummary,
  getAllCredits, getActiveCredits, getPaidCredits, saveCredit, markCreditPaid, recordCreditPayment, getCreditPayments, getAllCreditPayments,
  getAllSuppliers, getSupplier, saveSupplier, deleteSupplier,
  getPurchasesForSupplier, getActivePurchasesForSupplier, getPaidPurchasesForSupplier, getPurchase, getAllSupplierPurchasesForDateRange, getPurchasesGroupedByGroup,
  saveSupplierPurchase, deleteSupplierPurchase,
  getPaymentsForSupplier, getPaymentsForPurchase, saveSupplierPayment,
  getSupplierSummary,
  getAllInventory, getInventoryForCategory, adjustInventory, setInventory,
  getAllExpenses, getExpensesForDateRange, saveExpense, deleteExpense,
  getDamagesForDate, getDamagesForDateRange, getAllDamages, saveDamage, deleteDamage,
  getAllStockMovements, getStockMovementsForCategory,
  todayStr, toDateStr, addDays, genId,
  type Settings, type EggCategory, type PriceSession, type Sale, type DayRecord, type EditHistoryEntry, type MonthSummary, type CreditRecord, type CreditPayment,
  type Supplier, type SupplierPurchase, type SupplierPayment, type SupplierSummary, type Inventory, type Expense, type DamageRecord, type StockMovement,
} from './db';

import {
  formatDate, formatDateShort, formatDateLong, formatMonth,
  formatNumber, formatCurrency, relativeDayLabel,
  SINHALA_MONTHS, SINHALA_DAYS, ENGLISH_MONTHS, ENGLISH_DAYS,
} from './sinhala';

export {
  getSettings, saveSettings,
  getCategories,
  getPriceSessionsForDate, getPriceSessionsForDateRange, savePriceSession, getLatestPriceSessionForCategory, isCategoryUnavailable,
  getSalesForDate, getSalesForDateRange, saveSale, updateSale, deleteSale,
  getDayRecord, getAllDayRecords, getDayRecordsForRange, setDayClosed, recalcDay,
  getEditHistory, addEditHistory,
  exportBackup, importBackup,
  detectMissedDays, getMonthSummary,
  getAllCredits, getActiveCredits, getPaidCredits, saveCredit, markCreditPaid, recordCreditPayment, getCreditPayments, getAllCreditPayments,
  getAllSuppliers, getSupplier, saveSupplier, deleteSupplier,
  getPurchasesForSupplier, getActivePurchasesForSupplier, getPaidPurchasesForSupplier, getPurchase, getAllSupplierPurchasesForDateRange, getPurchasesGroupedByGroup,
  saveSupplierPurchase, deleteSupplierPurchase,
  getPaymentsForSupplier, getPaymentsForPurchase, saveSupplierPayment,
  getSupplierSummary,
  getAllInventory, getInventoryForCategory, adjustInventory, setInventory,
  getAllExpenses, getExpensesForDateRange, saveExpense, deleteExpense,
  getDamagesForDate, getDamagesForDateRange, getAllDamages, saveDamage, deleteDamage,
  getAllStockMovements, getStockMovementsForCategory,
  todayStr, toDateStr, addDays, genId,
  formatDate, formatDateShort, formatDateLong, formatMonth,
  formatNumber, formatCurrency, relativeDayLabel,
  SINHALA_MONTHS, SINHALA_DAYS, ENGLISH_MONTHS, ENGLISH_DAYS,
};

export type {
  Settings, EggCategory, PriceSession, Sale, DayRecord, EditHistoryEntry, MonthSummary, CreditRecord, CreditPayment,
  Supplier, SupplierPurchase, SupplierPayment, SupplierSummary, Inventory, Expense, DamageRecord, StockMovement,
};

export {
  useSettings, useCategories, useDayData, useAllDays, useEditHistory, useCredits,
  useSuppliers, useSupplierData, useInventory,
} from './use-data';
