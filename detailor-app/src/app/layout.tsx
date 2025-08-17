import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/lib/theme-provider";
import { NotificationsProvider } from "@/lib/notifications";
import { BrandLoader } from "@/lib/brand-loader";
import { BrandProvider } from "@/lib/BrandProvider";
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
  icons: [{ rel: 'icon', url: '/favicon.ico' }],
  openGraph: {
    title: 'Detailor',
    description: 'End-to-end platform for mobile car detailing businesses.',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: 'var(--color-primary)'
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
              <BrandProvider>
                {/* Inline minimal base tokens to reduce FOUC before BrandLoader applies tenant palette */}
                <style suppressHydrationWarning>
                  {`:root{--color-bg:#ffffff;--color-text:#111827;--color-surface:#f9fafb;--color-border:#e5e7eb;--color-muted:#f3f4f6;--color-text-muted:#6b7280;--color-primary:#3B82F6;--color-primary-foreground:#ffffff;--color-hover-surface:rgba(17,24,39,0.03);--color-active-surface:rgba(17,24,39,0.06);--color-success:#10B981;--color-success-foreground:#ffffff;--color-warning:#F59E0B;--color-warning-foreground:#111827;--color-error:#EF4444;--color-error-foreground:#ffffff;--color-info:#2563EB;}`}
                </style>
                <BrandLoader />
                <RealtimeBridge />
                <NotificationsProvider>{children}</NotificationsProvider>
              </BrandProvider>
            </AuthProvider>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
