import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-provider";
import { NotificationsProvider } from "@/lib/notifications";
import { BrandLoader } from "@/lib/brand-loader";
import { QueryProvider } from "@/lib/query-client";
import { RealtimeBridge } from "@/components/RealtimeBridge";
import { AuthProvider } from "@/lib/auth-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: 'Detailor',
  description: 'Run your detailing business end-to-end: bookings, payments, messaging, analytics, and a branded homepage.',
  applicationName: 'Detailor',
  viewport: { width: 'device-width', initialScale: 1, viewportFit: 'cover' },
  themeColor: '#3B82F6',
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
  openGraph: {
    title: 'Detailor',
    description: 'End-to-end platform for mobile car detailing businesses.',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {/* In a real app, derive tenantId from domain or session */}
        <ThemeProvider paletteName="Master">
          <QueryProvider>
            <AuthProvider>
              <BrandLoader />
              <RealtimeBridge />
              <NotificationsProvider>{children}</NotificationsProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
