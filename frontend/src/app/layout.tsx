import type { Metadata, Viewport } from "next";
import { Space_Grotesk, Inter, JetBrains_Mono } from "next/font/google";
import "@/styles/globals.css";
// Phase 3: hard production mock guard — module init fails build page-data
// collection and every production server render when mock data would be
// served without the sanctioned e2e escape (see lib/api/guard.server.ts,
// docs/environments.md). Server-only; the browser is never responsible.
import "@/lib/api/guard.server";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { ClientShell } from "@/components/layout/client-shell";

// Brand typefaces from DESIGN.md — self-hosted via next/font (zero FOUC / CLS)
const displayFont = Space_Grotesk({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-space-grotesk",
  display: "swap",
});
const sansFont = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});
const monoFont = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "DevPulse | High-Craft Developer Learning Platform",
  description:
    "Master web fundamentals, modern full-stack systems, and audited blockchain architecture. Built with award-winning craft by MIC Development Dept, Team 5 (2026-27).",
  keywords: [
    "developer learning platform",
    "web foundations",
    "full-stack development",
    "blockchain engineering",
    "git visualizer",
    "interactive coding",
    "MIC Development",
  ],
  authors: [{ name: "MIC Development Team 5" }],
  openGraph: {
    title: "DevPulse | Web Foundations to Blockchain",
    description: "An engineering-grade learning platform competing with the best.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0B10" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${displayFont.variable} ${sansFont.variable} ${monoFont.variable} min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-mint/20 selection:text-mint antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <ToastProvider>
            <ClientShell>{children}</ClientShell>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
