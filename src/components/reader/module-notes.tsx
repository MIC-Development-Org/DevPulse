"use client";

import * as React from "react";
import { Edit3, Check, Trash2, StickyNote } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "../ui/button";

interface ModuleNotesProps {
  moduleId: string;
  moduleTitle: string;
  className?: string;
}

export function ModuleNotes({
  moduleId,
  moduleTitle,
  className,
}: ModuleNotesProps) {
  const [notes, setNotes] = React.useState<string>("");
  const [saveStatus, setSaveStatus] = React.useState<"saved" | "saving">("saved");
  const [isOpen, setIsOpen] = React.useState<boolean>(false);

  const storageKey = `devpulse_notes_${moduleId}`;

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) setNotes(stored);
    } catch {
      // Ignore
    }
  }, [storageKey]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setNotes(val);
    setSaveStatus("saving");

    try {
      localStorage.setItem(storageKey, val);
      setTimeout(() => setSaveStatus("saved"), 500);
    } catch {
      // Ignore
    }
  };

  const handleClear = () => {
    if (confirm("Clear your private notes for this module?")) {
      setNotes("");
      try {
        localStorage.removeItem(storageKey);
      } catch {
        // Ignore
      }
    }
  };

  return (
    <div
      className={cn(
        "rounded-2xl border border-border bg-card p-5 shadow-sm space-y-3 transition-colors",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-left group"
        >
          <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-mint/10 text-mint">
            <StickyNote className="w-4 h-4" />
          </div>
          <div>
            <h4 className="font-display text-sm font-semibold text-foreground group-hover:text-mint transition-colors">
              Private Study Notes
            </h4>
            <p className="text-[11px] text-foreground/50">
              Autosaves locally to your device
            </p>
          </div>
        </button>

        <div className="flex items-center gap-2 text-xs">
          <span className="flex items-center gap-1 font-mono text-[11px] text-foreground/50">
            {saveStatus === "saving" ? (
              <>
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                Saved
              </>
            )}
          </span>

          {notes && (
            <button
              onClick={handleClear}
              title="Delete notes"
              className="text-foreground/40 hover:text-rose-600 dark:hover:text-rose-400 p-1 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <textarea
          value={notes}
          onChange={handleChange}
          placeholder="Jot down personal observations, tricky concepts, or questions for this lesson..."
          rows={isOpen ? 6 : 3}
          className="w-full rounded-xl border border-border bg-slate-50 dark:bg-ink-950/70 p-3 text-xs sm:text-sm text-foreground placeholder:text-foreground/40 focus:outline-none focus:ring-1 focus:ring-mint resize-y font-mono leading-relaxed shadow-sm"
        />
        <div className="flex items-center justify-between text-[11px] text-foreground/40 px-1">
          <span>Markdown formatting supported</span>
          <span>{notes.length} characters</span>
        </div>
      </div>
    </div>
  );
}

