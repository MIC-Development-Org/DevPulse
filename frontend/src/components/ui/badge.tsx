import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "mint"
    | "blue"
    | "amber"
    | "emerald"
    | "rose";
}

export function Badge({
  className,
  variant = "default",
  ...props
}: BadgeProps) {
  const variantStyles = {
    default:
      "bg-slate-200 text-slate-800 dark:bg-ink-700 dark:text-ink-100 border-border",
    secondary:
      "bg-slate-100 text-slate-700 dark:bg-card-subtle dark:text-foreground/80 border-border",
    outline:
      "border border-border text-foreground/80 bg-transparent",
    mint:
      "bg-teal-500/10 text-teal-800 dark:bg-mint/10 dark:text-mint border-teal-500/30 dark:border-mint/20 font-semibold",
    blue:
      "bg-blue-500/10 text-blue-800 dark:bg-track-1/10 dark:text-track-1 border-blue-500/30 dark:border-track-1/20 font-semibold",
    amber:
      "bg-amber-500/10 text-amber-800 dark:bg-track-2/10 dark:text-track-2 border-amber-500/30 dark:border-track-2/20 font-semibold",
    emerald:
      "bg-emerald-500/10 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-500/30 dark:border-emerald-500/20 font-semibold",
    rose:
      "bg-rose-500/10 text-rose-800 dark:bg-rose-500/10 dark:text-rose-400 border-rose-500/30 dark:border-rose-500/20 font-semibold",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium tracking-wide transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}
