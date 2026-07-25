'use client';

/**
 * Adapter that re-exports data hooks AND the i18n hook in one import.
 * Keeps component code clean.
 */

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
} from './data-hooks';

export type {
  Settings, EggCategory, PriceSession, Sale, DayRecord, EditHistoryEntry, MonthSummary, CreditRecord, CreditPayment,
  Supplier, SupplierPurchase, SupplierPayment, SupplierSummary, Inventory, Expense, DamageRecord, StockMovement,
} from './data-hooks';

export {
  useSettings, useCategories, useDayData, useAllDays, useEditHistory, useCredits,
  useSuppliers, useSupplierData, useInventory,
} from './use-data';
export { useI18n } from './i18n-context';
export { useThemeSync, applyThemeAndLang } from './use-theme';
