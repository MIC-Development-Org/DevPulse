import * as React from "react";
import { Lightbulb, AlertTriangle, Info, AlertOctagon } from "lucide-react";
import { cn } from "@/lib/utils";

interface CalloutProps {
  type?: "tip" | "mistake" | "note" | "warning";
  title?: string;
  children: React.ReactNode;
  className?: string;
}

export function Callout({
  type = "note",
  title,
  children,
  className,
}: CalloutProps) {
  const config = {
    tip: {
      icon: Lightbulb,
      defaultTitle: "Pro Tip",
      containerClass: "border-teal-500/30 bg-teal-500/10 dark:bg-mint/5 text-foreground",
      iconClass: "text-teal-700 dark:text-mint",
      titleClass: "text-teal-900 dark:text-mint font-bold",
    },
    mistake: {
      icon: AlertOctagon,
      defaultTitle: "Common Mistake",
      containerClass: "border-rose-500/30 bg-rose-500/10 dark:bg-rose-500/5 text-foreground",
      iconClass: "text-rose-600 dark:text-rose-400",
      titleClass: "text-rose-900 dark:text-rose-300 font-bold",
    },
    warning: {
      icon: AlertTriangle,
      defaultTitle: "Security Warning",
      containerClass: "border-amber-500/30 bg-amber-500/10 dark:bg-amber-500/5 text-foreground",
      iconClass: "text-amber-600 dark:text-amber-400",
      titleClass: "text-amber-900 dark:text-amber-300 font-bold",
    },
    note: {
      icon: Info,
      defaultTitle: "Architectural Note",
      containerClass: "border-blue-500/30 bg-blue-500/10 dark:bg-track-1/5 text-foreground",
      iconClass: "text-blue-600 dark:text-track-1",
      titleClass: "text-blue-900 dark:text-track-1 font-bold",
    },
  };

  const { icon: Icon, defaultTitle, containerClass, iconClass, titleClass } =
    config[type];

  return (
    <div
      role="note"
      className={cn(
        "my-6 flex gap-3.5 rounded-xl border p-4 text-sm leading-relaxed shadow-sm",
        containerClass,
        className
      )}
    >
      <div className="pt-0.5 shrink-0">
        <Icon className={cn("w-5 h-5", iconClass)} />
      </div>
      <div className="flex-1 space-y-1">
        <p className={cn("font-display text-sm tracking-tight", titleClass)}>
          {title || defaultTitle}
        </p>
        <div className="text-foreground/85 dark:text-foreground/80 leading-relaxed text-sm [&>p]:leading-relaxed">
          {children}
        </div>
      </div>
    </div>
  );
}
