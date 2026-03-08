import type { Metadata } from "next";
import Script from "next/script";
import clsx from "clsx";

import "./globals.css";
import { ThemeProvider } from "@/contexts/theme-context";
import { ThemeSwitcher } from "@/app/ui/theme-switcher";

import { stoneSerif, wenHeiSans, runYuanSerif } from "@/app/ui/fonts";
import { Header, Footer } from "@/app/ui/nav-bar";
import MathJaxLoader from "@/components/mathjax-loader";

export const metadata: Metadata = {
  title: "课程讲义笔记 - zhenxing.space",
  description: "清华大学电子工程系2023级本科生的听课笔记",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh"
      className={`${stoneSerif.variable} ${wenHeiSans.variable} ${runYuanSerif.variable}`}>
      <body className="autospace text-lg">
        <ThemeProvider>
          {/* Header is now a client component to handle scroll effects */}
          <Header />

          {/* Page content */}
          <main className="mx-0 min-h-[calc(100vh-236px)] pt-64 pb-16">{children}</main>

          {/* Footer with contact info */}
          <Footer />

          {/* MathJax with custom macros */}
          <MathJaxLoader />
        </ThemeProvider>
      </body>
    </html>
  );
}
