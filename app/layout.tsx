import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });

export const metadata: Metadata = {
  title: "ETF Reconciliation Tool",
  description: "Reconcile vendor holdings files against internal records. Surface mismatches and exceptions.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${geist.variable} ${geistMono.variable}`}>
      <body className="bg-[#f6f6f6] text-[#191919] antialiased font-[family-name:var(--font-geist)]">
        {children}
      </body>
    </html>
  );
}
