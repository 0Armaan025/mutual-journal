import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, JetBrains_Mono } from "next/font/google";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Toaster } from "@/components/Toaster";
import AppShell from "@/components/AppShell";
import "./globals.css";

const sans = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});
const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Mutual Journal",
  description: "A shared journal for you and yours. Markdown, together, over one link.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var d=document.documentElement;var t=localStorage.getItem('mj:theme');d.dataset.theme=t||(window.matchMedia('(prefers-color-scheme: light)').matches?'light':'dark');d.dataset.accent=localStorage.getItem('mj:accent')||'amber';}catch(e){d.dataset.theme='dark';d.dataset.accent='amber';}})();`,
          }}
        />
      </head>
      <body className={`${sans.variable} ${mono.variable}`}>
        <ThemeProvider>
          <Toaster>
            <AppShell>{children}</AppShell>
          </Toaster>
        </ThemeProvider>
      </body>
    </html>
  );
}
