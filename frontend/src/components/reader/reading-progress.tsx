"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function ReadingProgress({ className }: { className?: string }) {
  const [completion, setCompletion] = React.useState(0);

  React.useEffect(() => {
    const handleScroll = () => {
      const totalHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (totalHeight > 0) {
        const progress = Math.min(100, Math.max(0, (window.scrollY / totalHeight) * 100));
        setCompletion(progress);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={cn("fixed top-0 left-0 right-0 h-1 z-50 bg-transparent", className)}
    >
      <div
        className="h-full bg-gradient-to-r from-mint via-track-1 to-mint shadow-[0_0_10px_rgba(94,234,212,0.5)] transition-transform duration-75 origin-left"
        style={{ transform: `scaleX(${completion / 100})` }}
      />
    </div>
  );
}

