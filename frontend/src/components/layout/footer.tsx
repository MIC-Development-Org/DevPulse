import * as React from "react";
import Link from "next/link";
import { Logo } from "../brand/logo";
import { ShieldCheck, Terminal, Award, Compass } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border bg-slate-50 dark:bg-ink-950 text-foreground/80 py-12 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Col 1: Brand & Mission */}
          <div className="md:col-span-1 space-y-4">
            <Logo size="md" />
            <p className="text-sm text-foreground/70 leading-relaxed">
              An engineering-grade learning platform taking students from internet foundations through full-stack systems to blockchain architecture.
            </p>
            <div className="inline-flex items-center gap-2 rounded-full border border-mint/30 bg-mint/10 dark:bg-mint/5 px-3 py-1 text-xs text-mint-700 dark:text-mint font-semibold">
              <span className="w-2 h-2 rounded-full bg-mint animate-pulse" />
              All Systems Operational
            </div>
          </div>

          {/* Col 2: Curriculum Tracks */}
          <div className="space-y-3">
            <p className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">
              Learning Tracks
            </p>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li>
                <Link
                  href="/learn/web-foundations"
                  className="hover:text-mint transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-mint" />
                  Track 0: Web Foundations
                </Link>
              </li>
              <li>
                <Link
                  href="/learn/full-stack"
                  className="hover:text-track-1 transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-track-1" />
                  Track 1: Full-Stack Dev
                </Link>
              </li>
              <li>
                <Link
                  href="/learn/blockchain"
                  className="hover:text-track-2 transition-colors flex items-center gap-2"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-track-2" />
                  Track 2: Blockchain & Web3
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Resources & Tools */}
          <div className="space-y-3">
            <p className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">
              Platform & Tools
            </p>
            <ul className="space-y-2 text-sm text-foreground/70">
              <li>
                <Link href="/certificates" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-track-2" /> Free Certificates Directory
                </Link>
              </li>
              <li>
                <Link href="/learn/web-foundations/git-basics" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-mint" /> Interactive Git Visualiser
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="hover:text-foreground transition-colors flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-track-1" /> Progress & Activity Heatmap
                </Link>
              </li>
              <li>
                <Link href="/storybook" className="hover:text-foreground transition-colors">
                  Design System Catalog
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 4: MIC Development Dept */}
          <div className="space-y-3">
            <p className="font-display text-sm font-semibold text-foreground uppercase tracking-wider">
              Organization
            </p>
            <p className="text-xs text-foreground/70 leading-relaxed">
              DevPulse is designed and maintained by <strong>MIC Development Dept, Team 5 (2026-27)</strong>.
            </p>
            <div className="pt-2 text-xs flex items-center gap-1.5 text-foreground/70">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> WCAG 2.2 AA Accessible
            </div>
            <div className="text-xs flex items-center gap-1.5 text-foreground/70">
              <Terminal className="w-4 h-4 text-mint" /> High-Craft Next.js Architecture
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-foreground/60">© 2026-2027 MIC Development Org. Open source under MIT License.</p>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-foreground/35 mr-1">Built with</span>
            {["Next.js 14", "TypeScript", "Tailwind CSS", "Framer Motion"].map((tech) => (
              <span
                key={tech}
                className="rounded-full border border-border bg-card px-2.5 py-0.5 text-[10px] font-mono text-foreground/55 transition-colors hover:text-foreground hover:border-mint/40"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
