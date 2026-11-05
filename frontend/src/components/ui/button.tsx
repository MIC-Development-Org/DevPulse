"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "outline"
    | "ghost"
    | "danger"
    | "track-0"
    | "track-1"
    | "track-2";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles =
      "inline-flex items-center justify-center font-medium transition-all duration-200 select-none disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background";

    const variantStyles = {
      primary:
        "bg-mint text-ink-950 font-semibold hover:bg-mint-400 shadow-[0_0_20px_-3px_rgba(94,234,212,0.35)] hover:shadow-[0_0_25px_0_rgba(94,234,212,0.5)] focus-visible:ring-mint",
      secondary:
        "bg-card text-foreground border border-border hover:bg-card-subtle hover:border-ink-500/40 focus-visible:ring-mint",
      outline:
        "border border-border text-foreground hover:bg-card-subtle hover:text-foreground focus-visible:ring-mint",
      ghost:
        "text-foreground/80 hover:text-foreground hover:bg-card-subtle focus-visible:ring-mint",
      danger:
        "bg-rose-500 text-white hover:bg-rose-600 shadow-[0_0_15px_-3px_rgba(244,63,94,0.4)] focus-visible:ring-rose-400",
      "track-0":
        "bg-mint/10 text-mint border border-mint/30 hover:bg-mint/20 hover:border-mint/50 focus-visible:ring-mint",
      "track-1":
        "bg-track-1/10 text-track-1 border border-track-1/30 hover:bg-track-1/20 hover:border-track-1/50 focus-visible:ring-track-1",
      "track-2":
        "bg-track-2/10 text-track-2 border border-track-2/30 hover:bg-track-2/20 hover:border-track-2/50 focus-visible:ring-track-2",
    };

    const sizeStyles = {
      sm: "h-8 px-3 text-xs rounded-md gap-1.5 min-h-[36px]",
      md: "h-10 px-4 text-sm rounded-lg gap-2 min-h-[44px]",
      lg: "h-12 px-6 text-base rounded-xl gap-2.5 min-h-[48px]",
      icon: "h-10 w-10 p-0 rounded-lg min-h-[44px] min-w-[44px]",
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variantStyles[variant], sizeStyles[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

