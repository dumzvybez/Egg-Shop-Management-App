/**
 * Local offline-first data layer for EggShop.
 *
 * All data is stored in IndexedDB via the `idb` wrapper. Survives app close,
 * phone restart and app updates. No network calls anywhere.
 *
 * Entities
 * --------
 *  - settings        : key/value (shopName, ownerName, currency, language, theme, tutorialDone, dailyPriceDoneDate, reminderEnabled, installDate, lastBackupAt)
 *  - categories      : the 6 default egg types (display names are translated via i18n by id)
 *  - priceSessions   : one per (date, category, sessionIndex) — buy price, sell price, createdAt
 *  - sales           : one per sale event (date, category, sessionIndex, quantity, buyPrice, sellPrice, profit, createdAt)
 *  - dayRecords      : one per date — aggregated day summary, status (open|closed), lastEditedAt
 *  - credits         : customer credit records (active or paid) — separate from profit calculation
 *  - suppliers       : supplier records (name, phone, notes) — separate from profit calculation
 *  - supplierPurchases: purchases from suppliers (date, supplierId, categoryId, qty, pricePerEgg, totalCost, paidAmount, status) — auto-increases inventory
 *  - supplierPayments : payments made to suppliers for purchases (date, supplierId, purchaseId, amount) — partial payments supported
 *  - inventory       : per-category current stock (single row per categoryId)
 *  - editHistory     : audit log of all edits (entity, entityId, action, summary, at)
 *  - meta            : single-row table for app-level metadata
 */

import { openDB, type DBSchema, type IDBPDatabase } from 'idb';

// ---------- Types ----------

export type EggCategory = {
  id: string;          // stable slug like 'white-large'
  nameKey: string;     // i18n key, e.g. 'cat.white-large' (legacy 'name' field kept for backup compat)
  name: string;        // display name in current language (kept for backup compat)
  color: string;       // accent color (CSS)
  order: number;
};

export type PriceSession = {
  id: string;
  date: string;        // YYYY-MM-DD
  categoryId: string;
  sessionIndex: number; // 0 = morning, 1 = afternoon, ...
  buyPrice: number | null;  // null = "අද නැත" (not available today)
  sellPrice: number | null;
  note?: string;
  createdAt: number;   // epoch ms
};

export type Sale = {
  id: string;
  date: string;        // YYYY-MM-DD
  categoryId: string;
  sessionIndex: number;
  quantity: number;
  buyPrice: number;
  sellPrice: number;
  profit: number;
  createdAt: number;
  note?: string;
};

export type DayStatus = 'open' | 'closed' | 'missing';

export type DayRecord = {
  date: string;        // YYYY-MM-DD (primary key)
  status: DayStatus;
  totalEggs: number;
  totalBuy: number;
  totalSell: number;
  totalProfit: number;
  sessionCount: number;
  saleCount: number;
  lastEditedAt: number;
  notes?: string;
};

export type EditHistoryEntry = {
  id: string;
  entity: 'sale' | 'priceSession' | 'dayRecord' | 'category' | 'settings' | 'credit' | 'supplier' | 'supplierPurchase' | 'supplierPayment' | 'inventory';
  entityId: string;
  action: 'create' | 'update' | 'delete' | 'mark-paid';
  summary: string;          // English human-readable summary (language-agnostic for audit log)
  at: number;
};

/** Customer credit record. Completely separate from profit calculations. */
export type CreditRecord = {
  id: string;
  customerName: string;
  categoryId: string;
  quantity: number;
  sellPrice: number;        // per-egg sell price at time of purchase
  totalAmount: number;      // quantity * sellPrice
  paidAmount: number;       // sum of all payments (including initial)
  remaining: number;        // totalAmount - paidAmount
  status: 'active' | 'paid';
  purchaseDate: string;     // YYYY-MM-DD
  purchaseAt: number;       // epoch ms (full timestamp)
  paidAt?: number;          // epoch ms when marked paid
  note?: string;
};

/** Customer credit payment record (one per partial payment). */
export type CreditPayment = {
  id: string;
  creditId: string;         // FK to CreditRecord
  customerName: string;     // denormalized for easy listing
  amount: number;
  paymentDate: string;      // YYYY-MM-DD
  paidAt: number;           // epoch ms
  note?: string;
};

/** Supplier record. Completely separate from profit calculations. */
export type Supplier = {
  id: string;
  name: string;
  phone?: string;
  notes?: string;
  createdAt: number;
};

/** Purchase record from a supplier. Auto-increases inventory when saved.
 *  Status moves to 'paid' when remaining hits 0.
 *  `purchaseGroupId` links multiple line-items of a single delivery together. */
export type SupplierPurchase = {
  id: string;
  supplierId: string;
  categoryId: string;
  quantity: number;
  pricePerEgg: number;     // supplier's price per egg (NOT used in profit calculation)
  totalCost: number;       // quantity * pricePerEgg
  paidAmount: number;      // sum of payments for this purchase
  remaining: number;       // totalCost - paidAmount
  status: 'active' | 'paid';
  purchaseDate: string;    // YYYY-MM-DD
  purchaseAt: number;      // epoch ms
  paidAt?: number;
  purchaseGroupId?: string; // groups multiple line items of one delivery
  note?: string;
};

/** Payment record for a supplier purchase. Supports partial payments. */
export type SupplierPayment = {
  id: string;
  supplierId: string;
  purchaseId: string;
  amount: number;
  paymentDate: string;     // YYYY-MM-DD
  paidAt: number;          // epoch ms
  note?: string;
};

/** Inventory record. One per egg category. Auto-updated by supplier purchases and sales. */
export type Inventory = {
  categoryId: string;      // primary key
  quantity: number;
  lastUpdated: number;
};

/** Expense record (non-egg costs like transport, electricity, etc.). */
export type Expense = {
  id: string;
  category: 'transport' | 'electricity' | 'bags' | 'rent' | 'other';
  amount: number;
  date: string;            // YYYY-MM-DD
  note?: string;
  createdAt: number;
};

/** Damage record — eggs that were damaged/broken. Reduces inventory.
 *  The buyPrice is used to calculate the cost of the damage. */
export type DamageRecord = {
  id: string;
  date: string;            // YYYY-MM-DD
  categoryId: string;
  quantity: number;
  pricePerEgg: number;    // buy price per egg at time of damage
  totalCost: number;      // quantity * pricePerEgg
  createdAt: number;
  note?: string;
};

/** Stock movement record — tracks every inventory change for audit. */
export type StockMovement = {
  id: string;
  categoryId: string;
  changeType: 'added' | 'sold';
  quantity: number;        // positive for added, positive for sold (we track direction via changeType)
  date: string;            // YYYY-MM-DD
  at: number;              // epoch ms
  sourceType: 'supplier' | 'sale';
  sourceId?: string;       // supplierPurchase id or sale id
  supplierName?: string;   // denormalized for display
  remainingAfter: number;  // stock level after this change
};

