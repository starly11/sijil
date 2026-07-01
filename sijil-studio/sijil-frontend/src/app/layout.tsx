import type { Metadata, Viewport } from 'next';
import { Inter, Merriweather } from 'next/font/google';
import { Providers } from '@/app/providers';
import { MainLayout } from '@/components/layout/main-layout';
import { themeInitializerScript } from '@/lib/theme-provider';
import '@/app/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-serif',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    template: '%s | Sijil',
    default: 'Sijil - Digital Textbook Platform',
  },
  description: 'Comprehensive digital textbooks for Pakistani curriculum (PCTB). Access documents, topics, assessments, and more.',
  keywords: ['textbooks', 'education', 'Pakistan', 'PCTB', 'learning'],
  authors: [{ name: 'Sijil Team' }],
  creator: 'Sijil',
  publisher: 'Sijil',
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${merriweather.variable}`} suppressHydrationWarning>
      <head>
        {/* Blocking execution string layout step guarding systemic theme injection layout profiles prior to painting page trees */}
        <script dangerouslySetInnerHTML={{ __html: themeInitializerScript }} />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <MainLayout>
            {children}
          </MainLayout>
        </Providers>
      </body>
    </html>
  );
}
