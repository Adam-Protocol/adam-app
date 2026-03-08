import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Navbar } from "@/components/layout/Navbar";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Adam Protocol — Privacy-First Stablecoin on Starknet",
  description:
    "Mint, swap, and offramp ADUSD & ADNGN stablecoins with full on-chain privacy using Pedersen commitments on Starknet.",
  keywords: ["Starknet", "DeFi", "stablecoin", "privacy", "NGN", "offramp"],
  openGraph: {
    title: "Adam Protocol",
    description: "Privacy-first stablecoin offramp for Africa and beyond.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body
        className={`${inter.variable} font-sans antialiased bg-page min-h-screen`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