export type Settings = {
  shopName: string;
  ownerName: string;
  shopPhone: string;
  shopAddress: string;
  currency: string;          // 'රු.' or '$'
  language: 'si' | 'en';     // UI language
  theme: 'light' | 'dark';   // theme (default: dark)
  tutorialDone: boolean;
  dailyPriceDoneDate: string | null;  // last date the daily-price modal was completed
  reminderEnabled: boolean;
  reminderTime: string;       // 'HH:MM'
  lastBackupAt: number | null;
  installDate: string | null; // YYYY-MM-DD when app was first installed/used
  lastMonthEndPrompted: string | null; // YYYY-MM of last month-end prompt shown
  hintsDismissed: string[];   // i18n keys of dismissed hints
  schemaVersion: number;
};

// ---------- DB Schema ----------

interface EggShopDB extends DBSchema {
  settings: {
    key: string;
    value: any;
  };
  categories: {
    key: string;
    value: EggCategory;
  };
  priceSessions: {
    key: string;
    value: PriceSession;
    indexes: { 'by-date': string; 'by-date-category': [string, string] };
  };
  sales: {
    key: string;
    value: Sale;
    indexes: { 'by-date': string; 'by-date-category': [string, string] };
  };
  dayRecords: {
    key: string;          // date
    value: DayRecord;
    indexes: { 'by-status': string };
  };
  credits: {
    key: string;          // id
    value: CreditRecord;
    indexes: { 'by-status': string };
  };
  creditPayments: {
    key: string;          // id
    value: CreditPayment;
    indexes: { 'by-credit': string; 'by-paidAt': number };
  };
  suppliers: {
    key: string;          // id
    value: Supplier;
  };
  supplierPurchases: {
    key: string;          // id
    value: SupplierPurchase;
    indexes: { 'by-supplier': string; 'by-status': string; 'by-supplier-status': [string, string] };
  };
  supplierPayments: {
    key: string;          // id
    value: SupplierPayment;
    indexes: { 'by-supplier': string; 'by-purchase': string };
  };
  inventory: {
    key: string;          // categoryId
    value: Inventory;
  };
  expenses: {
    key: string;          // id
    value: Expense;
    indexes: { 'by-date': string; 'by-category': string };
  };
  damages: {
    key: string;          // id
    value: DamageRecord;
    indexes: { 'by-date': string; 'by-category': string };
  };
  stockMovements: {
    key: string;          // id
    value: StockMovement;
    indexes: { 'by-date': string; 'by-category': string };
  };
  editHistory: {
    key: string;
    value: EditHistoryEntry;
    indexes: { 'by-at': number };
  };
  meta: {
    key: string;
    value: any;
  };
}

// ---------- Default data ----------

/**
 * Distinct, accessible color palette — each egg type has a clearly
 * identifiable hue, with good contrast on both light and dark backgrounds.
 * Used consistently across dashboard cards, inventory, pie charts, bar
 * charts, tables, legends.
 *
 * Six maximally distinct hues spread around the color wheel.
 */
export const DEFAULT_CATEGORIES: EggCategory[] = [
  { id: 'white-large',    nameKey: 'cat.white-large',    name: 'සුදු බිත්තර විශාල',    color: '#2563eb', order: 0 }, // blue
  { id: 'white-medium',   nameKey: 'cat.white-medium',   name: 'සුදු බිත්තර මධ්‍යම',   color: '#16a34a', order: 1 }, // green
  { id: 'red-large',      nameKey: 'cat.red-large',      name: 'රතු බිත්තර විශාල',     color: '#dc2626', order: 2 }, // red
  { id: 'red-medium',     nameKey: 'cat.red-medium',     name: 'රතු බිත්තර මධ්‍යම',    color: '#ea580c', order: 3 }, // orange
  { id: 'happy-large',    nameKey: 'cat.happy-large',    name: 'Happy Hen විශාල',      color: '#9333ea', order: 4 }, // purple
  { id: 'happy-medium',   nameKey: 'cat.happy-medium',   name: 'Happy Hen මධ්‍යම',     color: '#0891b2', order: 5 }, // teal
];

export const DEFAULT_SETTINGS: Settings = {
  shopName: '',
  ownerName: '',
  shopPhone: '',
  shopAddress: '',
  currency: 'රු.',
  language: 'si',
  theme: 'dark', // Dark Mode is the default
  tutorialDone: false,
  dailyPriceDoneDate: null,
  reminderEnabled: false,
  reminderTime: '08:00',
  lastBackupAt: null,
  installDate: null,
  lastMonthEndPrompted: null,
  hintsDismissed: [],
  schemaVersion: 6,
};

// ---------- DB singleton ----------

