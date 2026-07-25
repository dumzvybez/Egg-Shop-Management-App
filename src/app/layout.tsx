import type { Metadata, Viewport } from "next";
import { Noto_Sans_Sinhala, Inter } from "next/font/google";
import "./globals.css";

const sinhala = Noto_Sans_Sinhala({
  variable: "--font-sinhala",
  subsets: ["sinhala", "latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EggShop",
  description: "EggShop — modern offline-first Progressive Web App for daily egg shop management.",
  applicationName: "EggShop",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "EggShop",
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
 * theme + language to <html>. Prevents a flash of wrong theme. Reads from
 * localStorage mirror written by the app whenever settings change.
 */
const themeBootstrap = `(function(){
  try {
    var raw = localStorage.getItem('eggshop-settings');
    var s = raw ? JSON.parse(raw) : null;
    var theme = (s && s.theme) || 'dark';
    var lang = (s && s.language) || 'si';
    var root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    root.lang = lang;
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
    <html lang="si" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrap }} />
      </head>
      <body
        className={`${sinhala.variable} ${inter.variable} font-sinhala antialiased app-body`}
      >
        {children}
      </body>
    </html>
  );
}
