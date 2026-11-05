"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number; // 0 to 100
  color?: "mint" | "blue" | "amber" | "emerald";
  className?: string;
}

export function ProgressBar({
  value,
  color = "mint",
  className,
}: ProgressBarProps) {
  const clamped = Math.min(100, Math.max(0, value));

  const colorStyles = {
    mint: "bg-teal-500 dark:bg-mint shadow-[0_0_12px_rgba(94,234,212,0.4)]",
    blue: "bg-blue-500 dark:bg-track-1 shadow-[0_0_12px_rgba(138,180,255,0.4)]",
    amber: "bg-amber-500 dark:bg-track-2 shadow-[0_0_12px_rgba(245,177,76,0.4)]",
    emerald: "bg-emerald-500 dark:bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.4)]",
  };

  return (
    <div
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "relative h-2 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-ink-700/80",
        className
      )}
    >
      <div
        className={cn(
          "h-full rounded-full transition-all duration-500 ease-out",
          colorStyles[color]
        )}
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}

interface SegmentedProgressBarProps {
  totalSegments: number;
  currentSegment: number; // 0-indexed or 1-indexed
  completedSegments?: number[];
  className?: string;
}

export function SegmentedProgressBar({
  totalSegments,
  currentSegment,
  completedSegments = [],
  className,
}: SegmentedProgressBarProps) {
  return (
    <div
      role="progressbar"
      aria-valuenow={currentSegment}
      aria-valuemin={0}
      aria-valuemax={totalSegments}
      className={cn("flex w-full items-center gap-1.5", className)}
    >
      {Array.from({ length: totalSegments }).map((_, index) => {
        const isCurrent = index === currentSegment;
        const isCompleted = completedSegments.includes(index) || index < currentSegment;

        return (
          <div
            key={index}
            className={cn(
              "h-1.5 flex-1 rounded-full transition-all duration-300",
              isCompleted
                ? "bg-teal-500 dark:bg-mint shadow-[0_0_8px_rgba(94,234,212,0.4)]"
                : isCurrent
                ? "bg-teal-500/80 dark:bg-mint/80 animate-pulse"
                : "bg-slate-200 dark:bg-ink-700/70"
            )}
          />
        );
      })}
    </div>
  );
}
