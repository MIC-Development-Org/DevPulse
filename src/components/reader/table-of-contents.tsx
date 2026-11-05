"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { ListCollapse, ChevronRight } from "lucide-react";

export interface TocItem {
  id: string;
  title: string;
  level: number;
}

interface TableOfContentsProps {
  items: TocItem[];
  className?: string;
}

export function TableOfContents({ items, className }: TableOfContentsProps) {
  const [activeId, setActiveId] = React.useState<string>("");

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "0px 0px -70% 0px", threshold: 0.1 }
    );

    items.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [items]);

  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      setActiveId(id);
    }
  };

  return (
    <nav
      aria-label="Table of contents"
      className={cn(
        "rounded-xl border border-border bg-card/60 p-4 text-sm backdrop-blur-sm",
        className
      )}
    >
      <div className="flex items-center gap-2 mb-3 pb-2 border-b border-border text-foreground/80 font-display font-semibold text-xs uppercase tracking-wider">
        <ListCollapse className="w-4 h-4 text-mint" />
        <span>On This Page</span>
      </div>

      <ul className="space-y-1.5 text-xs">
        {items.map((item) => {
          const isActive = activeId === item.id;
          return (
            <li
              key={item.id}
              style={{ paddingLeft: `${(item.level - 2) * 12}px` }}
            >
              <button
                onClick={() => scrollTo(item.id)}
                className={cn(
                  "group flex items-center justify-between w-full text-left py-1 px-2 rounded-md transition-all duration-150",
                  isActive
                    ? "text-mint font-semibold bg-mint/10 border-l-2 border-mint"
                    : "text-foreground/60 hover:text-foreground hover:bg-card-subtle"
                )}
              >
                <span className="truncate">{item.title}</span>
                {isActive && (
                  <ChevronRight className="w-3 h-3 text-mint shrink-0 ml-1" />
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

