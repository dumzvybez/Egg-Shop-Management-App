import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = "https://shopsuite.app";
const SITE_NAME = "ShopSuite";
const SITE_DESCRIPTION = "ShopSuite — a polished, offline-first Progressive Web App for professional small-business management: sales, inventory, suppliers, credit, expenses and reports.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "ShopSuite — Professional Small Business Management",
    template: "%s · ShopSuite",
  },
  description: SITE_DESCRIPTION,
  keywords: [
    "shop management", "small business", "inventory management", "sales tracking",
    "POS", "point of sale", "PWA", "offline app", "business management",
    "supplier management", "customer credit", "expense tracking",
    "Sri Lanka", "LKR", "retail management", "grocery shop", "mini market",
  ],
  authors: [{ name: "Dumindu Wanasinghe", url: "https://dumindu.vercel.app" }],
  creator: "Dumindu Wanasinghe",
  publisher: "ShopSuite",
  applicationName: "ShopSuite",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "ShopSuite",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { url: "/favicon.ico", sizes: "any" },
    ],
    apple: [{ url: "/icons/icon-1024.png", sizes: "1024x1024", type: "image/png" }],
  },
  formatDetection: { telephone: false },
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: "ShopSuite — Professional Small Business Management",
    description: SITE_DESCRIPTION,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "ShopSuite — Professional Small Business Management",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ShopSuite — Professional Small Business Management",
    description: SITE_DESCRIPTION,
    images: ["/og-image.png"],
    creator: "@DuminduWanasinghe",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    // AI-friendly metadata
    "ai:site-name": "ShopSuite",
    "ai:description": SITE_DESCRIPTION,
    "ai:developer": "Dumindu Wanasinghe",
    "google-site-verification": "google53e23fb6a2391241.html",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0c0a09" },
    { media: "(prefers-color-scheme: light)", color: "#fafaf9" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

/**
 * Inline script that runs BEFORE React hydration to apply the user's saved
 * theme + background to <html>. Prevents a flash of wrong theme.
 * v3.1 — reads themeId + backgroundId from the localStorage mirror.
 */
const themeBootstrap = `(function(){
  try {
    var raw = localStorage.getItem('shop-manager-settings');
    var s = raw ? JSON.parse(raw) : null;
    var themeId = (s && s.themeId) || 'modern-dark';
    var root = document.documentElement;
    var isDark = themeId !== 'light-pro';
    root.classList.toggle('dark', isDark);
    root.lang = 'en';
    root.dir = 'ltr';
    // Apply minimal theme vars for the bootstrap (full set applied by React)
    var themes = {
      'modern-dark':  { bg: '#0c0a09', fg: '#fef3c7', primary: '#fbbf24' },
      'classic-blue': { bg: '#0a0f1e', fg: '#dbeafe', primary: '#3b82f6' },
      'emerald':      { bg: '#05140f', fg: '#d1fae5', primary: '#10b981' },
      'graphite':     { bg: '#09090b', fg: '#e4e4e7', primary: '#a1a1aa' },
      'indigo':       { bg: '#0f0a1e', fg: '#e0e7ff', primary: '#818cf8' },
      'light-pro':    { bg: '#fafaf9', fg: '#1c1917', primary: '#f59e0b' },
    };
    var t = themes[themeId] || themes['modern-dark'];
    root.style.setProperty('--background', t.bg);
    root.style.setProperty('--foreground', t.fg);
    root.style.setProperty('--primary', t.primary);
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();`;

// Structured data (JSON-LD) for SEO
const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "ShopSuite",
  "description": SITE_DESCRIPTION,
  "url": SITE_URL,
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Any (PWA)",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
  },
  "developer": {
    "@type": "Person",
    "name": "Dumindu Wanasinghe",
    "url": "https://dumindu.vercel.app",
  },
  "featureList": [
    "Sales tracking",
    "Inventory management",
    "Supplier management",
    "Customer credit tracking",
    "Expense tracking",
    "PDF reports",
    "Offline-first PWA",
    "Multi-currency support",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased app-body`}
      >
        {children}
      </body>
    </html>
  );
}
