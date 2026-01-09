import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { SoftwareApplicationJsonLd } from '@/components/seo/json-ld';
import { ThemeProvider } from '@/components/theme-provider';
import { createRootMetadata, getBaseUrl } from '@/lib/seo';
import './globals.css';

const baseUrl = getBaseUrl();

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-sans',
});

const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
});

export const metadata: Metadata = createRootMetadata(baseUrl);

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
