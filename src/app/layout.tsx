import type { Metadata } from 'next';
import { ThemeProvider } from '@/contexts/theme-context';

import Script from 'next/script';
import clsx from 'clsx';

import './globals.css';
import { stoneSerif, wenHeiSans, runYuanSerif } from '@/app/ui/fonts';
import { Header, Footer } from '@/app/ui/nav-bar';
import MathJaxLoader from '@/components/mathjax-loader';

export const metadata: Metadata = {
  title: 'Lecture Notes - CHEN Zhen-Xing',
  description:
    'Personal academic lecture notes by CHEN Zhen-Xing, Tsinghua University.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${stoneSerif.variable} ${wenHeiSans.variable} ${runYuanSerif.variable}`}>
      <body className="text-lg font-serif">
        <ThemeProvider>
          {/* Header is now a client component to handle scroll effects */}
          <Header />

          {/* Page content */}
          <main className="mx-0 pt-64 pb-16">
            {children}
          </main>

          {/* Footer with contact info */}
          <Footer />

          {/* MathJax with custom macros */}
          <MathJaxLoader />
        </ThemeProvider>
      </body>
    </html>
  );
}

