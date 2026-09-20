import type { Metadata } from "next";
import { Geist, Geist_Mono, Space_Grotesk } from "next/font/google";
import { Nav } from "@/components/nav";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PointHacker",
  description: "Maximize the value of your credit-card reward points.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Nav />
        <main className="rise-in flex-1">{children}</main>
        <footer className="border-t border-zinc-200/80 px-6 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-500">
          Values and award prices are ballpark estimates — always check the program before you
          transfer.
        </footer>
      </body>
    </html>
  );
}