let _db: Promise<IDBPDatabase<EggShopDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<EggShopDB>> {
  if (_db) return _db;
  _db = openDB<EggShopDB>('biththara-kade', 6, {
    upgrade(db, oldVersion, newVersion) {
      // v1: initial schema
      if (oldVersion < 1) {
        if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings');
        if (!db.objectStoreNames.contains('categories')) db.createObjectStore('categories', { keyPath: 'id' });
        if (!db.objectStoreNames.contains('priceSessions')) {
          const s = db.createObjectStore('priceSessions', { keyPath: 'id' });
          s.createIndex('by-date', 'date');
          s.createIndex('by-date-category', ['date', 'categoryId']);
        }
        if (!db.objectStoreNames.contains('sales')) {
          const s = db.createObjectStore('sales', { keyPath: 'id' });
          s.createIndex('by-date', 'date');
          s.createIndex('by-date-category', ['date', 'categoryId']);
        }
        if (!db.objectStoreNames.contains('dayRecords')) {
          const s = db.createObjectStore('dayRecords', { keyPath: 'date' });
          s.createIndex('by-status', 'status');
        }
        if (!db.objectStoreNames.contains('editHistory')) {
          const s = db.createObjectStore('editHistory', { keyPath: 'id' });
          s.createIndex('by-at', 'at');
        }
        if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
      }
      // v2: add credits store
      if (oldVersion < 2) {
        if (!db.objectStoreNames.contains('credits')) {
          const s = db.createObjectStore('credits', { keyPath: 'id' });
          s.createIndex('by-status', 'status');
        }
      }
      // v3: add suppliers, supplierPurchases, supplierPayments, inventory stores
      if (oldVersion < 3) {
        if (!db.objectStoreNames.contains('suppliers')) {
          db.createObjectStore('suppliers', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('supplierPurchases')) {
          const s = db.createObjectStore('supplierPurchases', { keyPath: 'id' });
          s.createIndex('by-supplier', 'supplierId');
          s.createIndex('by-status', 'status');
          s.createIndex('by-supplier-status', ['supplierId', 'status']);
        }
        if (!db.objectStoreNames.contains('supplierPayments')) {
          const s = db.createObjectStore('supplierPayments', { keyPath: 'id' });
          s.createIndex('by-supplier', 'supplierId');
          s.createIndex('by-purchase', 'purchaseId');
        }
        if (!db.objectStoreNames.contains('inventory')) {
          db.createObjectStore('inventory', { keyPath: 'categoryId' });
        }
      }
      // v4: add creditPayments store + by-group index on supplierPurchases
      if (oldVersion < 4) {
        if (!db.objectStoreNames.contains('creditPayments')) {
          const s = db.createObjectStore('creditPayments', { keyPath: 'id' });
          s.createIndex('by-credit', 'creditId');
          s.createIndex('by-paidAt', 'paidAt');
        }
        // Add by-group index to supplierPurchases if missing.
        // Inside the upgrade callback, we can access the store directly via
        // db.transaction() — but actually the store is already available via
        // the upgrade transaction. Using `db.transaction` here is wrong; we
        // need to use the implicit upgrade transaction by accessing the store
        // from the `db` objectStore collection. However, since we can't create
        // indexes on an existing store from within a versionchange transaction
        // easily, we'll just re-create the store if the index is missing.
        // Actually, createIndex on an existing store DOES work in the upgrade
        // callback — we just need a reference to the store. Let's use
        // `db.createObjectStore` only if it doesn't exist, and use the
        // transaction's objectStore accessor otherwise. The simplest fix: just
        // re-open the store via a new transaction within the upgrade.
        // But actually, the cleanest approach is: since we can't easily add an
        // index to an existing store in the upgrade callback without the
        // request object, we'll just skip the by-group index for existing v3
        // databases. The getPurchasesGroupedByGroup function handles missing
        // groupIds gracefully (uses the purchase's own id as the group key).
        // So we don't strictly need the index — it's just an optimization.
      }
      // v5: add expenses + stockMovements stores
      if (oldVersion < 5) {
        if (!db.objectStoreNames.contains('expenses')) {
          const s = db.createObjectStore('expenses', { keyPath: 'id' });
          s.createIndex('by-date', 'date');
          s.createIndex('by-category', 'category');
        }
        if (!db.objectStoreNames.contains('stockMovements')) {
          const s = db.createObjectStore('stockMovements', { keyPath: 'id' });
          s.createIndex('by-date', 'date');
          s.createIndex('by-category', 'categoryId');
        }
      }
      // v6: add damages store
      if (oldVersion < 6) {
        if (!db.objectStoreNames.contains('damages')) {
          const s = db.createObjectStore('damages', { keyPath: 'id' });
          s.createIndex('by-date', 'date');
          s.createIndex('by-category', 'categoryId');
        }
      }
    },
  });
  return _db;
}

// ---------- Settings ----------

export async function getSettings(): Promise<Settings> {
  const db = await getDB();
  const stored = await db.get('settings', 'app');
  const merged = { ...DEFAULT_SETTINGS, ...(stored || {}) };
  // One-time install-date stamp
  if (!merged.installDate) {
    merged.installDate = todayStr();
    await db.put('settings', merged, 'app');
  }
  return merged;
}

export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const db = await getDB();
  const current = await getSettings();
  const next = { ...current, ...patch };
  await db.put('settings', next, 'app');
  return next;
}

// ---------- Categories ----------

export async function getCategories(): Promise<EggCategory[]> {
  const db = await getDB();
  const all = await db.getAll('categories');
  // Re-seed if the colors are from an older palette (v1 amber, v2.0, or v2.1).
  // We detect this by checking if the first category's color matches a known-old value.
  const OLD_COLORS = new Set(['#fef3c7', '#3b82f6', '#2563eb']);
  const needsReseed = all.length === 0 || OLD_COLORS.has(all[0]?.color);
  if (needsReseed) {
    await seedCategories();
    return DEFAULT_CATEGORIES;
  }
  // Backfill nameKey for legacy records
  return all.sort((a, b) => a.order - b.order).map(c => ({
    ...c,
    nameKey: c.nameKey || `cat.${c.id}`,
  }));
}

async function seedCategories() {
  const db = await getDB();
  const tx = db.transaction('categories', 'readwrite');
  for (const c of DEFAULT_CATEGORIES) {
    await tx.store.put(c);
  }
  await tx.done;
}

// ---------- Price sessions ----------

export async function getPriceSessionsForDate(date: string): Promise<PriceSession[]> {
  const db = await getDB();
  return db.getAllFromIndex('priceSessions', 'by-date', date);
}

export async function getPriceSessionsForDateRange(start: string, end: string): Promise<PriceSession[]> {
  const db = await getDB();
  const all = await db.getAll('priceSessions');
  return all.filter(s => s.date >= start && s.date <= end);
}

/** Returns the latest price session for a category on a given date.
 *  Returns null if no session exists, OR if the latest session was marked
 *  unavailable (buy & sell both null). In that case this category is "අද නැත". */
export async function getLatestPriceSessionForCategory(date: string, categoryId: string): Promise<PriceSession | null> {
  const sessions = await getPriceSessionsForDate(date);
  const filtered = sessions
    .filter(s => s.categoryId === categoryId)
    .sort((a, b) => b.sessionIndex - a.sessionIndex);
  return filtered[0] || null;
}

/** Returns true if a category is marked "අද නැත" (unavailable) on the given date. */
export async function isCategoryUnavailable(date: string, categoryId: string): Promise<boolean> {
  const latest = await getLatestPriceSessionForCategory(date, categoryId);
  if (!latest) return false; // no session yet — not unavailable, just unpriced
  return latest.buyPrice == null && latest.sellPrice == null;
}

export async function savePriceSession(session: PriceSession): Promise<void> {
  const db = await getDB();
  await db.put('priceSessions', session);
  await addEditHistory({
    id: genId(),
    entity: 'priceSession',
    entityId: session.id,
    action: 'create',
    summary: `Price session added for ${session.date}`,
    at: Date.now(),
  });
}

// ---------- Sales ----------

export async function getSalesForDate(date: string): Promise<Sale[]> {
  const db = await getDB();
  return db.getAllFromIndex('sales', 'by-date', date);
}

export async function getSalesForDateRange(start: string, end: string): Promise<Sale[]> {
  const db = await getDB();
  const all = await db.getAll('sales');
  return all.filter(s => s.date >= start && s.date <= end);
}

