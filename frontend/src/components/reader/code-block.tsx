"use client";

import * as React from "react";
import { Copy, Check, ChevronDown, ChevronUp, Terminal } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CodeTab {
  label: string;
  code: string;
  language: string;
}

interface CodeBlockProps {
  code?: string;
  language?: string;
  filename?: string;
  highlightLines?: number[];
  tabs?: CodeTab[];
  isCollapsible?: boolean;
  defaultExpanded?: boolean;
  className?: string;
}

export function CodeBlock({
  code: rawCode = "",
  language = "typescript",
  filename,
  highlightLines = [],
  tabs,
  isCollapsible = false,
  defaultExpanded = true,
  className,
}: CodeBlockProps) {
  const [activeTab, setActiveTab] = React.useState<number>(0);
  const [isCopied, setIsCopied] = React.useState<boolean>(false);
  const [isExpanded, setIsExpanded] = React.useState<boolean>(defaultExpanded);

  const currentCode = tabs && tabs.length > 0 ? tabs[activeTab].code : rawCode;
  const currentLang = tabs && tabs.length > 0 ? tabs[activeTab].language : language;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentCode);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const lines = currentCode.trim().split("\n");

  return (
    <div
      className={cn(
        "my-6 rounded-xl border border-border bg-ink-950 text-slate-200 overflow-hidden shadow-lg",
        className
      )}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-ink-900 border-b border-ink-800/80 text-xs font-mono">
        {/* Left: Tabs or Filename */}
        <div className="flex items-center gap-2 overflow-x-auto">
          {tabs && tabs.length > 0 ? (
            <div className="flex items-center gap-1">
              {tabs.map((tab, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveTab(idx)}
                  className={cn(
                    "px-2.5 py-1 rounded-md text-xs transition-colors",
                    activeTab === idx
                      ? "bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30"
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          ) : filename ? (
            <div className="flex items-center gap-2 text-slate-300">
              <Terminal className="w-3.5 h-3.5 text-teal-300" />
              <span>{filename}</span>
            </div>
          ) : (
            <span className="text-slate-400 uppercase tracking-wider text-[11px]">
              {currentLang}
            </span>
          )}
        </div>

        {/* Right: Copy & Collapsible Trigger */}
        <div className="flex items-center gap-2">
          {isCollapsible && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-1 text-slate-400 hover:text-slate-200 px-2 py-1 rounded hover:bg-ink-800 transition-colors"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="w-3.5 h-3.5" /> <span>Collapse</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-3.5 h-3.5" /> <span>Show Solution</span>
                </>
              )}
            </button>
          )}

          <button
            onClick={handleCopy}
            aria-label="Copy code to clipboard"
            className="flex items-center gap-1 text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded hover:bg-ink-800 transition-colors border border-ink-700/50 text-[11px]"
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-emerald-400">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Code Content */}
      {isExpanded && (
        <div className="overflow-x-auto p-4 font-mono text-xs sm:text-sm leading-relaxed">
          <pre className="grid">
            {lines.map((line, index) => {
              const lineNum = index + 1;
              const isHighlighted = highlightLines.includes(lineNum);

              return (
                <div
                  key={index}
                  className={cn(
                    "table-row px-2 -mx-4 transition-colors",
                    isHighlighted && "bg-mint/10 border-l-2 border-mint"
                  )}
                >
                  <span className="table-cell pr-4 text-right select-none text-slate-500 font-mono text-xs w-8">
                    {lineNum}
                  </span>
                  <span className="table-cell text-ink-100 font-mono whitespace-pre">
                    {line || " "}
                  </span>
                </div>
              );
            })}
          </pre>
        </div>
      )}
    </div>
  );
}

