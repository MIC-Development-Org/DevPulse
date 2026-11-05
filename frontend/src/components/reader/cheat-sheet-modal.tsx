"use client";

import * as React from "react";
import { CheatSheet } from "@/lib/contracts";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from "../ui/dialog";
import { Button } from "../ui/button";
import { Download, Copy, Check, FileCode2 } from "lucide-react";
import { useToast } from "../ui/toast";

interface CheatSheetModalProps {
  cheatSheet: CheatSheet;
  moduleTitle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CheatSheetModal({
  cheatSheet,
  moduleTitle,
  open,
  onOpenChange,
}: CheatSheetModalProps) {
  const { showToast } = useToast();
  const [copiedIndex, setCopiedIndex] = React.useState<number | null>(null);

  const handleCopy = async (code: string, idx: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Ignore
    }
  };

  const handleDownload = () => {
    let content = `# ${cheatSheet.title} - DevPulse\n`;
    content += `Module: ${moduleTitle}\n`;
    content += `Generated: ${new Date().toISOString()}\n\n`;
    content += `Summary: ${cheatSheet.summary}\n\n`;
    content += `----------------------------------------\n\n`;

    cheatSheet.snippets.forEach((s, idx) => {
      content += `### ${idx + 1}. ${s.title}\n`;
      content += `${s.explanation}\n\n`;
      content += `\`\`\`${s.language}\n${s.code}\n\`\`\`\n\n`;
    });

    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${moduleTitle.toLowerCase().replace(/[^a-z0-9]/g, "-")}-cheatsheet.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast({
      title: "Cheat Sheet Downloaded",
      description: "Saved as markdown reference file.",
      type: "success",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader onClose={() => onOpenChange(false)}>
        <div className="flex items-center gap-2">
          <FileCode2 className="w-5 h-5 text-mint" />
          <DialogTitle>{cheatSheet.title}</DialogTitle>
        </div>
        <DialogDescription>{cheatSheet.summary}</DialogDescription>
      </DialogHeader>

      <DialogContent className="max-h-[60vh] overflow-y-auto space-y-4 pr-1">
        {cheatSheet.snippets.map((snippet, idx) => (
          <div
            key={idx}
            className="rounded-xl border border-border bg-slate-50 dark:bg-ink-950/70 p-4 space-y-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-teal-700 dark:text-mint">
                {snippet.title}
              </span>
              <button
                onClick={() => handleCopy(snippet.code, idx)}
                className="flex items-center gap-1 text-[11px] text-foreground/60 hover:text-foreground px-2 py-0.5 rounded border border-border/50 hover:bg-card-subtle transition-colors"
              >
                {copiedIndex === idx ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    <span className="text-emerald-600 dark:text-emerald-400">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>

            <pre className="p-3 rounded-lg bg-ink-900 font-mono text-xs text-ink-100 overflow-x-auto whitespace-pre">
              <code>{snippet.code}</code>
            </pre>

            <p className="text-xs text-foreground/60 leading-relaxed">
              {snippet.explanation}
            </p>
          </div>
        ))}
      </DialogContent>

      <DialogFooter>
        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
          Close
        </Button>
        <Button variant="primary" size="sm" onClick={handleDownload}>
          <Download className="w-4 h-4 mr-1.5" /> Download (.md)
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