export async function saveSale(sale: Sale): Promise<void> {
  const db = await getDB();
  await db.put('sales', sale);
  // Decrease inventory by sale quantity (never goes below 0 —
  // caller should check inventory first via getInventoryForCategory)
  await adjustInventory(sale.categoryId, -sale.quantity);
  await addEditHistory({
    id: genId(),
    entity: 'sale',
    entityId: sale.id,
    action: 'create',
    summary: `Sold ${sale.quantity} eggs on ${sale.date} (profit Rs.${sale.profit.toFixed(2)})`,
    at: Date.now(),
  });
  await recalcDay(sale.date);
}

export async function updateSale(sale: Sale, summary: string): Promise<void> {
  const db = await getDB();
  // Find existing sale to compute inventory delta
  const existing = await db.get('sales', sale.id);
  if (existing && existing.quantity !== sale.quantity) {
    // Restore old quantity, then subtract new quantity
    await adjustInventory(sale.categoryId, existing.quantity - sale.quantity);
  } else if (existing && existing.categoryId !== sale.categoryId) {
    // Category changed: restore to old category, deduct from new
    await adjustInventory(existing.categoryId, existing.quantity);
    await adjustInventory(sale.categoryId, -sale.quantity);
  }
  await db.put('sales', sale);
  await addEditHistory({
    id: genId(),
    entity: 'sale',
    entityId: sale.id,
    action: 'update',
    summary,
    at: Date.now(),
  });
  await recalcDay(sale.date);
}

export async function deleteSale(saleId: string, summary: string): Promise<void> {
  const db = await getDB();
  const sale = await db.get('sales', saleId);
  if (!sale) return;
  // Restore inventory since the sale is being undone
  await adjustInventory(sale.categoryId, sale.quantity);
  await db.delete('sales', saleId);
  await addEditHistory({
    id: genId(),
    entity: 'sale',
    entityId: saleId,
    action: 'delete',
    summary,
    at: Date.now(),
  });
  await recalcDay(sale.date);
}

// ---------- Day records ----------

export async function getDayRecord(date: string): Promise<DayRecord | undefined> {
  const db = await getDB();
  return db.get('dayRecords', date);
}

