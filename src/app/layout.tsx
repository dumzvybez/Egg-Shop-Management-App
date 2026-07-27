import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Shop Manager",
  description: "Shop Manager — modern offline-first Progressive Web App for small-business management: sales, inventory, suppliers, credit, expenses and reports.",
  applicationName: "Shop Manager",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Shop Manager",
  },
  icons: {
    icon: "/icons/icon-1024.png",
    apple: "/icons/icon-1024.png",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#0c0a09",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

/**
 * Inline script that runs BEFORE React hydration to apply the user's saved
 * theme to <html>. Prevents a flash of wrong theme. Reads from
 * localStorage mirror written by the app whenever settings change.
 */
const themeBootstrap = `(function(){
  try {
    var raw = localStorage.getItem('shop-manager-settings');
    var s = raw ? JSON.parse(raw) : null;
    var theme = (s && s.theme) || 'dark';
    var root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.lang = 'en';
    root.dir = 'ltr';
  } catch (e) {
    document.documentElement.classList.add('dark');
  }
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body
        className={`${inter.variable} font-sans antialiased app-body`}
      >
        {children}
      </body>
    </html>
  );
}
