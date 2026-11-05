"use client";

import * as React from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Logo } from "../brand/logo";
import { ThemeToggle } from "./theme-toggle";
import {
  Search,
  Flame,
  HelpCircle,
  Menu,
  X,
  Compass,
  Award,
  LayoutDashboard,
  User,
  LogOut,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { readXPState, computeXPState, type XPState } from "@/lib/gamification/xp";
import { useModKey } from "@/lib/shortcut";

interface NavbarProps {
  onOpenSearch?: () => void;
  onOpenShortcuts?: () => void;
}

export function Navbar({ onOpenSearch, onOpenShortcuts }: NavbarProps) {
  const pathname = usePathname();
  const modKey = useModKey();
  const { data: session } = useSession();
  const user = session?.user ?? null;
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const [xpState, setXpState] = React.useState<XPState | null>(null);
  const [prevXP, setPrevXP] = React.useState(0);
  const [xpFlash, setXpFlash] = React.useState(false);

  React.useEffect(() => {
    const state = readXPState();
    setXpState(state);
    setPrevXP(state.totalXP);

    // Listen for XP gain events
    const handleXPGain = () => {
      const next = readXPState();
      if (next.totalXP !== prevXP) {
        setXpFlash(true);
        setXpState(next);
        setPrevXP(next.totalXP);
        setTimeout(() => setXpFlash(false), 600);
      }
    };
    window.addEventListener("devpulse:xp-gain", handleXPGain);
    return () => window.removeEventListener("devpulse:xp-gain", handleXPGain);
  }, [prevXP]);

  const navLinks = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Curriculum", href: "/learn", icon: Compass },
    { label: "Certificates", href: "/certificates", icon: Award },
  ];

  const streakDays = 14;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/90 backdrop-blur-xl transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Logo & Links */}
        <div className="flex items-center gap-6 lg:gap-8 min-w-0">
          <Logo className="shrink-0" />

          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => {
              const isActive =
                link.href === "/"
                  ? pathname === "/"
                  : pathname.startsWith(link.href);
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 group",
                    isActive
                      ? "text-teal-700 dark:text-mint font-semibold"
                      : "text-foreground/65 hover:text-foreground"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {link.label}
                  {/* Active underline indicator */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-active"
                      className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-mint"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  {/* Hover bg */}
                  <motion.div
                    className="absolute inset-0 rounded-lg bg-slate-100 dark:bg-card-subtle opacity-0 group-hover:opacity-100 -z-10"
                    transition={{ duration: 0.15 }}
                  />
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Command Palette Trigger */}
          <button
            onClick={onOpenSearch}
            aria-label="Open command search (Ctrl+K)"
            className="hidden sm:flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-slate-100 dark:bg-card/70 hover:bg-slate-200 dark:hover:bg-card text-slate-600 dark:text-foreground/75 hover:text-foreground text-xs transition-all duration-150 font-medium whitespace-nowrap shrink-0"
          >
            <Search className="w-3.5 h-3.5 text-teal-600 dark:text-mint shrink-0" />
            <span className="hidden xl:inline">Search modules...</span>
            <kbd className="hidden sm:inline-flex items-center gap-1 rounded border border-slate-300 dark:border-border bg-white dark:bg-card-subtle px-1.5 py-0.5 text-[10px] font-mono text-slate-500 dark:text-foreground/60 shadow-sm shrink-0">
              {modKey} K
            </kbd>
          </button>

          {/* Streak Counter */}
          <Link
            href="/dashboard"
            aria-label={`Current streak: ${streakDays} days`}
            className="group flex items-center gap-1.5 h-9 px-3 rounded-lg border border-amber-400/40 bg-amber-400/10 hover:bg-amber-400/20 text-amber-700 dark:text-amber-400 transition-all duration-150"
          >
            <Flame className="w-4 h-4 fill-amber-500 text-amber-500 group-hover:scale-110 transition-transform" />
            <span className="font-mono text-xs font-bold">{streakDays}</span>
          </Link>

          {/* XP Level Badge (desktop only) */}
          {xpState && (
            <Link
              href="/profile"
              aria-label={`Level ${xpState.level}: ${xpState.levelTitle}, ${xpState.totalXP} XP`}
              className="hidden xl:flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-card/60 hover:bg-card transition-all duration-150 group"
            >
              {/* Mini XP Bar */}
              <div className="flex flex-col justify-center gap-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] font-bold text-foreground/50">
                    LVL
                  </span>
                  <motion.span
                    key={xpState.level}
                    initial={{ scale: 1.4, color: "#5EEAD4" }}
                    animate={{ scale: 1, color: "inherit" }}
                    className="font-display text-xs font-bold text-foreground"
                  >
                    {xpState.level}
                  </motion.span>
                </div>
                {/* Progress track */}
                <div className="w-16 h-1 rounded-full bg-border overflow-hidden">
                  <motion.div
                    className={cn(
                      "h-full rounded-full",
                      xpFlash ? "bg-mint shadow-[0_0_6px_rgba(94,234,212,0.8)]" : "bg-mint/70"
                    )}
                    initial={{ width: 0 }}
                    animate={{ width: `${xpState.progressInLevel}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </div>
              <span className="font-mono text-[10px] text-foreground/50 font-semibold">
                {xpState.totalXP.toLocaleString()} XP
              </span>
            </Link>
          )}

          {/* Shortcuts */}
          <button
            onClick={onOpenShortcuts}
            aria-label="Keyboard shortcuts (?)"
            className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg border border-border text-foreground/60 hover:text-foreground hover:bg-slate-100 dark:hover:bg-card-subtle transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <ThemeToggle />

          {/* Sign out (authenticated users only) */}
          {user && (
            <button
              onClick={() => void signOut({ callbackUrl: "/" })}
              aria-label="Sign out"
              title="Sign out"
              className="hidden sm:flex items-center justify-center w-9 h-9 rounded-lg border border-border text-foreground/60 hover:text-foreground hover:bg-slate-100 dark:hover:bg-card-subtle transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}

          {/* Profile Avatar — session-aware: real user identity, or a neutral
              placeholder when signed out (replaces the hardcoded mock avatar) */}
          <Link
            href="/profile"
            aria-label={user ? `Signed in as ${user.name ?? user.email ?? "user"}` : "User Profile"}
            className="relative flex items-center justify-center w-9 h-9 rounded-full ring-2 ring-border hover:ring-mint transition-all duration-200 overflow-hidden group"
          >
            {user?.image ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={user.image}
                alt={user.name ?? "Profile"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
              />
            ) : user?.name || user?.email ? (
              <span className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-ink-900 font-display text-xs font-bold text-foreground/70 group-hover:scale-105 transition-transform duration-200">
                {(user.name ?? user.email ?? "?").charAt(0).toUpperCase()}
              </span>
            ) : (
              <span className="w-full h-full flex items-center justify-center bg-slate-200 dark:bg-ink-900 text-foreground/60">
                <User className="w-4 h-4" />
              </span>
            )}
          </Link>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            className="lg:hidden flex items-center justify-center w-9 h-9 rounded-lg border border-border text-foreground/80 hover:text-foreground hover:bg-slate-100 dark:hover:bg-card-subtle transition-colors"
          >
            <motion.div
              animate={{ rotate: mobileMenuOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </motion.div>
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      <motion.div
        initial={false}
        animate={{ height: mobileMenuOpen ? "auto" : 0, opacity: mobileMenuOpen ? 1 : 0 }}
        transition={{ duration: 0.2, ease: "easeInOut" }}
        className="lg:hidden overflow-hidden border-b border-border bg-card/95 backdrop-blur-xl"
      >
        <div className="px-4 py-4 space-y-1">
          <button
            onClick={() => { setMobileMenuOpen(false); onOpenSearch?.(); }}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-slate-100 dark:hover:bg-card-subtle transition-colors"
          >
            <Search className="w-5 h-5" />
            Search modules…
          </button>
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  isActive
                    ? "text-teal-700 dark:text-mint bg-teal-50 dark:bg-mint/10 font-semibold"
                    : "text-foreground/70 hover:text-foreground hover:bg-slate-100 dark:hover:bg-card-subtle"
                )}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
          <div className="pt-2 border-t border-border flex items-center justify-between">
            <Link
              href="/profile"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground px-3 py-2 rounded-lg transition-colors"
            >
              <User className="w-4 h-4" /> Profile & Settings
            </Link>
            {user ? (
              <button
                onClick={() => { setMobileMenuOpen(false); void signOut({ callbackUrl: "/" }); }}
                className="flex items-center gap-2 text-sm text-foreground/70 hover:text-foreground px-3 py-2 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" /> Sign out
              </button>
            ) : (
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-2 text-sm text-mint font-semibold px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-card-subtle transition-colors"
              >
                Sign in
              </Link>
            )}
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenShortcuts?.(); }}
              className="text-xs text-foreground/50 hover:text-foreground font-mono px-3 py-2 rounded-lg transition-colors"
            >
              Shortcuts (?)
            </button>
          </div>
          {/* Mobile XP display */}
          {xpState && (
            <div className="px-3 py-3 rounded-xl border border-border bg-slate-50 dark:bg-ink-950/50 flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono text-foreground/50 uppercase tracking-wider">
                  Level {xpState.level} — {xpState.levelTitle}
                </span>
                <div className="w-40 h-1.5 rounded-full bg-border overflow-hidden">
                  <div
                    className="h-full rounded-full bg-mint"
                    style={{ width: `${xpState.progressInLevel}%` }}
                  />
                </div>
              </div>
              <div className="text-right">
                <span className="font-display text-sm font-bold text-mint">
                  {xpState.totalXP.toLocaleString()}
                </span>
                <span className="text-[10px] text-foreground/50 font-mono ml-1">XP</span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </header>
  );
}