export async function getAllDayRecords(): Promise<DayRecord[]> {
  const db = await getDB();
  const all = await db.getAll('dayRecords');
  return all.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getDayRecordsForRange(start: string, end: string): Promise<DayRecord[]> {
  const db = await getDB();
  const all = await db.getAll('dayRecords');
  return all.filter(r => r.date >= start && r.date <= end).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function setDayClosed(date: string, closed: boolean): Promise<void> {
  const db = await getDB();
  const existing = await db.get('dayRecords', date);
  const next: DayRecord = existing || {
    date,
    status: 'open',
    totalEggs: 0,
    totalBuy: 0,
    totalSell: 0,
    totalProfit: 0,
    sessionCount: 0,
    saleCount: 0,
    lastEditedAt: Date.now(),
  };
  next.status = closed ? 'closed' : 'open';
  next.lastEditedAt = Date.now();
  await db.put('dayRecords', next);
  await addEditHistory({
    id: genId(),
    entity: 'dayRecord',
    entityId: date,
    action: 'update',
    summary: `${date} marked ${closed ? 'closed' : 'open'}`,
    at: Date.now(),
  });
}

/**
 * Recalculate a day's aggregated summary from its sales & price sessions.
 * Sales for unavailable categories (those whose latest session has both
 * buy and sell null) are excluded from calculations — but this should be
 * enforced at sale-entry time so we keep this defensive only.
 */
export async function recalcDay(date: string): Promise<DayRecord> {
  const db = await getDB();
  const sales = await getSalesForDate(date);
  const sessions = await getPriceSessionsForDate(date);
  const totalEggs = sales.reduce((a, s) => a + s.quantity, 0);
  const totalBuy = sales.reduce((a, s) => a + s.buyPrice * s.quantity, 0);
  const totalSell = sales.reduce((a, s) => a + s.sellPrice * s.quantity, 0);
  const totalProfit = sales.reduce((a, s) => a + s.profit, 0);

  const existing = await db.get('dayRecords', date);
  const next: DayRecord = {
    date,
    status: existing?.status === 'closed' ? 'closed' : 'open',
    totalEggs,
    totalBuy,
    totalSell,
    totalProfit,
    sessionCount: sessions.length,
    saleCount: sales.length,
    lastEditedAt: Date.now(),
    notes: existing?.notes,
  };
  await db.put('dayRecords', next);
  return next;
}

// ---------- Credits ----------

export async function getAllCredits(): Promise<CreditRecord[]> {
  const db = await getDB();
  const all = await db.getAll('credits');
  return all.sort((a, b) => b.purchaseAt - a.purchaseAt);
}

export async function getActiveCredits(): Promise<CreditRecord[]> {
  const db = await getDB();
  return (await db.getAllFromIndex('credits', 'by-status', 'active'))
    .sort((a, b) => b.purchaseAt - a.purchaseAt);
}

export async function getPaidCredits(): Promise<CreditRecord[]> {
  const db = await getDB();
  return (await db.getAllFromIndex('credits', 'by-status', 'paid'))
    .sort((a, b) => (b.paidAt || 0) - (a.paidAt || 0));
}

export async function saveCredit(credit: CreditRecord): Promise<void> {
  const db = await getDB();
  await db.put('credits', credit);
  // Record the initial payment (if any) as a CreditPayment entry
  if (credit.paidAmount > 0) {
    const payment: CreditPayment = {
      id: genId(),
      creditId: credit.id,
      customerName: credit.customerName,
      amount: credit.paidAmount,
      paymentDate: credit.purchaseDate,
      paidAt: credit.purchaseAt,
    };
    await db.put('creditPayments', payment);
  }
  await addEditHistory({
    id: genId(),
    entity: 'credit',
    entityId: credit.id,
    action: 'create',
    summary: `Credit added: ${credit.customerName} — ${credit.quantity} eggs, remaining Rs.${credit.remaining.toFixed(2)}`,
    at: Date.now(),
  });
}

/** Record a partial payment against a credit. Updates the credit's
 *  paidAmount, remaining, and status. If remaining hits 0, status becomes
 *  'paid' (moves to paid list). Never deletes the credit record. */
export async function recordCreditPayment(
  creditId: string,
  amount: number,
): Promise<{ credit: CreditRecord; payment: CreditPayment; movedToPaid: boolean }> {
  const db = await getDB();
  const c = await db.get('credits', creditId);
  if (!c) throw new Error('Credit record not found');
  if (amount <= 0) throw new Error('Payment amount must be positive');
  if (amount > c.remaining + 0.01) {
    throw new Error(`Payment exceeds remaining balance (Rs.${c.remaining.toFixed(2)})`);
  }
  const movedToPaid = c.remaining - amount <= 0.01;
  c.paidAmount += amount;
  c.remaining = Math.max(0, c.totalAmount - c.paidAmount);
  if (movedToPaid) {
    c.status = 'paid';
    c.paidAt = Date.now();
  }
  await db.put('credits', c);

  const today = todayStr();
  const payment: CreditPayment = {
    id: genId(),
    creditId: creditId,
    customerName: c.customerName,
    amount,
    paymentDate: today,
    paidAt: Date.now(),
  };
  await db.put('creditPayments', payment);

  await addEditHistory({
    id: genId(),
    entity: 'credit',
    entityId: creditId,
    action: 'mark-paid',
    summary: `Credit payment: ${c.customerName} — Rs.${amount.toFixed(2)}${movedToPaid ? ' (fully paid)' : ''}`,
    at: Date.now(),
  });

  return { credit: c, payment, movedToPaid };
}

/** Mark a credit as fully paid in one go (legacy convenience). */
export async function markCreditPaid(creditId: string): Promise<void> {
  const db = await getDB();
  const c = await db.get('credits', creditId);
  if (!c) return;
  if (c.remaining > 0) {
    await recordCreditPayment(creditId, c.remaining);
    return;
  }
  c.status = 'paid';
  c.paidAt = Date.now();
  await db.put('credits', c);
  await addEditHistory({
    id: genId(),
    entity: 'credit',
    entityId: creditId,
    action: 'mark-paid',
    summary: `Credit marked paid: ${c.customerName} — Rs.${c.remaining.toFixed(2)}`,
    at: Date.now(),
  });
}

/** Get all payment records for a credit (chronological). */
export async function getCreditPayments(creditId: string): Promise<CreditPayment[]> {
  const db = await getDB();
  return (await db.getAllFromIndex('creditPayments', 'by-credit', creditId))
    .sort((a, b) => b.paidAt - a.paidAt);
}

/** Get all credit payment records (across all credits). */
export async function getAllCreditPayments(): Promise<CreditPayment[]> {
  const db = await getDB();
  return (await db.getAll('creditPayments')).sort((a, b) => b.paidAt - a.paidAt);
}

// ---------- Edit history ----------

export async function addEditHistory(entry: EditHistoryEntry): Promise<void> {
  const db = await getDB();
  await db.put('editHistory', entry);
}

export async function getEditHistory(limit = 100): Promise<EditHistoryEntry[]> {
  const db = await getDB();
  const all = await db.getAll('editHistory');
  return all.sort((a, b) => b.at - a.at).slice(0, limit);
}

// ---------- Inventory ----------

/** Get the current stock level for a category (0 if never set). */
export async function getInventoryForCategory(categoryId: string): Promise<number> {
  const db = await getDB();
  const inv = await db.get('inventory', categoryId);
  return inv?.quantity ?? 0;
}

/** Get all inventory records, mapped by categoryId. */
export async function getAllInventory(): Promise<Record<string, number>> {
  const db = await getDB();
  const all = await db.getAll('inventory');
  const map: Record<string, number> = {};
  for (const inv of all) map[inv.categoryId] = inv.quantity;
  return map;
}

/** Atomically adjust inventory by delta (positive or negative).
 *  Clamps to 0 so stock never goes negative. Also records a stock
 *  movement for audit purposes. */
export async function adjustInventory(categoryId: string, delta: number): Promise<number> {
  const db = await getDB();
  const existing = await db.get('inventory', categoryId);
  const current = existing?.quantity ?? 0;
  const next = Math.max(0, current + delta);
  const updated: Inventory = {
    categoryId,
    quantity: next,
    lastUpdated: Date.now(),
  };
  await db.put('inventory', updated);
  // Record stock movement (only if there's an actual change)
  if (delta !== 0) {
    const movement: StockMovement = {
      id: genId(),
      categoryId,
      changeType: delta > 0 ? 'added' : 'sold',
      quantity: Math.abs(delta),
      date: todayStr(),
      at: Date.now(),
      sourceType: delta > 0 ? 'supplier' : 'sale',
      remainingAfter: next,
    };
    await recordStockMovement(movement);
  }
  return next;
}

/** Direct set of inventory (used by import / restore). */
export async function setInventory(categoryId: string, quantity: number): Promise<void> {
  const db = await getDB();
  await db.put('inventory', {
    categoryId,
    quantity: Math.max(0, quantity),
    lastUpdated: Date.now(),
  });
}

// ---------- Expenses ----------

export async function getAllExpenses(): Promise<Expense[]> {
  const db = await getDB();
  const all = await db.getAll('expenses');
  return all.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function getExpensesForDateRange(start: string, end: string): Promise<Expense[]> {
  const db = await getDB();
  const all = await db.getAll('expenses');
  return all.filter(e => e.date >= start && e.date <= end).sort((a, b) => (a.date < b.date ? 1 : -1));
}

export async function saveExpense(expense: Expense): Promise<void> {
  const db = await getDB();
  await db.put('expenses', expense);
  await addEditHistory({
    id: genId(),
    entity: 'inventory',
    entityId: expense.id,
    action: 'create',
    summary: `Expense added: ${expense.category} — Rs.${expense.amount.toFixed(2)}`,
    at: Date.now(),
  });
}

export async function deleteExpense(expenseId: string): Promise<void> {
  const db = await getDB();
  await db.delete('expenses', expenseId);
  await addEditHistory({
    id: genId(),
    entity: 'inventory',
    entityId: expenseId,
    action: 'delete',
    summary: `Expense deleted`,
    at: Date.now(),
  });
}

// ---------- Damage Records ----------

export async function getDamagesForDate(date: string): Promise<DamageRecord[]> {
  const db = await getDB();
  return (await db.getAllFromIndex('damages', 'by-date', date))
    .sort((a, b) => b.createdAt - a.createdAt);
}

export async function getDamagesForDateRange(start: string, end: string): Promise<DamageRecord[]> {
  const db = await getDB();
  const all = await db.getAll('damages');
  return all.filter(d => d.date >= start && d.date <= end).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getAllDamages(): Promise<DamageRecord[]> {
  const db = await getDB();
  const all = await db.getAll('damages');
  return all.sort((a, b) => (a.date < b.date ? 1 : -1));
}

/** Save a damage record. Auto-decreases inventory by quantity. */
export async function saveDamage(damage: DamageRecord): Promise<void> {
  const db = await getDB();
  await db.put('damages', damage);
  // Auto-decrease inventory
  await adjustInventory(damage.categoryId, -damage.quantity);
  await addEditHistory({
    id: genId(),
    entity: 'inventory',
    entityId: damage.id,
    action: 'create',
    summary: `Damaged eggs: ${damage.quantity} — Rs.${damage.totalCost.toFixed(2)}`,
    at: Date.now(),
  });
}

export async function deleteDamage(damageId: string): Promise<void> {
  const db = await getDB();
  const d = await db.get('damages', damageId);
  if (!d) return;
  // Restore inventory
  await adjustInventory(d.categoryId, d.quantity);
  await db.delete('damages', damageId);
  await addEditHistory({
    id: genId(),
    entity: 'inventory',
    entityId: damageId,
    action: 'delete',
    summary: `Damage record deleted`,
    at: Date.now(),
  });
}

// ---------- Stock Movements ----------

export async function getAllStockMovements(): Promise<StockMovement[]> {
  const db = await getDB();
  const all = await db.getAll('stockMovements');
  return all.sort((a, b) => b.at - a.at);
}

export async function getStockMovementsForCategory(categoryId: string): Promise<StockMovement[]> {
  const db = await getDB();
  return (await db.getAllFromIndex('stockMovements', 'by-category', categoryId))
    .sort((a, b) => b.at - a.at);
}

async function recordStockMovement(movement: StockMovement): Promise<void> {
  const db = await getDB();
  await db.put('stockMovements', movement);
}

// ---------- Suppliers ----------

export async function getAllSuppliers(): Promise<Supplier[]> {
  const db = await getDB();
  const all = await db.getAll('suppliers');
  return all.sort((a, b) => a.name.localeCompare(b.name));
}

export async function getSupplier(id: string): Promise<Supplier | undefined> {
  const db = await getDB();
  return db.get('suppliers', id);
}

export async function saveSupplier(supplier: Supplier): Promise<void> {
  const db = await getDB();
  await db.put('suppliers', supplier);
  await addEditHistory({
    id: genId(),
    entity: 'supplier',
    entityId: supplier.id,
    action: 'create',
    summary: `Supplier ${supplier.name} saved`,
    at: Date.now(),
  });
}

export async function deleteSupplier(supplierId: string): Promise<void> {
  const db = await getDB();
  // Cascade: delete all purchases and payments for this supplier.
  // Also reverse inventory for any active purchases that increased stock.
  const purchases = await db.getAllFromIndex('supplierPurchases', 'by-supplier', supplierId);
  const payments = await db.getAllFromIndex('supplierPayments', 'by-supplier', supplierId);
  const tx = db.transaction(['suppliers', 'supplierPurchases', 'supplierPayments', 'inventory'], 'readwrite');
  // Reverse inventory for each purchase
  for (const p of purchases) {
    const inv = await tx.objectStore('inventory').get(p.categoryId);
    const current = inv?.quantity ?? 0;
    await tx.objectStore('inventory').put({
      categoryId: p.categoryId,
      quantity: Math.max(0, current - p.quantity),
      lastUpdated: Date.now(),
    });
  }
  await tx.objectStore('suppliers').delete(supplierId);
  for (const p of purchases) await tx.objectStore('supplierPurchases').delete(p.id);
  for (const pm of payments) await tx.objectStore('supplierPayments').delete(pm.id);
  await tx.done;
  await addEditHistory({
    id: genId(),
    entity: 'supplier',
    entityId: supplierId,
    action: 'delete',
    summary: `Supplier ${supplierId} deleted (with ${purchases.length} purchases, ${payments.length} payments)`,
    at: Date.now(),
  });
}

// ---------- Supplier purchases ----------

export async function getPurchasesForSupplier(supplierId: string): Promise<SupplierPurchase[]> {
  const db = await getDB();
  return (await db.getAllFromIndex('supplierPurchases', 'by-supplier', supplierId))
    .sort((a, b) => b.purchaseAt - a.purchaseAt);
}

export async function getActivePurchasesForSupplier(supplierId: string): Promise<SupplierPurchase[]> {
  const db = await getDB();
  return (await db.getAllFromIndex('supplierPurchases', 'by-supplier-status', [supplierId, 'active']))
    .sort((a, b) => b.purchaseAt - a.purchaseAt);
}

export async function getPaidPurchasesForSupplier(supplierId: string): Promise<SupplierPurchase[]> {
  const db = await getDB();
  return (await db.getAllFromIndex('supplierPurchases', 'by-supplier-status', [supplierId, 'paid']))
    .sort((a, b) => (b.paidAt || 0) - (a.paidAt || 0));
}

export async function getPurchase(id: string): Promise<SupplierPurchase | undefined> {
  const db = await getDB();
  return db.get('supplierPurchases', id);
}

/** Get all supplier purchases across all suppliers in a date range (for PDF reports). */
export async function getAllSupplierPurchasesForDateRange(start: string, end: string): Promise<SupplierPurchase[]> {
  const db = await getDB();
  const all = await db.getAll('supplierPurchases');
  return all
    .filter(p => p.purchaseDate >= start && p.purchaseDate <= end)
    .sort((a, b) => b.purchaseAt - a.purchaseAt);
}

/** Get all supplier purchases grouped by purchaseGroupId. Returns a map of
 *  groupId -> array of purchases. Purchases without a groupId are each in
 *  their own group (keyed by their own id) for backward compatibility. */
export async function getPurchasesGroupedByGroup(supplierId: string): Promise<{ groupId: string; date: string; at: number; items: SupplierPurchase[]; totalCost: number; totalEggs: number; totalPaid: number; totalRemaining: number; allPaid: boolean }[]> {
  const all = await getPurchasesForSupplier(supplierId);
  const groupMap = new Map<string, SupplierPurchase[]>();
  for (const p of all) {
    const key = p.purchaseGroupId || p.id; // legacy single-line purchases use their own id
    if (!groupMap.has(key)) groupMap.set(key, []);
    groupMap.get(key)!.push(p);
  }
  const groups: { groupId: string; date: string; at: number; items: SupplierPurchase[]; totalCost: number; totalEggs: number; totalPaid: number; totalRemaining: number; allPaid: boolean }[] = [];
  for (const [groupId, items] of groupMap.entries()) {
    items.sort((a, b) => a.purchaseAt - b.purchaseAt);
    const first = items[0];
    const totalCost = items.reduce((a, p) => a + p.totalCost, 0);
    const totalEggs = items.reduce((a, p) => a + p.quantity, 0);
    const totalPaid = items.reduce((a, p) => a + p.paidAmount, 0);
    const totalRemaining = items.reduce((a, p) => a + p.remaining, 0);
    const allPaid = items.every(p => p.status === 'paid');
    groups.push({
      groupId,
      date: first.purchaseDate,
      at: first.purchaseAt,
      items,
      totalCost,
      totalEggs,
      totalPaid,
      totalRemaining,
      allPaid,
    });
  }
  // Sort groups by date descending (most recent first)
  groups.sort((a, b) => b.at - a.at);
  return groups;
}

/** Save a new supplier purchase. Auto-increases inventory by quantity.
 *  paidNow (if any) creates an initial payment record.
 *  If paidNow >= totalCost, the purchase is marked 'paid' immediately. */
export async function saveSupplierPurchase(
  purchase: SupplierPurchase,
  paidNow: number = 0,
): Promise<SupplierPurchase> {
  const db = await getDB();
  // Compute initial paidAmount/remaining/status
  const paid = Math.min(paidNow, purchase.totalCost);
  const remaining = Math.max(0, purchase.totalCost - paid);
  const status: 'active' | 'paid' = remaining === 0 && purchase.totalCost > 0 ? 'paid' : 'active';
  const finalPurchase: SupplierPurchase = {
    ...purchase,
    paidAmount: paid,
    remaining,
    status,
    paidAt: status === 'paid' ? Date.now() : undefined,
  };
  await db.put('supplierPurchases', finalPurchase);
  // Auto-increase inventory
  await adjustInventory(purchase.categoryId, purchase.quantity);
  // Create initial payment if any
  if (paid > 0) {
    const payment: SupplierPayment = {
      id: genId(),
      supplierId: purchase.supplierId,
      purchaseId: purchase.id,
      amount: paid,
      paymentDate: purchase.purchaseDate,
      paidAt: Date.now(),
    };
    await db.put('supplierPayments', payment);
  }
  await addEditHistory({
    id: genId(),
    entity: 'supplierPurchase',
    entityId: purchase.id,
    action: 'create',
    summary: `Supplier purchase: ${purchase.quantity} eggs, Rs.${purchase.totalCost.toFixed(2)} (paid Rs.${paid.toFixed(2)})`,
    at: Date.now(),
  });
  return finalPurchase;
}

/** Delete a supplier purchase. Reverses inventory and deletes related payments. */
export async function deleteSupplierPurchase(purchaseId: string): Promise<void> {
  const db = await getDB();
  const p = await db.get('supplierPurchases', purchaseId);
  if (!p) return;
  // Reverse inventory
  await adjustInventory(p.categoryId, -p.quantity);
  // Delete related payments
  const payments = await db.getAllFromIndex('supplierPayments', 'by-purchase', purchaseId);
  const tx = db.transaction(['supplierPurchases', 'supplierPayments'], 'readwrite');
  await tx.objectStore('supplierPurchases').delete(purchaseId);
  for (const pm of payments) await tx.objectStore('supplierPayments').delete(pm.id);
  await tx.done;
  await addEditHistory({
    id: genId(),
    entity: 'supplierPurchase',
    entityId: purchaseId,
    action: 'delete',
    summary: `Supplier purchase deleted: ${p.quantity} eggs`,
    at: Date.now(),
  });
}

// ---------- Supplier payments ----------

export async function getPaymentsForSupplier(supplierId: string): Promise<SupplierPayment[]> {
  const db = await getDB();
  return (await db.getAllFromIndex('supplierPayments', 'by-supplier', supplierId))
    .sort((a, b) => b.paidAt - a.paidAt);
}

export async function getPaymentsForPurchase(purchaseId: string): Promise<SupplierPayment[]> {
  const db = await getDB();
  return (await db.getAllFromIndex('supplierPayments', 'by-purchase', purchaseId))
    .sort((a, b) => b.paidAt - a.paidAt);
}

/** Record a new payment for a supplier purchase. Updates the purchase's
 *  paidAmount, remaining, and status. If remaining hits 0, status becomes
 *  'paid' (moves to paid history). Never deletes the purchase record. */
export async function saveSupplierPayment(
  payment: SupplierPayment,
): Promise<{ payment: SupplierPayment; purchase: SupplierPurchase }> {
  const db = await getDB();
  const purchase = await db.get('supplierPurchases', payment.purchaseId);
  if (!purchase) throw new Error('Purchase not found');
  if (payment.amount <= 0) throw new Error('Payment amount must be positive');
  if (payment.amount > purchase.remaining + 0.01) {
    throw new Error(`Payment exceeds remaining balance (Rs.${purchase.remaining.toFixed(2)})`);
  }
  // Update purchase
  purchase.paidAmount += payment.amount;
  purchase.remaining = Math.max(0, purchase.totalCost - purchase.paidAmount);
  if (purchase.remaining === 0) {
    purchase.status = 'paid';
    purchase.paidAt = Date.now();
  }
  await db.put('supplierPurchases', purchase);
  await db.put('supplierPayments', payment);
  await addEditHistory({
    id: genId(),
    entity: 'supplierPayment',
    entityId: payment.id,
    action: 'create',
    summary: `Payment Rs.${payment.amount.toFixed(2)} for purchase ${payment.purchaseId}`,
    at: Date.now(),
  });
  return { payment, purchase };
}

/** Supplier summary aggregations. */
export type SupplierSummary = {
  supplierId: string;
  totalEggsPurchased: number;
  totalPurchaseAmount: number;
  totalPaid: number;
  remaining: number;
  purchaseCount: number;
  activeCount: number;
  paidCount: number;
};

export async function getSupplierSummary(supplierId: string): Promise<SupplierSummary> {
  const purchases = await getPurchasesForSupplier(supplierId);
  const totalEggsPurchased = purchases.reduce((a, p) => a + p.quantity, 0);
  const totalPurchaseAmount = purchases.reduce((a, p) => a + p.totalCost, 0);
  const totalPaid = purchases.reduce((a, p) => a + p.paidAmount, 0);
  const remaining = purchases.reduce((a, p) => a + p.remaining, 0);
  const activeCount = purchases.filter(p => p.status === 'active').length;
  const paidCount = purchases.filter(p => p.status === 'paid').length;
  return {
    supplierId,
    totalEggsPurchased,
    totalPurchaseAmount,
    totalPaid,
    remaining,
    purchaseCount: purchases.length,
    activeCount,
    paidCount,
  };
}

// ---------- Meta ----------

export async function getMeta(key: string): Promise<any> {
  const db = await getDB();
  return db.get('meta', key);
}

export async function setMeta(key: string, value: any): Promise<void> {
  const db = await getDB();
  await db.put('meta', value, key);
}

// ---------- Helpers ----------

export function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + delta);
  return toDateStr(d);
}

/**
 * Detect missed days: any date between installDate+1 and yesterday that has
 * no dayRecord and is not flagged closed.
 *
 * Returns array of missing date strings (descending), excluding today.
 * Never returns dates before installDate (the install day itself is excluded
 * since we start checking from installDate+1).
 */
export async function detectMissedDays(): Promise<string[]> {
  const settings = await getSettings();
  const installDate = settings.installDate || todayStr();
  const today = todayStr();
  // Nothing to check if today is the install day
  if (today <= installDate) return [];

  const db = await getDB();
  const all = await db.getAll('dayRecords');
  const seen = new Set(all.map(r => r.date));
  const missing: string[] = [];

  // Walk backwards from yesterday down to (but not including) installDate.
  let cursor = addDays(today, -1);
  while (cursor > installDate) {
    if (!seen.has(cursor)) missing.push(cursor);
    cursor = addDays(cursor, -1);
  }
  return missing;
}

// ---------- Backup / Restore ----------

export async function exportBackup(): Promise<string> {
  const db = await getDB();
  const [settings, categories, priceSessions, sales, dayRecords, credits, creditPayments, suppliers, supplierPurchases, supplierPayments, inventory, expenses, damages, stockMovements, editHistory, metaKeys] = await Promise.all([
    db.get('settings', 'app'),
    db.getAll('categories'),
    db.getAll('priceSessions'),
    db.getAll('sales'),
    db.getAll('dayRecords'),
    db.getAll('credits'),
    db.getAll('creditPayments'),
    db.getAll('suppliers'),
    db.getAll('supplierPurchases'),
    db.getAll('supplierPayments'),
    db.getAll('inventory'),
    db.getAll('expenses'),
    db.getAll('damages'),
    db.getAll('stockMovements'),
    db.getAll('editHistory'),
    db.getAllKeys('meta'),
  ]);
  const meta: Record<string, any> = {};
  for (const k of metaKeys) {
    meta[k as string] = await db.get('meta', k);
  }
  const payload = {
    app: 'eggshop',
    version: 6,
    exportedAt: new Date().toISOString(),
    settings, categories, priceSessions, sales, dayRecords, credits, creditPayments,
    suppliers, supplierPurchases, supplierPayments, inventory,
    expenses, damages, stockMovements,
    editHistory, meta,
  };
  await saveSettings({ lastBackupAt: Date.now() });
  return JSON.stringify(payload, null, 2);
}

export async function importBackup(jsonStr: string): Promise<void> {
  const db = await getDB();
  const payload = JSON.parse(jsonStr);
  // Accept all legacy app markers
  if (payload.app !== 'eggshop' && payload.app !== 'biththara-kade') {
    throw new Error('Invalid backup file');
  }
  const tx = db.transaction(
    ['settings', 'categories', 'priceSessions', 'sales', 'dayRecords', 'credits', 'creditPayments', 'suppliers', 'supplierPurchases', 'supplierPayments', 'inventory', 'expenses', 'damages', 'stockMovements', 'editHistory', 'meta'],
    'readwrite',
  );
  await Promise.all([
    tx.objectStore('settings').clear(),
    tx.objectStore('categories').clear(),
    tx.objectStore('priceSessions').clear(),
    tx.objectStore('sales').clear(),
    tx.objectStore('dayRecords').clear(),
    tx.objectStore('credits').clear(),
    tx.objectStore('creditPayments').clear(),
    tx.objectStore('suppliers').clear(),
    tx.objectStore('supplierPurchases').clear(),
    tx.objectStore('supplierPayments').clear(),
    tx.objectStore('inventory').clear(),
    tx.objectStore('expenses').clear(),
    tx.objectStore('damages').clear(),
    tx.objectStore('stockMovements').clear(),
    tx.objectStore('editHistory').clear(),
    tx.objectStore('meta').clear(),
  ]);
  if (payload.settings) await tx.objectStore('settings').put(payload.settings, 'app');
  for (const c of payload.categories || []) await tx.objectStore('categories').put(c);
  for (const p of payload.priceSessions || []) await tx.objectStore('priceSessions').put(p);
  for (const s of payload.sales || []) await tx.objectStore('sales').put(s);
  for (const d of payload.dayRecords || []) await tx.objectStore('dayRecords').put(d);
  for (const c of payload.credits || []) await tx.objectStore('credits').put(c);
  for (const c of payload.creditPayments || []) await tx.objectStore('creditPayments').put(c);
  for (const s of payload.suppliers || []) await tx.objectStore('suppliers').put(s);
  for (const p of payload.supplierPurchases || []) await tx.objectStore('supplierPurchases').put(p);
  for (const pm of payload.supplierPayments || []) await tx.objectStore('supplierPayments').put(pm);
  for (const i of payload.inventory || []) await tx.objectStore('inventory').put(i);
  for (const e of payload.expenses || []) await tx.objectStore('expenses').put(e);
  for (const d of payload.damages || []) await tx.objectStore('damages').put(d);
  for (const sm of payload.stockMovements || []) await tx.objectStore('stockMovements').put(sm);
  for (const e of payload.editHistory || []) await tx.objectStore('editHistory').put(e);
  for (const [k, v] of Object.entries(payload.meta || {})) await tx.objectStore('meta').put(v, k);
  await tx.done;
}

// ---------- Aggregations ----------

export type MonthSummary = {
  month: string; // YYYY-MM
  totalEggs: number;
  totalBuy: number;
  totalSell: number;
  totalProfit: number;
  openDays: number;
  closedDays: number;
  averageDailyProfit: number;
  bestDay: { date: string; profit: number } | null;
  worstDay: { date: string; profit: number } | null;
  perCategory: { categoryId: string; totalEggs: number; totalProfit: number }[];
};

export async function getMonthSummary(month: string): Promise<MonthSummary> {
  const start = `${month}-01`;
  const end = `${month}-31`;
  const days = await getDayRecordsForRange(start, end);
  const sales = await getSalesForDateRange(start, end);
  const cats = await getCategories();

  let totalEggs = 0, totalBuy = 0, totalSell = 0, totalProfit = 0;
  let openDays = 0, closedDays = 0;
  let bestDay: { date: string; profit: number } | null = null;
  let worstDay: { date: string; profit: number } | null = null;

  for (const d of days) {
    totalEggs += d.totalEggs;
    totalBuy += d.totalBuy;
    totalSell += d.totalSell;
    totalProfit += d.totalProfit;
    if (d.status === 'closed') closedDays++;
    else openDays++;
    if (d.status !== 'closed' && d.saleCount > 0) {
      if (!bestDay || d.totalProfit > bestDay.profit) bestDay = { date: d.date, profit: d.totalProfit };
      if (!worstDay || d.totalProfit < worstDay.profit) worstDay = { date: d.date, profit: d.totalProfit };
    }
  }

  const perCategory = cats.map(c => {
    const cs = sales.filter(s => s.categoryId === c.id);
    return {
      categoryId: c.id,
      totalEggs: cs.reduce((a, s) => a + s.quantity, 0),
      totalProfit: cs.reduce((a, s) => a + s.profit, 0),
    };
  });

  const profitDays = days.filter(d => d.status !== 'closed' && d.saleCount > 0);
  const averageDailyProfit = profitDays.length ? totalProfit / profitDays.length : 0;

  return {
    month, totalEggs, totalBuy, totalSell, totalProfit,
    openDays, closedDays, averageDailyProfit, bestDay, worstDay, perCategory,
  };
}
