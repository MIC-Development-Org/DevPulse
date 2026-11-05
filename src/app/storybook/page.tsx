"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { ProgressRing } from "@/components/ui/progress-ring";
import { ProgressBar, SegmentedProgressBar } from "@/components/ui/progress-bar";
import { Skeleton } from "@/components/ui/skeleton";
import { Callout } from "@/components/reader/callout";
import { CodeBlock } from "@/components/reader/code-block";
import { GitVisualizer } from "@/components/interactive/git-visualizer";
import { useToast } from "@/components/ui/toast";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import {
  Sparkles,
  Terminal,
  Layers,
  Cpu,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCcw,
} from "lucide-react";

export default function StorybookPage() {
  const { showToast } = useToast();
  const [progressVal, setProgressVal] = React.useState<number>(75);

  return (
    <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto space-y-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-mint/20 bg-mint/5 px-3 py-1 text-xs text-mint font-mono mb-2">
            <Sparkles className="w-3.5 h-3.5" />
            <span>DESIGN SYSTEM CATALOG</span>
          </div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-foreground">
            DevPulse Component Gallery
          </h1>
          <p className="text-sm text-foreground/60 mt-1">
            Living component library covering all states, tokens, and micro-interactions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              showToast({
                title: "Toast Verified",
                description: "High-contrast notification rendered successfully.",
                type: "success",
              })
            }
          >
            Trigger Toast
          </Button>
        </div>
      </div>

      {/* 1. BUTTONS */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-foreground">
          1. Button System (Variants & Sizes)
        </h2>
        <div className="p-6 rounded-2xl border border-border bg-card space-y-6">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="primary">Primary Mint</Button>
            <Button variant="secondary">Secondary Glass</Button>
            <Button variant="outline">Outline Border</Button>
            <Button variant="ghost">Ghost Minimal</Button>
            <Button variant="danger">Danger Alert</Button>
            <Button variant="track-0">Track 0 Mint</Button>
            <Button variant="track-1">Track 1 Blue</Button>
            <Button variant="track-2">Track 2 Amber</Button>
            <Button variant="primary" isLoading>
              Loading State
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-border">
            <Button size="sm">Small (36px)</Button>
            <Button size="md">Medium (44px)</Button>
            <Button size="lg">Large (48px)</Button>
          </div>
        </div>
      </section>

      {/* 2. BADGES */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-foreground">
          2. Badge & Status Indicators
        </h2>
        <div className="p-6 rounded-2xl border border-border bg-card flex flex-wrap items-center gap-2.5">
          <Badge variant="default">Default Ink</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="mint">Track 0 Mint</Badge>
          <Badge variant="blue">Track 1 Blue</Badge>
          <Badge variant="amber">Track 2 Amber</Badge>
          <Badge variant="emerald">Passed (Mastery)</Badge>
          <Badge variant="rose">Retry Required</Badge>
        </div>
      </section>

      {/* 3. PROGRESS METRICS */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-foreground">
          3. Progress Rings & Segmented Bars
        </h2>
        <div className="p-6 rounded-2xl border border-border bg-card space-y-6">
          <div className="flex flex-wrap items-center gap-8 justify-around">
            <div className="text-center space-y-2">
              <ProgressRing value={progressVal} color="mint" size={110} />
              <p className="text-xs text-foreground/60 font-mono">Mint ({progressVal}%)</p>
            </div>
            <div className="text-center space-y-2">
              <ProgressRing value={100} color="emerald" size={110} />
              <p className="text-xs text-emerald-600 dark:text-emerald-400 font-mono">100% Mastered</p>
            </div>
            <div className="text-center space-y-2">
              <ProgressRing value={50} color="rose" size={110} />
              <p className="text-xs text-rose-600 dark:text-rose-400 font-mono">50% Retry</p>
            </div>
            <div className="text-center space-y-2">
              <ProgressRing value={85} color="blue" size={110} />
              <p className="text-xs text-track-1 font-mono">Full-Stack</p>
            </div>
          </div>

          <div className="space-y-2 pt-4 border-t border-border">
            <p className="text-xs font-mono text-foreground/50">Segmented Quiz Progress Bar (8 Questions):</p>
            <SegmentedProgressBar totalSegments={8} currentSegment={4} completedSegments={[0, 1, 2, 3]} />
          </div>
        </div>
      </section>

      {/* 4. CALLOUTS */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-foreground">
          4. Reader Callouts
        </h2>
        <div className="space-y-3">
          <Callout type="tip" title="Pro Tip: Fast-Forward Merges">
            When the target branch HEAD is an exact ancestor of your incoming branch, Git skips merge commit creation.
          </Callout>

          <Callout type="mistake" title="Common Mistake: Force Pushing to Shared Main">
            Never run git push --force on branches shared with team members. Use git push --force-with-lease instead.
          </Callout>

          <Callout type="warning" title="Security Warning: Private Keys in Client Bundles">
            Never embed Ethereum private keys or seed phrases in frontend React components. Always use hardware wallets or Web3 providers.
          </Callout>

          <Callout type="note" title="Architectural Note: EVM Storage Slots">
            EVM storage consists of 2^256 slots of 32 bytes each. SSTORE is the most gas-intensive opcode on Ethereum.
          </Callout>
        </div>
      </section>

      {/* 5. CODE BLOCK */}
      <section className="space-y-4">
        <h2 className="font-display text-xl font-bold text-foreground">
          5. Shiki Syntax Code Block
        </h2>
        <CodeBlock
          language="typescript"
          filename="useDebounce.ts"
          code={`import { useState, useEffect } from 'react';

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}`}
          highlightLines={[4, 8, 12]}
        />
      </section>
    </div>
  );
}

