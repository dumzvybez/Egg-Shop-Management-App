# 🛒 Shop Manager

<p align="center">
  <strong>A modern, offline-first Progressive Web App for small-business management.</strong>
  <br><br>
  Track sales, inventory, suppliers, customer credit, expenses and reports — all in one clean, simple application.
</p>

<p align="center">

![Version](https://img.shields.io/badge/version-v3.0.0-blue)
![PWA](https://img.shields.io/badge/PWA-Ready-success)
![Offline](https://img.shields.io/badge/Offline-First-success)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/License-MIT-green)

</p>

---

## ✨ Overview

**Shop Manager** is a generic, professional small-business management system designed for daily shop use. It works for grocery shops, convenience stores, snack shops, retail shops, egg shops, and many other small-business types.

It helps shop owners manage:

- 📦 **Products & Inventory** — full CRUD, opening stock, reorder thresholds, low-stock alerts, stock movement history
- 🛒 **Sales** — multi-line transactions, automatic profit calculation, stock deduction
- 🚚 **Suppliers** — contacts, multi-line purchases, partial payments, outstanding balances
- 👥 **Customer Credit** — multi-line credit sales, partial payments, active/paid history
- 💰 **Profit** — daily, monthly and yearly reports with gross and net profit
- 🧾 **Expenses** — operating costs with daily and monthly breakdowns
- 📊 **Reports** — daily, monthly and printable PDF reports with section selection
- 🌙 **Themes** — Dark (default) and Light
- 📱 **PWA** — installable, fully offline, install-to-home-screen

Everything works **completely offline**, making it perfect for everyday shop use in areas with unreliable connectivity.

---

## 🚀 Features

| Module | Description |
|--------|-------------|
| 📊 Dashboard | Cash Available, Gross Profit, Net Profit, Supplier Due, Customer Due, Today's Sales, Stock Alerts, Business Health, Monthly Comparison, Top Selling Product |
| 🛒 Sales | Multi-line sales, automatic profit calc, stock validation, price sessions |
| 📦 Inventory | Full product CRUD, opening stock, reorder thresholds, low-stock warnings, movement history |
| 🚚 Suppliers | Supplier profiles, multi-line purchases, partial payments, outstanding balances, payment distribution |
| 👥 Credit | Customer credit, multi-line items, partial payments, active/paid history |
| 💰 Reports | Daily, monthly, PDF reports with section selection |
| 🧾 Expenses | Operating costs (transport, electricity, bags, rent, other), 7-day breakdown, net profit impact |
| 💥 Damaged Stock | Damage/loss tracking with auto inventory deduction and profit impact |
| 📱 PWA | Installable, offline-first, install on Android/iOS |
| 🔒 Privacy | All data stored locally on device — no servers, no tracking |

---

## 📱 Main Features

### 📊 Dashboard (Business Command Center)
- Cash Available (sales received minus expenses)
- Gross Profit and Net Profit
- Supplier Due and Customer Due (kept separate from cash)
- Today's Sales with yesterday comparison
- Business Health card with vs-yesterday and vs-last-month comparisons
- Stock Alerts (out-of-stock + low-stock items)
- Top Selling Product
- Monthly Comparison chart
- Last 7 days profit chart

### 🛒 Sales Screen
- Multi-line sale transactions
- Live profit calculation per line
- Stock validation (prevents overselling)
- Editable transactions
- Price session tracking (each price change creates a new session)
- Damage/loss recording in the same screen

### 📦 Inventory
- Full product CRUD (add/edit/delete)
- Per-product: name, category, unit, opening stock, purchase price, selling price, reorder threshold, color
- Stock level badges (out/low/medium/high)
- Stock movement history (added/sold/damaged/returned)
- Low-stock and out-of-stock alerts

### 🚚 Suppliers
- Supplier list with name, phone, notes
- Per-supplier profile with outstanding balance
- Multi-line purchases (single delivery with multiple product types)
- Partial payments distributed oldest-first across purchases
- Purchase history grouped by delivery
- Pie charts: item breakdown and payment status
- Lifetime statistics

### 👥 Customer Credit
- Multi-line credit sales (customer takes multiple items, pays later)
- Partial payments with full audit trail
- Active and paid tabs
- Quick "Mark Fully Paid" button

### 💰 Reports
- Daily reports (last 90 days, search + filter by month)
- Monthly reports (last 12 months, best/worst day, per-product breakdown, charts)
- PDF reports (configurable sections, professional layout)
- Month-over-month comparisons

### 🧾 Expenses
- Five fixed categories: Transport, Electricity, Bags, Rent, Other
- Monthly total and net-profit calculation
- 7-day breakdown bar chart
- Real-time gross vs net profit display

### 💥 Damaged Stock
- Record damaged/lost items directly from the Sales screen
- Auto-decreases inventory
- Affects gross profit, net profit, and monthly reports
- Visible in daily, monthly and PDF reports

---

## 🛠 Tech Stack

- **Next.js 16** (App Router, webpack production build)
- **TypeScript 5** (strict)
- **Tailwind CSS v4** (custom glassmorphism design system)
- **Framer Motion 12** (animations)
- **Recharts 2** (charts)
- **IndexedDB** via `idb` (local offline storage)
- **Service Worker** (PWA offline support)

---

## 📦 Installation

```bash
git clone https://github.com/dumzvybez/Egg-Shop-Management-App.git

cd Egg-Shop-Management-App

npm install

npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Production build

```bash
npm run build
npm start
```

---

## 📱 Progressive Web App

Shop Manager is fully installable as a Progressive Web App.

Features:
- ✅ Offline support (works without internet)
- ✅ Install on Android (Chrome / Edge)
- ✅ Install on iOS (Safari → Share → Add to Home Screen)
- ✅ Local data storage (survives app close and phone restart)
- ✅ Fast loading
- ✅ Theme persistence
- ✅ Real URL navigation (browser back/forward works)

---

## 📂 Project Structure

```
shop-manager/
├── public/
│   ├── manifest.webmanifest
│   ├── sw.js
│   ├── robots.txt
│   └── icons/
├── src/
│   ├── app/
│   │   ├── globals.css         # Tailwind v4 design system
│   │   ├── layout.tsx          # Root layout, fonts, metadata
│   │   └── page.tsx            # URL-routed SPA shell
│   ├── lib/
│   │   ├── db.ts               # IndexedDB data layer
│   │   ├── i18n.ts             # English-only dictionary
│   │   ├── sinhala.ts          # Date/number/currency formatters
│   │   ├── use-data.ts         # React hooks for data
│   │   ├── use-theme.ts        # Theme sync
│   │   ├── i18n-context.tsx    # I18n provider
│   │   ├── data-hooks.ts       # Re-export hub
│   │   └── data-hooks-adapter.ts
│   └── components/
│       ├── dashboard.tsx
│       ├── profit-calculator-screen.tsx   # Sales screen
│       ├── inventory-screen.tsx
│       ├── suppliers-screen.tsx
│       ├── supplier-profile-screen.tsx
│       ├── credit-screen.tsx
│       ├── expense-screen.tsx
│       ├── daily-reports-screen.tsx
│       ├── monthly-reports-screen.tsx
│       ├── pdf-report-screen.tsx
│       ├── backup-screen.tsx
│       ├── settings-screen.tsx
│       ├── edit-history-screen.tsx
│       ├── setup-wizard.tsx
│       ├── bottom-nav.tsx
│       ├── footer.tsx
│       ├── toast-provider.tsx
│       ├── missed-days-modal.tsx
│       └── month-end-reminder-modal.tsx
├── package.json
├── next.config.ts
├── tsconfig.json
└── README.md
```

---

## 🔒 Privacy

**All your data stays on your device.** Shop Manager does NOT:
- Send any data to any server
- Use analytics or tracking
- Require an account or login
- Make any network calls (except for Google Fonts on first load)

Use the **Backup & Restore** screen to export your data as a JSON file or set up automatic backups (latest 5 kept on device).

---

## 🌐 Developer

**Dumindu Wanasinghe** — Founder & Developer

[![GitHub](https://img.shields.io/badge/GitHub-dumzvybez-black?logo=github)](https://github.com/dumzvybez)
[![Portfolio](https://img.shields.io/badge/Portfolio-dumindu.vercel.app-blue?logo=vercel)](https://dumindu.vercel.app)
[![YouTube](https://img.shields.io/badge/YouTube-@DuminduWanasinghe-red?logo=youtube)](https://www.youtube.com/@DuminduWanasinghe)

Repository: [github.com/dumzvybez/Egg-Shop-Management-App](https://github.com/dumzvybez/Egg-Shop-Management-App)

---

## 📸 Screenshots

<table>
  <tr>
    <td width="50%" align="center"><b>Dashboard (Dark)</b></td>
    <td width="50%" align="center"><b>Dashboard (Light)</b></td>
  </tr>
  <tr>
    <td width="50%" align="center" valign="top">
      <img src="https://placehold.co/600x1200/0c0a09/fbbf24?text=Dashboard%0A%0ADark%20Theme%0A%0ACash%20%C2%B7%20Profit%0ADues%20%C2%B7%20Alerts&font=montserrat" alt="Dashboard dark" width="100%" />
    </td>
    <td width="50%" align="center" valign="top">
      <img src="https://placehold.co/600x1200/fffbeb/f59e0b?text=Dashboard%0A%0ALight%20Theme%0A%0ACash%20%C2%B7%20Profit%0ADues%20%C2%B7%20Alerts&font=montserrat" alt="Dashboard light" width="100%" />
    </td>
  </tr>
  <tr>
    <td width="50%" align="center"><b>Sales Screen</b></td>
    <td width="50%" align="center"><b>Inventory</b></td>
  </tr>
  <tr>
    <td width="50%" align="center" valign="top">
      <img src="https://placehold.co/600x1200/0c0a09/22d3ee?text=Sales%0A%0AMulti-line%0AProfit%20calc%0AStock%20check&font=montserrat" alt="Sales" width="100%" />
    </td>
    <td width="50%" align="center" valign="top">
      <img src="https://placehold.co/600x1200/0c0a09/16a34a?text=Inventory%0A%0AProducts%0ALow%20stock%0AMovement%20history&font=montserrat" alt="Inventory" width="100%" />
    </td>
  </tr>
  <tr>
    <td width="50%" align="center"><b>Supplier Profile</b></td>
    <td width="50%" align="center"><b>Customer Credit</b></td>
  </tr>
  <tr>
    <td width="50%" align="center" valign="top">
      <img src="https://placehold.co/600x1200/0c0a09/9333ea?text=Supplier%0A%0ABalance%0APurchases%0APayments&font=montserrat" alt="Supplier" width="100%" />
    </td>
    <td width="50%" align="center" valign="top">
      <img src="https://placehold.co/600x1200/0c0a09/dc2626?text=Credit%0A%0AActive%20/%20Paid%0APartial%20payments&font=montserrat" alt="Credit" width="100%" />
    </td>
  </tr>
  <tr>
    <td width="50%" align="center"><b>Reports & Charts</b></td>
    <td width="50%" align="center"><b>PDF Report</b></td>
  </tr>
  <tr>
    <td width="50%" align="center" valign="top">
      <img src="https://placehold.co/600x1200/0c0a09/f59e0b?text=Reports%0A%0ADaily%20/%20Monthly%0ABar%20+%20Pie%20charts&font=montserrat" alt="Reports" width="100%" />
    </td>
    <td width="50%" align="center" valign="top">
      <img src="https://placehold.co/600x1200/0c0a09/ef4444?text=PDF%20Report%0A%0ASection%20picker%0AProfessional%20layout&font=montserrat" alt="PDF" width="100%" />
    </td>
  </tr>
</table>

> Replace the placeholder images above with real screenshots of your deployed app. Drop your PNGs into `docs/screenshots/` and update the `<img src="...">` paths.

---

## ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.

---

## 📄 License

MIT License — free for personal and commercial use.
