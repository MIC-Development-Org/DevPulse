"use client";

import * as React from "react";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent } from "../ui/dialog";
import { useModKey } from "@/lib/shortcut";

interface ShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ShortcutsModal({ open, onOpenChange }: ShortcutsModalProps) {
  const modKey = useModKey();
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // If typing in input, ignore
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === "?" && !e.shiftKey) {
        // usually shift+/ is ?
      } else if (e.key === "?") {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onOpenChange]);

  const shortcutGroups = [
    {
      name: "Global Navigation",
      shortcuts: [
        { keys: [modKey, "K"], desc: "Open command palette" },
        { keys: ["?"], desc: "Open this keyboard shortcuts reference" },
        { keys: ["Esc"], desc: "Close any modal, drawer or palette" },
      ],
    },
    {
      name: "Quiz Player",
      shortcuts: [
        { keys: ["1", "2", "3", "4"], desc: "Select option directly" },
        { keys: ["Enter"], desc: "Confirm selection & advance question" },
        { keys: ["H"], desc: "Toggle question hint" },
        { keys: ["R"], desc: "Review all answers before submit" },
      ],
    },
    {
      name: "Module Reader",
      shortcuts: [
        { keys: ["N"], desc: "Toggle private module notes" },
        { keys: ["C"], desc: "Open module cheat sheet reference" },
        { keys: ["Alt", "←"], desc: "Navigate to previous module" },
        { keys: ["Alt", "→"], desc: "Navigate to next module / quiz" },
      ],
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader onClose={() => onOpenChange(false)}>
        <DialogTitle>Keyboard Shortcuts</DialogTitle>
        <DialogDescription>
          Master DevPulse with lightning keyboard-first workflows.
        </DialogDescription>
      </DialogHeader>

      <DialogContent className="space-y-6">
        {shortcutGroups.map((group) => (
          <div key={group.name} className="space-y-2.5">
            <h4 className="text-xs font-semibold text-mint uppercase tracking-wider">
              {group.name}
            </h4>
            <div className="space-y-2">
              {group.shortcuts.map((sc, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-sm py-1 border-b border-border/40 last:border-none"
                >
                  <span className="text-foreground/80">{sc.desc}</span>
                  <div className="flex items-center gap-1">
                    {sc.keys.map((k, j) => (
                      <kbd
                        key={j}
                        className="min-w-[24px] text-center px-1.5 py-0.5 rounded border border-border bg-card-subtle text-xs font-mono text-foreground font-semibold shadow-sm"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </DialogContent>
    </Dialog>
  );
}

