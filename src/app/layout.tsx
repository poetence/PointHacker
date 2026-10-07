import type { Metadata, Viewport } from "next";
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

// Browser chrome (mobile address bar, tab strip) matches the page ground.
export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafafa" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        {/* Keyboard users would otherwise tab through every nav link on every page. */}
        <a
          href="#main"
          className="sr-only rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 dark:bg-emerald-500 dark:text-emerald-950"
        >
          Skip to content
        </a>
        <Nav />
        <main id="main" tabIndex={-1} className="rise-in flex-1 focus:outline-none">
          {children}
        </main>
        <footer className="border-t border-zinc-200/80 px-6 py-6 text-center text-xs text-zinc-500 dark:border-zinc-800/80 dark:text-zinc-500">
          Values and award prices are ballpark estimates — always check the program before you
          transfer.
        </footer>
      </body>
    </html>
  );
}
