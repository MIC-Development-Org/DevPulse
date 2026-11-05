"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressRingProps {
  value: number; // 0 to 100
  size?: number; // diameter in px
  strokeWidth?: number;
  color?: "mint" | "blue" | "amber" | "emerald" | "rose";
  showLabel?: boolean;
  className?: string;
  labelClassName?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  value,
  size = 120,
  strokeWidth = 10,
  color = "mint",
  showLabel = true,
  className,
  labelClassName,
  children,
}: ProgressRingProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  // Draw-on animation: paint 0 first, then sweep to the real value after
  // mount. SSR and the first client paint agree (0), so no hydration drift.
  const [displayValue, setDisplayValue] = React.useState(0);
  React.useEffect(() => {
    const t = setTimeout(() => setDisplayValue(clampedValue), 120);
    return () => clearTimeout(t);
  }, [clampedValue]);
  const strokeDashoffset = circumference - (displayValue / 100) * circumference;

  const colorStyles = {
    mint: "text-teal-600 dark:text-mint stroke-teal-600 dark:stroke-mint",
    blue: "text-blue-600 dark:text-track-1 stroke-blue-600 dark:stroke-track-1",
    amber: "text-amber-600 dark:text-track-2 stroke-amber-600 dark:stroke-track-2",
    emerald: "text-emerald-600 dark:text-emerald-400 stroke-emerald-600 dark:stroke-emerald-400",
    rose: "text-rose-600 dark:text-rose-500 stroke-rose-600 dark:stroke-rose-500",
  };

  return (
    <div
      role="progressbar"
      aria-valuenow={clampedValue}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn("relative inline-flex items-center justify-center", className)}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        className="rotate-[-90deg] transition-all duration-500"
      >
        {/* Background Track Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-slate-200 dark:stroke-ink-700/80 fill-none"
        />
        {/* Active Animated Ring */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className={cn(
            "fill-none transition-[stroke-dashoffset] duration-1000 ease-out",
            colorStyles[color]
          )}
        />
      </svg>
      {/* Center Label or Custom Node */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children ? (
          children
        ) : showLabel ? (
          <span
            className={cn(
              "font-display text-xl font-bold tracking-tight text-foreground",
              labelClassName
            )}
          >
            {clampedValue}%
          </span>
        ) : null}
      </div>
    </div>
  );
}
