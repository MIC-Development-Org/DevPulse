import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  withBadge?: boolean;
}

export function Logo({ className, size = "md", withBadge = true }: LogoProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-xl",
    lg: "text-2xl",
  };

  return (
    <Link
      href="/"
      aria-label="DevPulse Homepage"
      className={cn(
        "group inline-flex items-center gap-2.5 font-display font-bold tracking-tight select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-mint rounded-lg px-1 py-0.5",
        className
      )}
    >
      {/* MIC Hexagonal Logo Icon */}
      <div
        className={cn(
          "relative flex items-center justify-center transition-transform duration-300 group-hover:scale-105",
          iconSizes[size]
        )}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full drop-shadow-[0_0_12px_rgba(94,234,212,0.35)]"
        >
          {/* Outer Hexagon */}
          <polygon
            points="50,5 90,27.5 90,72.5 50,95 10,72.5 10,27.5"
            stroke="currentColor"
            strokeWidth="5"
            className="text-teal-600 dark:text-mint transition-all duration-300"
          />
          {/* Inner Hexagon Layer */}
          <polygon
            points="50,20 78,35 78,65 50,80 22,65 22,35"
            fill="currentColor"
            className="text-teal-600/10 dark:text-mint/15"
          />
          {/* Center Tech Core */}
          <circle cx="50" cy="50" r="10" className="fill-teal-600 dark:fill-mint animate-pulse-subtle" />
          <line x1="50" y1="5" x2="50" y2="25" stroke="currentColor" strokeWidth="4" className="text-teal-600 dark:text-mint" />
          <line x1="90" y1="72.5" x2="72" y2="62" stroke="#6366F1" strokeWidth="4" />
          <line x1="10" y1="72.5" x2="28" y2="62" stroke="#F59E0B" strokeWidth="4" />
        </svg>
      </div>

      {/* Brand Name */}
      <div className="flex items-center gap-2 shrink-0">
        <span className={cn("font-display tracking-tight text-foreground", textSizes[size])}>
          Dev<span className="text-teal-600 dark:text-mint">Pulse</span>
        </span>
        {withBadge && (
          <span className="hidden sm:inline-flex items-center whitespace-nowrap rounded-md border border-teal-600/20 dark:border-mint/20 bg-teal-600/10 dark:bg-mint/5 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-teal-700 dark:text-mint uppercase tracking-wider">
            MIC 26-27
          </span>
        )}
      </div>
    </Link>
  );
}
