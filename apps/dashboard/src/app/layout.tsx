import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { SoftwareApplicationJsonLd } from '@/components/seo/json-ld';
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'http://localhost:3000';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: 'FieldMCP - Agricultural API Platform',
    template: '%s | FieldMCP',
  },
  description: 'Connect your AI to farm data in minutes, not weeks.',
  appleWebApp: {
    title: 'FieldMCP',
  },
  openGraph: {
    title: 'FieldMCP - Agricultural API Platform',
    description: 'Connect your AI to farm data in minutes, not weeks.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'FieldMCP - Agricultural API Platform',
    description: 'Connect your AI to farm data in minutes, not weeks.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} font-sans antialiased`}
      >
        <SoftwareApplicationJsonLd baseUrl={baseUrl} />
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
